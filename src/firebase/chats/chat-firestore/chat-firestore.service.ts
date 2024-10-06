import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Observable } from "rxjs";
import { AxiosResponse } from "axios";
import { ChatFirestoreHelperService } from "./chat-firestore-helper/chat-firestore-helper.service";
import { RegisterFirebaseDto } from "../dto/registerFirebaseDto.dto";
import { ProviderService } from "src/users/provider/provider.service";
import { TelegramService } from "src/telegram/telegram.service";
import { HttpService } from "@nestjs/axios";
import { UsersService } from "src/users/users.service";
import { AuthService } from "src/auth/auth.service";
import { UsersRepository } from "src/users/users.repository";
@Injectable()
export class ChatFirestoreService {
    private readonly serviceChatId: string;
    private readonly serviceChatData: object;
    constructor(
        private readonly chatFirestoreHelper: ChatFirestoreHelperService,
        private readonly usersRepository: UsersRepository,
        private readonly providerService: ProviderService,
        private readonly usersService: UsersService,
        private readonly authService: AuthService,
        private http: HttpService,
        private readonly configService: ConfigService,
        private readonly telegramService: TelegramService,
    ) {
        this.serviceChatId = this.configService.get("chat.serviceChatId");
        this.serviceChatData = this.configService.get("chat.serviceChatData");
    }
    /**
     * 發送群發訊息時 設定聊天室未讀訊息數量與最後一筆聊天內容
     * @param data
     */
    async setUnreadCountAndLastMessageByServiceChatSendNotifyMessage(data: { token: string; userId: string; loginUserId: string; receiveUserId: string; message: string; type: string }): Promise<any> {
        const message = data.type === "image" ? "傳送一張照片" : data.message;
        if (data.loginUserId === this.serviceChatId) {
            const isEmpty = await this.chatFirestoreHelper.checkReceiveUserChatRoomEmpty(data.loginUserId, data.receiveUserId);
            // 判斷聊天對象為空時建立資料
            if (isEmpty) {
                const receiverData = await this.usersService.getData(data.userId, data.token);
                // 設定聊天對象使用者資料
                await this.chatFirestoreHelper.setReceiverRoomData(receiverData, data.loginUserId, data.receiveUserId);
            }
            // 取得聊天對象未讀訊息數量
            const count = await this.chatFirestoreHelper.getReveiveUserUnReadTotal(data.loginUserId, data.receiveUserId);

            // 設定 未讀訊息數量 與最後一筆 聊天室內容
            await this.chatFirestoreHelper.setUnreadCountAndLastMessage(count, message, data.loginUserId, data.receiveUserId);
        }
        if (data.receiveUserId === this.serviceChatId) {
            // 設定聊天對象使用者資料
            await this.chatFirestoreHelper.setReceiverRoomData(this.serviceChatData, data.loginUserId, data.receiveUserId);
            // 判斷聊天對象是否有資料
            const userDataEmpty = await this.chatFirestoreHelper.checkUserChatRoomEmpty(data.loginUserId);
            if (userDataEmpty) {
                const userData = await this.usersService.getData(data.userId, data.token);
                // 設定聊天對象使用者資料
                await this.chatFirestoreHelper.setUserChatRoom(userData, data.loginUserId);
            }
            // 取得聊天對象未讀訊息數量
            let count = await this.chatFirestoreHelper.getReveiveUserUnReadTotal(data.loginUserId, data.receiveUserId);
            count += 1;
            // 設定 未讀訊息數量 與最後一筆 聊天室內容
            await this.chatFirestoreHelper.setUnreadCountAndLastMessage(count, message, data.loginUserId, data.receiveUserId);

            // 取得指定對象中所有聊天對象未讀訊息總計
            const userUnReadMessageCount = await this.chatFirestoreHelper.getUserUnReadMessageCount(data.loginUserId);
            // 更新 chat_rooms 中指定對象 所有未讀訊息數量
            await this.chatFirestoreHelper.updateUserUnReadMessageCount(data.loginUserId, userUnReadMessageCount + 1);
        }
        return { success: true };
    }
    /**
     * 設定聊天室未讀訊息數量與最後一筆聊天內容
     * @param data
     * @returns
     */
    async setUnreadCountAndLastMessage(data: {
        loginUserId: string;
        receiveUserId: string;
        message: string;
        loginUserData?: any;
        receiverData?: object;
        isProvider: boolean;
        isLogin?: boolean;
        justSendLoginUser?: boolean;
    }): Promise<any> {
        // 判斷只有發送登入對象時 不觸發
        if (!data.justSendLoginUser) {
            /**
             *
             *
             * 聊天對象聊天室設定
             *
             *
             */
            // 判斷聊天對象是否有資料
            const receiverDataEmpty = await this.chatFirestoreHelper.checkUserChatRoomEmpty(data.receiveUserId);
            // 聊天對象為空資料時建立 且非服務商身份（因為服務商身份的聊天對象不會缺少資料)
            if (receiverDataEmpty && !data.isProvider && !data.isLogin) {
                // 取得服務商資料
                const providerData = await this.providerService.getDataApi(data.receiveUserId);
                // 設定聊天對象使用者資料
                await this.chatFirestoreHelper.setUserChatRoom(providerData, data.receiveUserId);
            }
            // 取得聊天對象中 是否與 登入者聊過天
            const isReceiverRoomEmpty = await this.chatFirestoreHelper.checkReceiveUserChatRoomEmpty(data.receiveUserId, data.loginUserId);

            // 判斷聊天對象未建立與登入者聊天列表時觸發
            if (isReceiverRoomEmpty) {
                // 取得登入者資料
                const getClientUserProfile = await this.usersRepository.findOne({ column: "banana_id", value: data.loginUserId });
                // 建立聊天對象的使用者資料 (因為有可能 他只是點了某個 聊天功能進來 但是尚未聊過天 因此對方沒有此人的使用者資料)
                await this.chatFirestoreHelper.setReceiverRoomData(getClientUserProfile, data.receiveUserId, data.loginUserId);
            }

            // 取得聊天對象未讀訊息數量
            let count = await this.chatFirestoreHelper.getReveiveUserUnReadTotal(data.receiveUserId, data.loginUserId);
            count += 1;
            // 設定 未讀訊息數量 與最後一筆 聊天室內容
            await this.chatFirestoreHelper.setUnreadCountAndLastMessage(count, data.message, data.receiveUserId, data.loginUserId);

            // 判斷接收訊息對象為客服時才觸發
            if (data.receiveUserId === this.serviceChatId) {
                // 取得客服聊天對象未讀訊息總計
                let { unReadMessageCountByProvider, unReadMessageCountByMember } = await this.chatFirestoreHelper.getServcieChatUnReadMessageCount();
                if (data.isProvider) {
                    // 判斷是服務商，將客服聊天對象未讀訊息為 服務商 的總計欄位 +1
                    unReadMessageCountByProvider = unReadMessageCountByProvider + 1;
                } else {
                    // 判斷是會員，將客服聊天對象未讀訊息為 會員 的總計欄位 +1
                    unReadMessageCountByMember = unReadMessageCountByMember + 1;
                }
                // 更新客服未讀訊息總計數量
                await this.chatFirestoreHelper.updateServiceChatUnReadMessageCount(unReadMessageCountByProvider + unReadMessageCountByMember, unReadMessageCountByProvider, unReadMessageCountByMember);
            } else {
                // 取得指定對象中所有聊天對象未讀訊息總計
                const userUnReadMessageCount = await this.chatFirestoreHelper.getUserUnReadMessageCount(data.receiveUserId);
                // 更新 chat_rooms 中指定對象 所有未讀訊息數量
                await this.chatFirestoreHelper.updateUserUnReadMessageCount(data.receiveUserId, userUnReadMessageCount + 1);
            }
        }

        /**
         *
         *
         * 登入者聊天室設定
         *
         *
         */
        if (data.isLogin) {
            // 設定 未讀訊息數量 與最後一筆 聊天室內容
            await this.chatFirestoreHelper.setUnreadCountAndLastMessage(1, data.message, data.loginUserId, data.receiveUserId);
        } else {
            // 設定 未讀訊息數量 與最後一筆 聊天室內容
            await this.chatFirestoreHelper.setUnreadCountAndLastMessage(0, data.message, data.loginUserId, data.receiveUserId);
        }
        // 非客服聊天對象時 與 客服聊天對象更新 未讀訊息總計方式 不一樣 因此多此判斷
        if (data.receiveUserId === this.serviceChatId) {
            // 更新登入者與客服聊天未讀訊息數量總計
            await this.chatFirestoreHelper.updateUserUnReadMessageCountByServiceChat(data.loginUserId);
        }
        return { success: true };
    }

    /**
     * cms 客服與會員聊天設定未讀訊息數量
     */
    async setServiceChatUnreadCountAndLastMessage(data: { receiveUserId: string; message: string }) {
        // 取得聊天對象未讀訊息數量
        let count = await this.chatFirestoreHelper.getReveiveUserUnReadTotal(data.receiveUserId, this.serviceChatId);
        count += 1;
        // 設定聊天對象 未讀訊息數量 與最後一筆 聊天室內容
        await this.chatFirestoreHelper.setUnreadCountAndLastMessage(count, data.message, data.receiveUserId, this.serviceChatId);
        // 設定本身 未讀訊息數量 與最後一筆 聊天室內容
        await this.chatFirestoreHelper.setUnreadCountAndLastMessage(0, data.message, this.serviceChatId, data.receiveUserId);
        // 更新登入者與客服聊天未讀訊息數量總計
        await this.chatFirestoreHelper.updateUserUnReadMessageCountByServiceChat(data.receiveUserId);
        return { success: true };
    }
    /**
     * cms 客服與會員聊天設定未讀訊息數量
     */
    async setCityAIChatUnreadCountAndLastMessage(data: { loginUserId: string; receiveUserId: string; message: string }) {
        /**
         * 聊天對象資料更新
         */

        // 取得聊天對象未讀訊息數量
        let receiveUserUnReadCount = await this.chatFirestoreHelper.getReveiveUserUnReadTotal(data.receiveUserId, data.loginUserId);
        receiveUserUnReadCount += 1;
        // 設定聊天對象 未讀訊息數量 與最後一筆 聊天室內容
        await this.chatFirestoreHelper.setUnreadCountAndLastMessage(receiveUserUnReadCount, data.message, data.receiveUserId, data.loginUserId);
        // 取得指定對象中所有聊天對象未讀訊息總計
        const receiveUserAllUnReadMessageCount = await this.chatFirestoreHelper.getUserUnReadMessageCount(data.receiveUserId);
        // 更新 聊天對象 所有未讀訊息數量
        await this.chatFirestoreHelper.updateUserUnReadMessageCount(data.receiveUserId, receiveUserAllUnReadMessageCount + 1);

        /**
         * 登入者資料更新
         */

        // 取得指定對象中所有聊天對象未讀訊息總計
        const userAllUnReadMessageCount = await this.chatFirestoreHelper.getUserUnReadMessageCount(data.loginUserId);
        // 取得聊天對象未讀訊息數量
        const userUnReadCount = await this.chatFirestoreHelper.getReveiveUserUnReadTotal(data.loginUserId, data.receiveUserId);
        // 更新  所有登入者全部未讀訊息數量
        await this.chatFirestoreHelper.updateUserUnReadMessageCount(data.loginUserId, userAllUnReadMessageCount - userUnReadCount <= 0 ? 0 : userAllUnReadMessageCount - userUnReadCount);
        // 設定本身 未讀訊息數量 與最後一筆 聊天室內容 (此筆資料一定要在 updateUserUnReadMessageCount 做完事後才更新 否則聊天對象未讀數量會歸 0 計算未讀數量時會出問題)
        await this.chatFirestoreHelper.setUnreadCountAndLastMessage(0, data.message, data.loginUserId, data.receiveUserId);
        // 更新已讀時間
        await this.chatFirestoreHelper.setReadedTime(data.receiveUserId, data.loginUserId);
        return { success: true };
    }
    /**
     * 註冊時 firestore 需建立資料
     * @param data RegisterFirebaseDto
     */
    async setUserRomData(data: RegisterFirebaseDto, message: string): Promise<any> {
        // // 生成 jwt
        const { access_token } = await this.authService.createToken({ phone: data.userData.phone, userId: data.userData.id });
        // 取得登入者資料

        const getClientUserProfile = await this.authService.getClientUserProfile({ token: access_token });
        // const getClientUserProfile = await this.usersRepository.findOne({ column: "phone", value: data.userData.phone });
        // console.log(getClientUserProfile.activities, "work abc");
        // 創建或更新自己的使用者資料
        await this.chatFirestoreHelper.setUserChatRoom(getClientUserProfile, getClientUserProfile.banana_id);
        // 新增自己的聊天對象
        await this.chatFirestoreHelper.setReceiverRoomData(this.serviceChatData, getClientUserProfile.banana_id, this.serviceChatId);
        // 新增系統客服聊天對象
        await this.chatFirestoreHelper.setReceiverRoomData(getClientUserProfile, this.serviceChatId, getClientUserProfile.banana_id);
        // 判斷需要將客服設定為機器人時觸發
        if (data.needResetChatToBot) {
            // 將客服設定為機器人
            await this.chatFirestoreHelper.setServiceChatToBot(getClientUserProfile.banana_id, this.serviceChatId);
            // 客服的聊天對象設定為機器人
            await this.chatFirestoreHelper.setServiceChatToBot(this.serviceChatId, getClientUserProfile.banana_id);
        }
        // 判斷是否需要發送預設歡迎訊息
        if (data.needSendWelcomeMessage) {
            // 設定最後一筆訊息資料與未讀訊息數量
            await this.setUnreadCountAndLastMessage({
                loginUserId: getClientUserProfile.banana_id,
                receiveUserId: this.serviceChatId,
                message,
                loginUserData: getClientUserProfile,
                isProvider: false,
                isLogin: true,
            });
        }
    }

    /**
     * 設定真人客服與發送 telegram 訊息
     */
    async setServiceChatToRealAndSendTelegramContact(data: { userId: string; userName: string }) {
        // 將客服設定為真人
        await this.chatFirestoreHelper.setServiceChatToReal(data.userId, this.serviceChatId);
        // 客服的聊天對象設定為真人
        await this.chatFirestoreHelper.setServiceChatToReal(this.serviceChatId, data.userId);
        // 發送 telegram 訊息到客服群組
        await this.telegramService.contact(data);
    }

    /**
     * 更新聊天對象資料
     */
    async chatRoomReceiverDataUpdate(data: { loginUserId: string }) {
        // 聊天對象 banana id
        const recivierIds = await this.chatFirestoreHelper.getChatRoomUserReceiverKeys(data.loginUserId);
        // 從資料庫撈取登入者資料
        const userData = await this.usersRepository.findOne({ column: "banana_id", value: data.loginUserId });
        // 創建 jwt token
        const { access_token: token } = await this.authService.createToken({ phone: userData.phone, userId: userData.id });
        // 取得 php api 登入者 profile 資料 （因為此 api 資料比較完善 所以透過此 api 取得 profile)
        const userProfile = await this.authService.getClientUserProfile({ token });
        // 更新聊天對象資料
        await this.chatFirestoreHelper.chatRoomReceiverDataUpdate(data.loginUserId, recivierIds, userProfile);
        // 更新自己聊天室資料
        await this.chatFirestoreHelper.updateChatRoomUserData(data.loginUserId, userProfile);
        return { success: true };
    }
}

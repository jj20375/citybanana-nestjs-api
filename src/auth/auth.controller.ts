import { Controller, Post, Get, Req, Res, Body, Headers, HttpStatus, UseGuards, HttpException, UseInterceptors, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthGuard } from "@nestjs/passport";
import { LocalAuthGuard } from "./local-auth.guard";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { UsersService } from "src/users/users.service";
import { GoogleOauthService } from "src/users/google/google-oauth.service";
import { RegisterOauthUserDto } from "src/users/dto/registerOauthUserDto.dto";
import { LoginUserDto } from "./login-user.dto";
import { GoogleUserRepository } from "src/users/google/google-user.repository";
import { TransactionInterceptor } from "src/database/database-transaction.interceptor";
import { TransactionParam } from "src/database/database-transaction.decorator";
import { Transaction } from "sequelize";
import { UsersRepository } from "src/users/users.repository";
import { FacebookAuthGuard } from "./facebook-auth.guard";
import { LineOauthService } from "src/users/line/line-oauth.service";
import { FacebookUserRepository } from "src/users/facebook/facebook-user.repository";
import { HttpService } from "@nestjs/axios";
import { LineUserRepository } from "src/users/line/line-user.repository";
import { AppleOauthService } from "src/users/apple/apple-oauth.service";
import { AppleUserRepository } from "src/users/apple/apple-user.repository";
import { RegisterAppleOauthUserDto } from "src/users/dto/registerAppleOauthUserDto";
import { RegisterUserDto } from "src/users/dto/registerUserDto.dto";
import { IGoogleUserInfo } from "src/users/google/google-user.interface";
import { LoggerService } from "src/logger/logger.service";

// 在 google 登入｜註冊｜綁定流程時 需要判斷 此兩種裝置走額外機制
const googleAuthDeviceCheck = ["web", "android"];
@Controller("auth")
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
        private readonly usersRepository: UsersRepository,
        private readonly googleOauthService: GoogleOauthService,
        private readonly googleUserRepository: GoogleUserRepository,
        private readonly facebookUserRepository: FacebookUserRepository,
        private readonly lineOauthService: LineOauthService,
        private readonly lineUserRepository: LineUserRepository,
        private readonly appleOauthService: AppleOauthService,
        private readonly appleUserRepository: AppleUserRepository,
        private readonly loggerService: LoggerService,
        private http: HttpService,
    ) {}
    @UseGuards(LocalAuthGuard)
    @Post("login")
    async login(@Req() req, @Body() user: LoginUserDto) {
        const { access_token } = await this.authService.login(req.user);
        return {
            ...req.user,
            access_token,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get("test")
    async testWork(@Req() req, @Res() res) {
        console.log(req.user, req.headers);
        return res.status(HttpStatus.OK).json({ test: "auth work" });
    }

    @UseInterceptors(TransactionInterceptor)
    @Post("/register")
    // 新增使用者
    async register(@Body() body: RegisterUserDto, @Res() res, @TransactionParam() transaction: Transaction, @Headers() headers) {
        const isVerify = await this.usersService.verifyRegisterCrumb({
            phone: body.phone,
            crumb: body.crumb,
        });
        if (!isVerify) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊驗證失敗",
                    error: {
                        error: "n3009",
                        msg: "註冊驗證失敗有可能是 crumb 比對失敗或 verifiedAt 超過當下時間",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        console.time("register time");
        try {
            const result: any = await this.usersRepository.create(body, headers, transaction);
            await transaction.commit();
            // 等待交易事件做完後再觸發
            console.log("等待交易事件做完後再觸發 transaction.afterCommit(async () => {");
            // 判斷有使用邀請碼時 需加上邀請碼傳送 key
            if (body.hasOwnProperty("invitation_code")) {
                result.user.invitation_code = body.invitation_code;
            }
            // 發送註冊後事件
            console.log(" this.usersService.registeredEvents");
            console.timeLog("register time");
            // 取得個人資料
            console.log("this.usersRepository.findOne");
            console.timeLog("register time");
            const userProfile = await this.usersRepository.findOne({
                column: "id",
                value: result.user.id,
            });
            console.log("註冊成功使用者資料 =>", userProfile);
            console.timeEnd("register time");

            return res.status(HttpStatus.OK).json({ user: userProfile, access_token: result.access_token });
        } catch (err) {
            console.log("註冊失敗 n3007 => ", err);
            console.timeEnd("register time");
            this.loggerService.error({
                title: "註冊失敗 n3007",
                err,
            });
            if (transaction) {
                await transaction.rollback();
            }
            // 判斷是否有其他 error 時 回傳 其他 error 值
            if (err.response !== undefined) {
                throw new HttpException(
                    {
                        statusCode: err.response.statusCode,
                        msg: err.response.msg,
                        error: {
                            error: err.response.error.error,
                            msg: err.response.error.msg,
                        },
                    },
                    err.status,
                );
            } else {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.BAD_REQUEST,
                        msg: "新增使用者失敗",
                        error: {
                            error: "n3007",
                            msg: err,
                        },
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
        }
    }

    @Post("google-oauth2-login")
    // Google 登入
    async googleLogin(@Body() body: { access_token: string; device?: string }, @Res() res) {
        let oauthInfo: any = {};
        // 判斷是 web 時 要執行別種驗證方式
        if (googleAuthDeviceCheck.includes(body.device)) {
            // 驗證 google 登入 並回傳使用者資料
            oauthInfo = await this.googleOauthService.authenticateByWeb({
                accessToken: body.access_token,
            });
        } else {
            // 驗證 google 登入 並回傳使用者資料
            oauthInfo = await this.googleOauthService.authenticate({
                accessToken: body.access_token,
            });
        }

        // 取得 Google User 資料
        const googleUser = await this.googleUserRepository.findOne({
            column: "email",
            value: oauthInfo.email,
        });
        // 判斷沒有資料時 代表尚未綁定 googleUser
        if (googleUser === null || googleUser.user === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.UNAUTHORIZED,
                    msg: "尚未綁定 Google user",
                    error: {
                        error: 1014,
                        msg: "尚未綁定 Google user",
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }
        // 判斷是否已被停權
        await this.authService.hasSuspended({ phone: googleUser.user.phone });
        // 更新資料
        await this.googleUserRepository.update(oauthInfo, googleUser.user.id);

        // 取得 token
        const { access_token } = await this.authService.createToken({
            phone: googleUser.user.phone,
            userId: googleUser.user.id,
        });
        // 取得個人資料
        const userProfile = await this.usersRepository.findOne({
            column: "id",
            value: googleUser.user.id,
        });
        return res.status(HttpStatus.OK).json({ access_token, user: userProfile });
    }
    @UseInterceptors(TransactionInterceptor)
    @Post("google-oauth2-register")
    // Google 註冊
    async googleUserRegister(@Body() body: RegisterOauthUserDto, @Res() res, @TransactionParam() transaction: Transaction, @Headers() headers) {
        // 驗證簡訊成功後 註冊碼(crumb) 比對是否確
        const isVerify = await this.usersService.verifyRegisterCrumb({
            phone: body.phone,
            crumb: body.crumb,
        });
        if (!isVerify) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊驗證失敗",
                    error: {
                        error: "n3009",
                        msg: "註冊驗證失敗有可能是 crumb 比對失敗或 verifiedAt 超過當下時間",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        // 新增使用者帳號
        const result: any = await this.usersRepository.create(body, headers, transaction);
        // 創建或更新 Google User
        await this.googleUserRepository.createOrUpdate(
            {
                access_token: body.access_token,
                userId: result.user.id,
                device: body.device,
            },
            transaction,
        );
        await transaction.commit();
        // 判斷有使用邀請碼時 需加上邀請碼傳送 key
        if (body.hasOwnProperty("invitation_code")) {
            result.user.invitation_code = body.invitation_code;
        }
        // 取得個人資料
        const userProfile = await this.usersRepository.findOne({
            column: "id",
            value: result.user.id,
        });
        return res.status(HttpStatus.OK).json({ access_token: result.access_token, user: userProfile });
    }
    @UseInterceptors(TransactionInterceptor)
    @Post("google-oauth2-bind")
    // Google 綁定
    async bindGoogleUser(@Body() body: { access_token: string; phone: string; device?: string }, @Res() res, @TransactionParam() transaction: Transaction) {
        // 判斷是否已被停權
        await this.authService.hasSuspended({ phone: body.phone });
        // 取得使用者資料
        const user: any = await this.usersRepository.findOne({
            column: "phone",
            value: body.phone,
        });
        // 判斷該帳號是否有綁定第三方登入
        if (user.google_user !== null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "此 平台 帳號已綁定 Google 登入",
                    error: {
                        error: "n3017",
                        msg: "此 平台 帳號已綁定 Google 登入",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        // 創建或更新 Google User
        await this.googleUserRepository.createOrUpdate({ access_token: body.access_token, userId: user.id, device: body.device }, transaction);

        transaction.afterCommit(async () => {
            // 取得 token
            const { access_token } = await this.authService.createToken({
                phone: body.phone,
                userId: user.id,
            });
            return res.status(HttpStatus.OK).json({ access_token, user });
        });
        await transaction.commit();
    }
    @UseGuards(JwtAuthGuard)
    @Post("google-oauth2-unbind")
    // Google 解除綁定
    async unbindGoogleUser(@Req() req, @Res() res) {
        const result = await this.googleUserRepository.updateUserIdToNull(req.user.sub);
        return res.status(HttpStatus.OK).json({ ...result });
    }

    @UseGuards(FacebookAuthGuard)
    @Post("facebook-oauth2-login")
    // Facebook 登入
    async facebookLogin(@Req() req, @Res() res) {
        // 取得 Facebook User 資料
        const facebookUser = await this.facebookUserRepository.findOne({
            column: "asid",
            value: req.user.id,
        });
        // 判斷沒有資料時 代表尚未綁定 facebookUser
        if (facebookUser === null || facebookUser.user === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.UNAUTHORIZED,
                    msg: "尚未綁定 Facebook user",
                    error: {
                        error: 1014,
                        msg: "尚未綁定 Facebook user",
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }
        // 判斷是否已被停權
        await this.authService.hasSuspended({ phone: facebookUser.user.phone });
        // 更新資料
        await this.facebookUserRepository.update(req.user, facebookUser.user.id);

        // 取得 token
        const { access_token } = await this.authService.createToken({
            phone: facebookUser.user.phone,
            userId: facebookUser.user.id,
        });
        // 取得個人資料
        const userProfile = await this.usersRepository.findOne({
            column: "id",
            value: facebookUser.user.id,
        });
        return res.status(HttpStatus.OK).json({ access_token, user: userProfile });
    }

    @UseGuards(FacebookAuthGuard)
    @UseInterceptors(TransactionInterceptor)
    @Post("facebook-oauth2-register")
    // Facebook 註冊
    async facebookUserRegister(@Req() req, @Body() body: RegisterOauthUserDto, @Res() res, @TransactionParam() transaction: Transaction, @Headers() headers) {
        // 驗證簡訊成功後 註冊碼(crumb) 比對是否確
        const isVerify = await this.usersService.verifyRegisterCrumb({
            phone: body.phone,
            crumb: body.crumb,
        });
        if (!isVerify) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊驗證失敗",
                    error: {
                        error: "n3009",
                        msg: "註冊驗證失敗有可能是 crumb 比對失敗或 verifiedAt 超過當下時間",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        // 新增使用者帳號
        const result: any = await this.usersRepository.create(body, headers, transaction);
        // 創建或更新 Facebook User
        await this.facebookUserRepository.createOrUpdate({ userId: result.user.id, asid: req.user.id, oauthInfo: req.user }, transaction);
        await transaction.commit();
        // 判斷有使用邀請碼時 需加上邀請碼傳送 key
        if (body.hasOwnProperty("invitation_code")) {
            result.user.invitation_code = body.invitation_code;
        }
        // 取得個人資料
        const userProfile = await this.usersRepository.findOne({
            column: "id",
            value: result.user.id,
        });
        return res.status(HttpStatus.OK).json({ access_token: result.access_token, user: userProfile });
    }

    @UseGuards(FacebookAuthGuard)
    @UseInterceptors(TransactionInterceptor)
    @Post("facebook-oauth2-bind")
    // Facebook 綁定
    async bindFacebookUser(@Req() req, @Body() body: { access_token: string; phone: string }, @Res() res, @TransactionParam() transaction: Transaction) {
        // 判斷是否已被停權
        await this.authService.hasSuspended({ phone: body.phone });
        // 取得使用者資料
        const user: any = await this.usersRepository.findOne({
            column: "phone",
            value: body.phone,
        });
        // 判斷該帳號是否有綁定第三方登入
        if (user.facebook_user !== null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "此 平台 帳號已綁定 Facebook 登入",
                    error: {
                        error: "n3018",
                        msg: "此 平台 帳號已綁定 Facebook 登入",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        // 創建或更新 Facebook User
        await this.facebookUserRepository.createOrUpdate({ userId: user.id, asid: req.user.id, oauthInfo: req.user }, transaction);
        transaction.afterCommit(async () => {
            // 取得 token
            const { access_token } = await this.authService.createToken({
                phone: body.phone,
                userId: user.id,
            });

            return res.status(HttpStatus.OK).json({ access_token, user });
        });
        await transaction.commit();
    }
    @UseGuards(JwtAuthGuard)
    @Post("facebook-oauth2-unbind")
    // Facebook 解除綁定
    async unbindFacebookUser(@Req() req, @Res() res) {
        const result = await this.facebookUserRepository.updateUserIdToNull(req.user.sub);
        return res.status(HttpStatus.OK).json({ ...result });
    }

    @Post("line-oauth2-login")
    // LINE 登入
    async lineLogin(@Req() req, @Res() res, @Body() body) {
        // 判斷是否 http header 有帶上 jwt 如果沒有從 body 資料拿
        const accessToken = `Bearer ${body.access_token}`;
        // 驗證 LINE access token
        const oauthData = await this.lineOauthService.authenticate({
            accessToken,
        });
        // 檢查是否加官方帳號為好友
        const friendshipStatus = await this.lineOauthService.getFriendshipStatus({
            accessToken,
        });
        if (friendshipStatus.friendFlag == false) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.PRECONDITION_FAILED,
                    msg: "尚未加 LINE 官方帳號為好友",
                    error: {
                        error: "n7018",
                        msg: "尚未加 LINE 官方帳號為好友",
                    },
                },
                HttpStatus.PRECONDITION_FAILED,
            );
        }

        // 取得 LINE User 資料
        const lineUser = await this.lineUserRepository.findOne({
            column: "midori_id",
            value: oauthData.userId,
        });
        // 判斷沒有資料時 代表尚未綁定 lineUser
        if (lineUser === null || lineUser.user === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.UNAUTHORIZED,
                    msg: "尚未綁定 LINE user",
                    error: {
                        error: 1014,
                        msg: "尚未綁定 LINE user",
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }
        // 判斷是否已被停權
        await this.authService.hasSuspended({ phone: lineUser.user.phone });
        // 更新資料
        await this.lineUserRepository.update(oauthData, lineUser.user.id);

        // 取得 token
        const { access_token } = await this.authService.createToken({
            phone: lineUser.user.phone,
            userId: lineUser.user.id,
        });
        // 取得個人資料
        const userProfile = await this.usersRepository.findOne({
            column: "id",
            value: lineUser.user.id,
        });
        return res.status(HttpStatus.OK).json({ access_token, user: userProfile });
    }

    @UseInterceptors(TransactionInterceptor)
    @Post("line-oauth2-register")
    // LINE 註冊
    async lineUserRegister(@Body() body: RegisterOauthUserDto, @Res() res, @TransactionParam() transaction: Transaction, @Headers() headers) {
        // 驗證簡訊成功後 註冊碼(crumb) 比對是否確
        const isVerify = await this.usersService.verifyRegisterCrumb({
            phone: body.phone,
            crumb: body.crumb,
        });
        if (!isVerify) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊驗證失敗",
                    error: {
                        error: "n3009",
                        msg: "註冊驗證失敗有可能是 crumb 比對失敗或 verifiedAt 超過當下時間",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        // 新增使用者帳號
        const result: any = await this.usersRepository.create(body, headers, transaction);
        // 創建或更新 Line user
        await this.lineUserRepository.createOrUpdate({ access_token: `Bearer ${body.access_token}`, userId: result.user.id }, transaction);
        await transaction.commit();
        // 判斷有使用邀請碼時 需加上邀請碼傳送 key
        if (body.hasOwnProperty("invitation_code")) {
            result.user.invitation_code = body.invitation_code;
        }
        // 取得個人資料
        const userProfile = await this.usersRepository.findOne({
            column: "id",
            value: result.user.id,
        });
        return res.status(HttpStatus.OK).json({ access_token: result.access_token, user: userProfile });
    }
    @UseInterceptors(TransactionInterceptor)
    @Post("line-oauth2-bind")
    // LINE 綁定
    async bindLineUser(@Body() body: { access_token: string; phone: string }, @Res() res, @TransactionParam() transaction: Transaction) {
        // 判斷是否已被停權
        await this.authService.hasSuspended({ phone: body.phone });
        // 取得使用者資料
        const user: any = await this.usersRepository.findOne({
            column: "phone",
            value: body.phone,
        });
        // 判斷該帳號是否有綁定第三方登入
        if (user.line_user !== null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "此 平台 帳號已綁定 LINE 登入",
                    error: {
                        error: "n3016",
                        msg: "此 平台 帳號已綁定 LINE 登入",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        // 創建或更新 LINE User
        await this.lineUserRepository.createOrUpdate({ access_token: `Bearer ${body.access_token}`, userId: user.id }, transaction);
        transaction.afterCommit(async () => {
            // 取得 token
            const { access_token } = await this.authService.createToken({
                phone: body.phone,
                userId: user.id,
            });
            return res.status(HttpStatus.OK).json({ access_token, user });
        });
        await transaction.commit();
    }
    @UseGuards(JwtAuthGuard)
    @Post("line-oauth2-unbind")
    // LINE 解除綁定
    async unbindLineUser(@Req() req, @Res() res) {
        const result = await this.lineUserRepository.updateUserIdToNull(req.user.sub);
        return res.status(HttpStatus.OK).json({ ...result });
    }
    @UseGuards(JwtAuthGuard)
    @Post("line-verify-access-token")
    // LINE 解除綁定
    async verifyLineAccessToken(@Body() body: { access_token: string }, @Res() res) {
        const result = await this.lineOauthService.verifyAccessToken({
            accessToken: body.access_token,
        });
        return res.status(HttpStatus.OK).json({ ...result });
    }

    @Post("apple-oauth2-login")
    // Apple 登入
    async appleLogin(@Req() req, @Res() res, @Body() body: { id_token: string }) {
        // 驗證 apple identity token
        const oauthData = await this.appleOauthService.authenticate({
            identifyToken: body.id_token,
        });
        // 取得 Apple User 資料
        const appleUser = await this.appleUserRepository.findOne({
            column: "email",
            value: oauthData.email,
        });
        // 判斷沒有資料時 代表尚未綁定 Apple User
        if (appleUser === null || appleUser.user === null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.UNAUTHORIZED,
                    msg: "尚未綁定 Apple user",
                    error: {
                        error: 1014,
                        msg: "尚未綁定 Apple user",
                    },
                },
                HttpStatus.UNAUTHORIZED,
            );
        }
        // 判斷是否已被停權
        await this.authService.hasSuspended({ phone: appleUser.user.phone });
        // 更新資料
        await this.appleUserRepository.update(oauthData, appleUser.user.id);

        // 取得 token
        const { access_token } = await this.authService.createToken({
            phone: appleUser.user.phone,
            userId: appleUser.user.id,
        });
        // 取得個人資料
        const userProfile = await this.usersRepository.findOne({
            column: "id",
            value: appleUser.user.id,
        });
        return res.status(HttpStatus.OK).json({ access_token, user: userProfile });
    }
    @UseInterceptors(TransactionInterceptor)
    @Post("apple-oauth2-register")
    // Apple 註冊
    async appleUserRegister(@Body() body: RegisterAppleOauthUserDto, @Res() res, @TransactionParam() transaction: Transaction, @Headers() headers) {
        // 驗證簡訊成功後 註冊碼(crumb) 比對是否確
        const isVerify = await this.usersService.verifyRegisterCrumb({
            phone: body.phone,
            crumb: body.crumb,
        });
        if (!isVerify) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "註冊驗證失敗",
                    error: {
                        error: "n3009",
                        msg: "註冊驗證失敗有可能是 crumb 比對失敗或 verifiedAt 超過當下時間",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        // 創建使用者
        const result: any = await this.usersRepository.create(body, headers, transaction);

        // 創建或更新 Apple User
        await this.appleUserRepository.createOrUpdate({ id_token: `${body.id_token}`, userId: result.user.id }, transaction);
        await transaction.commit();
        // 判斷有使用邀請碼時 需加上邀請碼傳送 key
        if (body.hasOwnProperty("invitation_code")) {
            result.user.invitation_code = body.invitation_code;
        }
        // 取得個人資料
        const userProfile = await this.usersRepository.findOne({
            column: "id",
            value: result.user.id,
        });
        return res.status(HttpStatus.OK).json({ access_token: result.access_token, user: userProfile });
    }
    @UseInterceptors(TransactionInterceptor)
    @Post("apple-oauth2-bind")
    // Apple 綁定
    async bindAppleUser(@Body() body: { id_token: string; phone: string }, @Res() res, @TransactionParam() transaction: Transaction) {
        // 判斷是否已被停權
        await this.authService.hasSuspended({ phone: body.phone });
        // 取得使用者資料
        const user: any = await this.usersRepository.findOne({
            column: "phone",
            value: body.phone,
        });
        // 判斷該帳號是否有綁定第三方登入
        if (user.apple_user !== null) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.BAD_REQUEST,
                    msg: "此 平台 帳號已綁定 Apple 登入",
                    error: {
                        error: "n3016",
                        msg: "此 平台 帳號已綁定 Apple 登入",
                    },
                },
                HttpStatus.BAD_REQUEST,
            );
        }
        // 創建或更新 Apple User
        await this.appleUserRepository.createOrUpdate({ id_token: `${body.id_token}`, userId: user.id }, transaction);
        transaction.afterCommit(async () => {
            // 取得 token
            const { access_token } = await this.authService.createToken({
                phone: body.phone,
                userId: user.id,
            });
            return res.status(HttpStatus.OK).json({ access_token, user });
        });
        await transaction.commit();
    }
    @UseGuards(JwtAuthGuard)
    @Post("apple-oauth2-unbind")
    // Apple 解除綁定
    async unbindAppleUser(@Req() req, @Res() res) {
        const result = await this.appleUserRepository.updateUserIdToNull(req.user.sub);
        return res.status(HttpStatus.OK).json({ ...result });
    }

    // /**
    //  * 取得簡訊驗證碼資料（測試）
    //  * @param res
    //  * @param query
    //  * @returns
    //  */
    // @Get("verify-code-info")
    // async getAuthVerifyCodeInfo(@Res() res, @Query() query) {
    //     try {
    //         const result = await this.authService.getCacheAuthVerifyCodeInfo(`auth:verify-code:${query.phone}`);
    //         return res.status(HttpStatus.OK).json(result);
    //     } catch (err) {
    //         throw new HttpException(
    //             {
    //                 statusCode: HttpStatus.BAD_REQUEST,
    //                 msg: "取得簡訊驗證碼資料失敗",
    //                 error: {
    //                     error: "",
    //                     msg: err,
    //                 },
    //             },
    //             HttpStatus.BAD_REQUEST
    //         );
    //     }
    // }

    @Post("createToken")
    async createToken(@Body() body: { phone: string; userId: string }, @Res() res) {
        const { access_token } = await this.authService.createToken({
            phone: body.phone,
            userId: body.userId,
        });
        return res.status(HttpStatus.OK).json({ access_token });
    }
}

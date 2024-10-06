import { registerAs } from "@nestjs/config";

export default registerAs("areas", () => ({
    "TW-TPE": {
        key: "Taipei",
        name: "台北",
    },
    "TW-NWT": {
        key: "New Taipei",
        name: "新北",
    },
    "TW-KEE": {
        key: "Keelung",
        name: "基隆",
    },
    "TW-TAO": {
        key: "Taoyuan",
        name: "桃園",
    },
    "TW-HSZ": {
        key: "Hsinchu",
        name: "新竹",
    },
    "TW-MIA": {
        key: "Miaoli",
        name: "苗栗",
    },
    "TW-TXG": {
        key: "Taichung",
        name: "台中",
    },
    "TW-CHA": {
        key: "Changhua",
        name: "彰化",
    },
    "TW-NAN": {
        key: "Nantou",
        name: "南投",
    },
    "TW-YUN": {
        key: "Yunlin",
        name: "雲林",
    },
    "TW-CYI": {
        key: "Chiayi",
        name: "嘉義",
    },
    "TW-TNN": {
        key: "Tainan",
        name: "台南",
    },
    "TW-KHH": {
        key: "Kaohsiung",
        name: "高雄",
    },
    "TW-PIF": {
        key: "Pingtung",
        name: "屏東",
    },
    "TW-ILA": {
        key: "Yilan",
        name: "宜蘭",
    },
    "TW-HUA": {
        key: "Hualien",
        name: "花蓮",
    },
    "TW-TTT": {
        key: "Taitung",
        name: "台東",
    },
}));

import { Logger } from "@nestjs/common";
import * as admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";
import * as fs from "fs";
import moment from "moment";

export class FirebaseInitApp {
    protected firebaseApp: any;
    protected firebaseAdminKey = fs.readFileSync(process.env.FIREBASE_ADMIN_KEY_PATH, "utf8");
    constructor() {
        if (!admin.apps.length) {
            this.firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(this.firebaseAdminKey) as ServiceAccount),
                storageBucket: "gs://citybanana-cdbe6.appspot.com",
                databaseURL: process.env.FIREBASE_DATABASEURL,
            });
        } else {
            this.firebaseApp = admin.app();
        }
    }
    firebaseRealTimeDB(ref) {
        return this.firebaseApp.database().ref(ref);
    }
    firebaseFireStoreDB() {
        return this.firebaseApp.firestore();
    }
    firebaseRealTimeDBTimeStamp() {
        return moment().valueOf();
    }
    firebaseMessaging() {
        return this.firebaseApp.messaging();
    }
}

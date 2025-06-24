"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAdminProvider = void 0;
const firebase_admin_1 = require("firebase-admin");
require("dotenv/config");
exports.firebaseAdminProvider = {
    provide: 'FIREBASE_ADMIN',
    useFactory: () => {
        const defaultApp = firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        return { defaultApp };
    },
};
//# sourceMappingURL=firebaseAdminProvider.js.map
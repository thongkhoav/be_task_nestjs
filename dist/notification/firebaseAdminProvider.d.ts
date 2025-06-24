import admin from 'firebase-admin';
import 'dotenv/config';
export declare const firebaseAdminProvider: {
    provide: string;
    useFactory: () => {
        defaultApp: admin.app.App;
    };
};

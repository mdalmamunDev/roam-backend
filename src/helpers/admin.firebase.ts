import admin from 'firebase-admin';
import serviceAccountJson from '../../firebase-adminsdk.json';

const serviceAccount = serviceAccountJson as admin.ServiceAccount;

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

// console.log(serviceAccount);
// console.log(admin);

export default admin;
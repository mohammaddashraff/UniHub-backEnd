const admin = require('firebase-admin');
const path = require('path');

const defaultServiceAccountPath = path.join(
    __dirname,
    '..',
    'unihub-fd4e0-firebase-adminsdk-w5r6m-ecd2e1e462.json'
);
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || defaultServiceAccountPath;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'gs://unihub-fd4e0.appspot.com';

let bucket;

try {
    // Prevent duplicate initialization in hot-reload/dev scenarios.
    if (!admin.apps.length) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket
        });
    }
    bucket = admin.storage().bucket();
} catch (error) {
    console.warn(
        'Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH and FIREBASE_STORAGE_BUCKET to enable storage features.'
    );
    bucket = {
        upload: async () => {
            throw new Error('Firebase Storage is not configured.');
        },
        file: () => ({
            getSignedUrl: async () => {
                throw new Error('Firebase Storage is not configured.');
            },
            delete: (callback) => {
                if (typeof callback === 'function') {
                    callback(new Error('Firebase Storage is not configured.'));
                }
            }
        })
    };
}

module.exports = bucket;

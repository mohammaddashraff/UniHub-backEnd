const admin = require('firebase-admin');
const serviceAccount = require('../unihub-fd4e0-firebase-adminsdk-w5r6m-ecd2e1e462.json'); // Path to your JSON file

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'gs://unihub-fd4e0.appspot.com'
});

const bucket = admin.storage().bucket();

module.exports = bucket;

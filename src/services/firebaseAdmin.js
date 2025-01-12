const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service.json'); // Replace with your service account JSON file path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;

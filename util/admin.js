const admin = require("firebase-admin");

const serviceAccount = require("../../seviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://feed-2f7ab.firebaseio.com",
  storageBucket: "feed-2f7ab.appspot.com"
});

// admin.initializeApp();
  

const db = admin.firestore();

db.settings({
  timestampsInSnapshots: true
});

module.exports = { admin, db };

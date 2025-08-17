import admin from "firebase-admin";

var serviceAccount = require("../musicapp-ec944-firebase-adminsdk-vhmfz-7d8c5e1816.json");



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

export { admin};
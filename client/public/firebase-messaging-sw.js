importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');


// Khởi tạo Firebase app
firebase.initializeApp({
  apiKey: "AIzaSyDEZ0A3F6Q07bulJtlmFRGXMpJ653auwZM",
  authDomain: "musicapp-ec944.firebaseapp.com",
  projectId: "musicapp-ec944",
  storageBucket: "musicapp-ec944.appspot.com",
  messagingSenderId: "103191199587",
  appId: "1:103191199587:web:533cc1bd64008c1dc91d56",
  measurementId: "G-REB9JRY3MN"
});

// Lấy messaging instance
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.data?.title || payload.notification?.title || 'Thông báo mới';
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || 'Bạn có thông báo mới',
    icon: '/favicon-16x16.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


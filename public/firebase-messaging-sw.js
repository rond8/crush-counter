// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCn6dVzVUa0-1_Cg7G9Wo4M87fNEVDSl8",
  authDomain: "crush-counter-503715.firebaseapp.com",
  projectId: "crush-counter-503715",
  storageBucket: "crush-counter-503715.firebasestorage.app",
  messagingSenderId: "832670924793",
  appId: "1:832670924793:web:1e9eeff114bd8c5994c728",
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png', // Add path to your app logo/icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
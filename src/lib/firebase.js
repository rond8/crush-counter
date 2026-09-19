import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Your exact Firebase config from the screenshot
const firebaseConfig = {
  apiKey: "AIzaSyCn6dVzVUa0-1_Cg7G9Wo4M87fNEVDSl8",
  authDomain: "crush-counter-503715.firebaseapp.com",
  projectId: "crush-counter-503715",
  storageBucket: "crush-counter-503715.firebasestorage.app",
  messagingSenderId: "832670924793",
  appId: "1:832670924793:web:1e9eeff114bd8c5994c728",
  measurementId: "G-BBWRC53PGW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export const storage = getStorage(app);

/**
 * Upload an image to Firebase Storage (Google Cloud)
 */
export async function uploadToFirebase(userId, file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `daily_posts/${userId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}


// Paste your VAPID key here once generated in Project Settings -> Cloud Messaging
const VAPID_KEY = "BGSpBWLjjF5_C7HCpwL77_HHIQiX5Vf3kcJaA-kjoBwr81ZgBVd8FfVSJboxIDnJG7Wxbdnsl9QYpbkm0cn0QIE";

export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        console.log('FCM Token generated:', token);
        return token;
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
  }
  return null;
}

export function onForegroundMessage(callback) {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}
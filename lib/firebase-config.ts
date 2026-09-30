/**
 * Firebase config, split out so checking `firebaseEnabled` doesn't pull the
 * Firebase SDK into every page. The SDK itself loads on demand (see
 * lib/watchlistSync.ts).
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Firebase is optional: without config the Watchlist still works, stored
 * on-device only. With config, signed-in users sync to Firestore.
 */
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

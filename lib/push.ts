/**
 * Web push for Watchlist notifications (CS-201).
 * The public key is meant to be public; the private key lives only in
 * .env.local and the GitHub Actions secret VAPID_PRIVATE_KEY (sender).
 */
export const VAPID_PUBLIC_KEY = "BAGJHbgOiIMBk28rePsesHW0ln0iWAa4DjCstei2BDmeYLwunlBNT9sZRvxnGJGIfBz4rm02lEoAo8E6ef1m6EA";
export const PUSH_FLAG = "civicsync:push";

/** Bill IDs as used in URLs: "SBN-1294", "HB04659", or Open Congress IDs. */
export const BILL_ID = /^[A-Z0-9-]{3,40}$/;

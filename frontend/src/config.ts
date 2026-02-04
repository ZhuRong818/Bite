const FALLBACK_API_BASE = "http://127.0.0.1:5000";

const rawBase = process.env.EXPO_PUBLIC_API_BASE || FALLBACK_API_BASE;
const withScheme = rawBase.startsWith("http") ? rawBase : `http://${rawBase}`;
export const API_BASE = "http://172.20.10.12:5000";



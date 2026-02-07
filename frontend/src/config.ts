const FALLBACK_API_BASE = "http://localhost:5000";

const rawBase = process.env.EXPO_PUBLIC_API_BASE || FALLBACK_API_BASE;
const withScheme = rawBase.startsWith("http") ? rawBase : `http://${rawBase}`;
//change based on local deployment
export const API_BASE = "http://172.20.10.3:5000";



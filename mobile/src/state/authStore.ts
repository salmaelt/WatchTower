import AsyncStorage from "@react-native-async-storage/async-storage";
const TOKEN_KEY = "wt_jwt";
export async function saveToken(t: string) { await AsyncStorage.setItem(TOKEN_KEY, t); }
export async function loadToken() { return AsyncStorage.getItem(TOKEN_KEY); }
export async function clearToken() { await AsyncStorage.removeItem(TOKEN_KEY); }

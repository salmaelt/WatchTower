//import AsyncStorage from "@react-native-async-storage/async-storage";
//const TOKEN_KEY = "wt_jwt";

import * as SecureStore from "expo-secure-store";
import axios from "axios";

let tokenMem: string | null = null;

//export async function saveToken(t: string) { await AsyncStorage.setItem(TOKEN_KEY, t); }
//export async function loadToken() { return AsyncStorage.getItem(TOKEN_KEY); }
//export async function clearToken() { await AsyncStorage.removeItem(TOKEN_KEY); }

export async function loadToken() {
  tokenMem = await SecureStore.getItemAsync("token");
  if (tokenMem) {
    axios.defaults.headers.common.Authorization = `Bearer ${tokenMem}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
  return tokenMem;
}

export async function saveToken(t: string | null) {
  tokenMem = t;
  if (t) {
    await SecureStore.setItemAsync("token", t);
    axios.defaults.headers.common.Authorization = `Bearer ${t}`;
  } else {
    await SecureStore.deleteItemAsync("token");
    delete axios.defaults.headers.common.Authorization;
  }
}

export function getToken() {
  return tokenMem;
}
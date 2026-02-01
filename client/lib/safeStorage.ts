import { Platform } from "react-native";

let storageAvailable: boolean | null = null;
const memoryFallback: Record<string, string> = {};

let AsyncStorageModule: any = null;

async function getAsyncStorage() {
  if (AsyncStorageModule !== null) return AsyncStorageModule;
  
  try {
    const module = await import("@react-native-async-storage/async-storage");
    AsyncStorageModule = module.default;
    return AsyncStorageModule;
  } catch (error) {
    console.warn("Failed to load AsyncStorage:", error);
    AsyncStorageModule = false;
    return false;
  }
}

async function checkStorageAvailable(): Promise<boolean> {
  if (storageAvailable !== null) return storageAvailable;
  
  // On web, first check if localStorage is available
  if (Platform.OS === "web") {
    try {
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, "test");
      window.localStorage.removeItem(testKey);
    } catch (error) {
      console.warn("localStorage not available:", error);
      storageAvailable = false;
      return false;
    }
  }
  
  try {
    const AsyncStorage = await getAsyncStorage();
    if (!AsyncStorage) {
      storageAvailable = false;
      return false;
    }
    
    const testKey = "@__storage_test__";
    await AsyncStorage.setItem(testKey, "test");
    await AsyncStorage.removeItem(testKey);
    storageAvailable = true;
  } catch (error) {
    console.warn("Storage not available, using in-memory fallback:", error);
    storageAvailable = false;
  }
  
  return storageAvailable;
}

export async function safeGetItem(key: string): Promise<string | null> {
  try {
    const available = await checkStorageAvailable();
    if (!available) {
      return memoryFallback[key] ?? null;
    }
    const AsyncStorage = await getAsyncStorage();
    if (!AsyncStorage) return memoryFallback[key] ?? null;
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn("Storage access error:", error);
    return memoryFallback[key] ?? null;
  }
}

export async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    const available = await checkStorageAvailable();
    if (!available) {
      memoryFallback[key] = value;
      return;
    }
    const AsyncStorage = await getAsyncStorage();
    if (!AsyncStorage) {
      memoryFallback[key] = value;
      return;
    }
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn("Storage write error:", error);
    memoryFallback[key] = value;
  }
}

export async function safeRemoveItem(key: string): Promise<void> {
  try {
    const available = await checkStorageAvailable();
    if (!available) {
      delete memoryFallback[key];
      return;
    }
    const AsyncStorage = await getAsyncStorage();
    if (!AsyncStorage) {
      delete memoryFallback[key];
      return;
    }
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn("Storage remove error:", error);
    delete memoryFallback[key];
  }
}

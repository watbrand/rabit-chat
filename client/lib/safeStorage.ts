import { Platform } from "react-native";

const memoryFallback: Record<string, string> = {};
let webStorageAvailable: boolean | null = null;
let nativeStorageAvailable: boolean | null = null;
let AsyncStorageModule: any = null;

// Check web localStorage availability - wrapped in try/catch for mobile browsers
function checkWebStorageAvailable(): boolean {
  if (webStorageAvailable !== null) return webStorageAvailable;
  
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      webStorageAvailable = false;
      return false;
    }
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, "test");
    window.localStorage.removeItem(testKey);
    webStorageAvailable = true;
  } catch (error) {
    // SecurityError on mobile browsers, or QuotaExceededError, or other issues
    console.warn("[SafeStorage] Web localStorage not available:", error);
    webStorageAvailable = false;
  }
  
  return webStorageAvailable;
}

// For native platforms only - lazy load AsyncStorage
async function getNativeStorage() {
  if (Platform.OS === "web") return null;
  
  if (AsyncStorageModule !== null) return AsyncStorageModule || null;
  
  try {
    const module = await import("@react-native-async-storage/async-storage");
    AsyncStorageModule = module.default;
    return AsyncStorageModule;
  } catch (error) {
    console.warn("[SafeStorage] Failed to load AsyncStorage:", error);
    AsyncStorageModule = false;
    return null;
  }
}

async function checkNativeStorageAvailable(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (nativeStorageAvailable !== null) return nativeStorageAvailable;
  
  try {
    const AsyncStorage = await getNativeStorage();
    if (!AsyncStorage) {
      nativeStorageAvailable = false;
      return false;
    }
    
    const testKey = "@__storage_test__";
    await AsyncStorage.setItem(testKey, "test");
    await AsyncStorage.removeItem(testKey);
    nativeStorageAvailable = true;
  } catch (error) {
    console.warn("[SafeStorage] Native storage not available:", error);
    nativeStorageAvailable = false;
  }
  
  return nativeStorageAvailable;
}

export async function safeGetItem(key: string): Promise<string | null> {
  try {
    // Web platform - use localStorage directly, bypass AsyncStorage completely
    if (Platform.OS === "web") {
      if (checkWebStorageAvailable()) {
        return window.localStorage.getItem(key);
      }
      return memoryFallback[key] ?? null;
    }
    
    // Native platforms - use AsyncStorage
    const available = await checkNativeStorageAvailable();
    if (!available) {
      return memoryFallback[key] ?? null;
    }
    
    const AsyncStorage = await getNativeStorage();
    if (!AsyncStorage) return memoryFallback[key] ?? null;
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn("[SafeStorage] Get error:", error);
    return memoryFallback[key] ?? null;
  }
}

export async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    // Web platform - use localStorage directly
    if (Platform.OS === "web") {
      if (checkWebStorageAvailable()) {
        window.localStorage.setItem(key, value);
        return;
      }
      memoryFallback[key] = value;
      return;
    }
    
    // Native platforms - use AsyncStorage
    const available = await checkNativeStorageAvailable();
    if (!available) {
      memoryFallback[key] = value;
      return;
    }
    
    const AsyncStorage = await getNativeStorage();
    if (!AsyncStorage) {
      memoryFallback[key] = value;
      return;
    }
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn("[SafeStorage] Set error:", error);
    memoryFallback[key] = value;
  }
}

export async function safeRemoveItem(key: string): Promise<void> {
  try {
    // Web platform - use localStorage directly
    if (Platform.OS === "web") {
      if (checkWebStorageAvailable()) {
        window.localStorage.removeItem(key);
        return;
      }
      delete memoryFallback[key];
      return;
    }
    
    // Native platforms - use AsyncStorage
    const available = await checkNativeStorageAvailable();
    if (!available) {
      delete memoryFallback[key];
      return;
    }
    
    const AsyncStorage = await getNativeStorage();
    if (!AsyncStorage) {
      delete memoryFallback[key];
      return;
    }
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn("[SafeStorage] Remove error:", error);
    delete memoryFallback[key];
  }
}

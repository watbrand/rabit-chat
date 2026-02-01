import AsyncStorage from "@react-native-async-storage/async-storage";

let storageAvailable: boolean | null = null;
const memoryFallback: Record<string, string> = {};

async function checkStorageAvailable(): Promise<boolean> {
  if (storageAvailable !== null) return storageAvailable;
  
  try {
    const testKey = "@__storage_test__";
    await AsyncStorage.setItem(testKey, "test");
    await AsyncStorage.removeItem(testKey);
    storageAvailable = true;
  } catch {
    console.warn("Storage not available, using in-memory fallback");
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
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn("Storage remove error:", error);
    delete memoryFallback[key];
  }
}

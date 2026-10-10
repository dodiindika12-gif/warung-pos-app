import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const STORAGE_KEY = '@warung_pos_api_url';
export const PROD_BASE_URL = 'https://kasir.indika.web.id/api/mobile';

export const getAutoDetectedHost = (): string => {
  // If running in web browser
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return window.location.hostname || 'localhost';
  }

  // If running in Expo (Physical phone or Emulator)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost ||
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }

  // Fallback to PC Local LAN IP
  return '192.168.1.3';
};

export const getDefaultBaseUrl = (): string => {
  const host = getAutoDetectedHost();
  return `http://${host}:3000/api/mobile`;
};

let currentBaseUrl: string = getDefaultBaseUrl();

// Initialize from storage
AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
  if (saved && saved.trim()) {
    currentBaseUrl = saved.trim();
  }
}).catch(() => {
  // Use default if storage read fails
});

export const getBaseUrl = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      currentBaseUrl = saved.trim();
      return currentBaseUrl;
    }
  } catch {
    // Ignore error
  }
  return currentBaseUrl;
};

export const setBaseUrl = async (newUrl: string): Promise<string> => {
  let cleaned = newUrl.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (!cleaned.includes('/api/mobile')) {
    cleaned = `${cleaned}/api/mobile`;
  }
  currentBaseUrl = cleaned;
  await AsyncStorage.setItem(STORAGE_KEY, cleaned);
  return cleaned;
};

export const resetBaseUrl = async (): Promise<string> => {
  const def = getDefaultBaseUrl();
  currentBaseUrl = def;
  await AsyncStorage.removeItem(STORAGE_KEY);
  return def;
};

export const checkConnection = async (testUrl?: string): Promise<{ success: boolean; message: string; latency?: number }> => {
  const target = testUrl || currentBaseUrl;
  const start = Date.now();
  try {
    const res = await axios.get(target, { timeout: 5000 });
    const latency = Date.now() - start;
    if (res.data && res.data.success) {
      return { success: true, message: `Terhubung (${latency}ms)`, latency };
    }
    return { success: false, message: 'Respon server tidak valid' };
  } catch (err: any) {
    // Try POST ping fallback
    try {
      const pingRes = await axios.post(target, { action: 'ping' }, { timeout: 5000 });
      const latency = Date.now() - start;
      if (pingRes.data && pingRes.data.success) {
        return { success: true, message: `Terhubung (${latency}ms)`, latency };
      }
    } catch {
      // Fallback failed
    }
    return { 
      success: false, 
      message: err.message?.includes('Network Error') 
        ? `Gagal terhubung ke ${target}. Pastikan Next.js aktif di port 3000.` 
        : (err.message || 'Koneksi gagal') 
    };
  }
};

export const callAction = async (action: string, payload?: any): Promise<any> => {
  const url = currentBaseUrl || getDefaultBaseUrl();
  try {
    const response = await axios.post(url, { action, payload }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data?.error || `Action ${action} gagal diproses`);
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.error || error?.message || 'Terjadi kesalahan jaringan';
    console.warn(`[Mobile API Error] ${action} at ${url}:`, errorMsg);
    throw new Error(errorMsg);
  }
};

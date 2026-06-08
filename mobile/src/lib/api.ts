import axios from 'axios';

// Replace with your laptop's actual local IP at event time
// Find it with: ipconfig (Windows) → IPv4 Address
export const BASE_URL = 'http://10.211.105.24:8080';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,   // 30s — Ollama on 3B model can be slow
  headers: { 'Content-Type': 'application/json' },
});

// ─── Types (derived from backend DTOs) ────────────────────
export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
export type PinType = 'REQUEST' | 'RESOURCE';
export type RequestCategory = 'MEDICAL' | 'RESCUE' | 'SUPPLIES' | 'SHELTER' | 'OTHER';
export type ResourceType = 'BOAT' | 'VOLUNTEER' | 'SHELTER' | 'MEDICAL_SUPPLY' | 'FOOD';

export interface MapPin {
  id: number;
  pinType: PinType;
  category: string;
  status: string;
  urgencyScore: number | null;
  urgencyLevel: UrgencyLevel | null;
  availableCapacity: number | null;
  latitude: number;
  longitude: number;
}

export interface MapPinsResponse {
  requests: MapPin[];
  resources: MapPin[];
}

export interface DangerZone {
  id: number;
  name: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  riskWeight: number;
  cause: string;
}

export interface HelpRequestResponse {
  id: number;
  message: string;
  summary: string;
  category: string;
  dangerScore: number;
  vulnerabilityScore: number;
  peopleCount: number;
  detectedLanguage: string;
  needs: string[];
  latitude: number;
  longitude: number;
  status: string;
  urgencyScore: number;
  urgencyLevel: UrgencyLevel;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── API calls ─────────────────────────────────────────────
export const api = {
  /** Submit SOS. Returns the triaged request including AI summary. */
  submitRequest: async (payload: {
    clientRequestId: string;
    message: string;
    latitude: number;
    longitude: number;
  }): Promise<ApiResponse<HelpRequestResponse>> => {
    const res = await client.post('/api/requests', payload);
    return res.data;
  },

  /** All map pins — requests (sorted CRITICAL first) + resources. */
  getMapPins: async (): Promise<ApiResponse<MapPinsResponse>> => {
    const res = await client.get('/api/map/pins');
    return res.data;
  },

  /** Danger zones for map overlays and route checking. */
  getZones: async (): Promise<ApiResponse<DangerZone[]>> => {
    const res = await client.get('/api/zones');
    return res.data;
  },

  /** Seed demo data (8 resources + 20 requests). Call before demoing. */
  generateDemo: async (): Promise<void> => {
    await client.post('/api/demo/generate');
  },

  /** All open requests for the list view. */
  getRequests: async (): Promise<ApiResponse<any>> => {
    const res = await client.get('/api/requests');
    return res.data;
  },
};

// ─── error handling helpers ────────────────────────────────
export const CONNECTION_ERROR_MESSAGE =
  'Cannot reach the server. Check that:\n• Your backend is running\n• Your phone and laptop are on the same wifi/hotspot\n• The IP in api.ts is correct';

/** True when the failure is a transport/timeout error rather than an HTTP response. */
export function isNetworkError(err: any): boolean {
  return (
    err?.code === 'ECONNABORTED' ||
    (typeof err?.message === 'string' && err.message.includes('Network Error'))
  );
}

/** Pull the most useful human-readable message out of an axios error. */
export function errorMessage(err: any, fallback: string): string {
  if (isNetworkError(err)) return CONNECTION_ERROR_MESSAGE;
  return String(err?.response?.data?.message ?? err?.message ?? fallback);
}

/**
 * Lightweight reachability probe (3s). Any HTTP response — even 404 — means the
 * server is up; only a transport failure/timeout counts as unreachable.
 */
export async function checkServerReachable(): Promise<boolean> {
  try {
    await client.get('/actuator/health', { timeout: 3000 });
    return true;
  } catch (err: any) {
    return Boolean(err?.response);
  }
}

export interface LicenseKey {
  id: string
  key: string
  label: string | null
  status: 'active' | 'banned' | 'expired' | 'paused'
  max_devices: number
  expires_at: string
  discord_id: string | null
  notes: string | null
  product: string | null   // ex: 'freefire' | 'valorant' | 'cs2'
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface HWID {
  id: string
  key_id: string
  hwid: string
  device_label: string | null
  ip_address: string | null
  registered_at: string
}

export interface AuthLog {
  id: string
  key_id: string | null
  event_type: string
  ip_address: string | null
  hwid: string | null
  details: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  total_keys: number
  active_keys: number
  expired_keys: number
  banned_keys: number
  total_hwids: number
  recent_auths: number
}

// =====================================================================
// API pública para clientes externos (C++/loader)
// =====================================================================

export interface AuthValidateRequest {
  key: string
  hwid: string
}

export interface AuthValidateResponse {
  success: boolean
  error?: string
  message?: string
  data?: {
    key: string
    label: string | null
    expires_at: string
    expires_in_seconds: number
    discord_id: string | null
    max_devices: number
    devices_used: number
    session_token: string  // HMAC token usado em heartbeat
  }
}

export interface AuthHeartbeatRequest {
  session_token: string
}

export interface AuthHeartbeatResponse {
  success: boolean
  error?: string
  message?: string
  data?: {
    valid: boolean
    expires_at: string
    expires_in_seconds: number
    session_token?: string  // novo token rotacionado
  }
}

import {
  ResumeRecord,
  UpdateResumeInput,
  PublicResumeResponse,
  AuthUser,
} from '@resumax/shared'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'

interface RequestOptions extends RequestInit {
  _retry?: boolean
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

/**
 * Base fetch client with automatic cookie credentials and silent token refresh.
 */
export async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always send httpOnly session cookies
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${endpoint}`, config)
  } catch (err: any) {
    throw new Error(err.message || 'Network request failed')
  }

  // Handle Token Expiry & Silent Refresh
  if (response.status === 401 && !options._retry && endpoint !== '/auth/refresh' && endpoint !== '/auth/logout') {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
        .then((res) => res.ok)
        .catch(() => false)
        .finally(() => {
          isRefreshing = false
          refreshPromise = null
        })
    }

    const refreshed = await refreshPromise
    if (refreshed) {
      // Retry original request once with fresh access token in cookie
      return request<T>(endpoint, { ...options, _retry: true })
    } else {
      // Refresh failed — clear local user cache and notify caller
      localStorage.removeItem('user')
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`)
  }

  return data as T
}

export const api = {
  /**
   * Redirects browser to Google OAuth consent page.
   */
  loginWithGoogle(): void {
    window.location.href = `${API_URL}/auth/google`
  },

  /**
   * Fetches currently authenticated user profile via session cookie.
   */
  getMe(): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>('/auth/me')
  },

  /**
   * Triggers a manual token refresh.
   */
  refreshToken(): Promise<{ success: boolean; user: AuthUser }> {
    return request<{ success: boolean; user: AuthUser }>('/auth/refresh', { method: 'POST' })
  },

  /**
   * Logs out user, invalidating refresh token in D1 and clearing cookies.
   */
  logout(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' })
  },

  /**
   * Retrieves the current user's resume (or initializes a default one).
   */
  getResume(): Promise<ResumeRecord> {
    return request<ResumeRecord>('/resume')
  },

  /**
   * Updates resume content, theme, and custom vanity slug with Zod validation.
   */
  updateResume(data: UpdateResumeInput): Promise<{ message: string; slug: string }> {
    return request<{ message: string; slug: string }>('/resume', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Fetches sanitized resume data by public slug.
   */
  getPublicResume(slug: string): Promise<PublicResumeResponse> {
    return request<PublicResumeResponse>(`/public/${slug}`)
  },
}

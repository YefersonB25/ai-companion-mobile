/**
 * Mobile API Client
 *
 * Creates an instance of @aria/core ApiClient with mobile-specific config.
 * Handles SecureStore token persistence.
 *
 * Uses wrapper for backward compatibility with existing mobile code.
 */

import * as SecureStore from 'expo-secure-store'
import { createApiClient } from '@aria/core'
import { Platform } from 'react-native'

const API_URL = Platform.OS === 'web'
  ? 'http://ai-companion.test/api'
  : 'https://ai.omnirepair.online/api'

/**
 * Base client for stores (no wrapper)
 */
export const apiClient = createApiClient({
  baseURL: API_URL,
  getToken: () => SecureStore.getItemAsync('token'),
  setToken: (token) => SecureStore.setItemAsync('token', token),
  timeout: 30000,
})

/**
 * Wrapper for backward compatibility with existing mobile code
 * @aria/core ApiClient returns T directly, but mobile expects { data: T }
 */
export const api = {
  async get<T = any>(path: string, config?: any) {
    const data = await apiClient.get<T>(path, config)
    return { data }
  },
  async post<T = any>(path: string, body?: any, config?: any) {
    const data = await apiClient.post<T>(path, body, config)
    return { data }
  },
  async put<T = any>(path: string, body?: any, config?: any) {
    const data = await apiClient.put<T>(path, body, config)
    return { data }
  },
  async patch<T = any>(path: string, body?: any, config?: any) {
    const data = await apiClient.patch<T>(path, body, config)
    return { data }
  },
  async delete<T = any>(path: string, config?: any) {
    const data = await apiClient.delete<T>(path, config)
    return { data }
  },
  stream: apiClient.stream.bind(apiClient),
  getStreamUrl: apiClient.getStreamUrl.bind(apiClient),
}

/**
 * Get streaming URL for SSE EventSource
 */
export const getStreamUrl = (path: string): string =>
  `${API_URL}${path}`

export default api

/**
 * Mobile API Client
 *
 * Creates an instance of @aria/core ApiClient with mobile-specific config.
 * Handles SecureStore token persistence.
 */

import * as SecureStore from 'expo-secure-store'
import { createApiClient } from '@aria/core'
import { Platform } from 'react-native'

const API_URL = Platform.OS === 'web'
  ? 'http://ai-companion.test/api'
  : 'https://ai.omnirepair.online/api'

/**
 * Mobile API client with SecureStore token management
 */
export const api = createApiClient({
  baseURL: API_URL,
  getToken: () => SecureStore.getItemAsync('token'),
  setToken: (token) => SecureStore.setItemAsync('token', token),
  timeout: 30000,
})

/**
 * Get streaming URL for SSE EventSource
 */
export const getStreamUrl = (path: string): string =>
  `${API_URL}${path}`

export default api

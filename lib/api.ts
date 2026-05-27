import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const API_URL = Platform.OS === 'web'
  ? 'http://ai-companion.test/api'
  : 'http://134.122.21.84/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getStreamUrl = (path: string) =>
  `${API_URL}${path}`

export default api

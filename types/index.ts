export interface User {
  id: number
  name: string
  email: string
}

export interface AiProvider {
  id: number
  provider: string
  model: string
  is_active: boolean
  is_default: boolean
  priority: number
}

export interface Conversation {
  id: number
  title: string | null
  provider: string | null
  model: string | null
  channel: string
  token_count: number
  messages_count?: number
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  provider: string | null
  model: string | null
  input_tokens: number
  output_tokens: number
  latency_ms: number | null
  created_at: string
}

export interface MemoryNode {
  id: number
  type: string
  label: string
  content: string
  importance: number
  parent_id: number | null
  attributes: Record<string, unknown> | null
}

export interface MindMapData {
  nodes: MemoryNode[]
  edges: Array<{ source: number; target: number }>
}

export interface UserSetting {
  default_provider: string
  default_model: string
  language: string
  memory_enabled: boolean
  stream_responses: boolean
  persona: { name?: string; prompt?: string } | null
}

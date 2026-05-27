import { create } from 'zustand'
import { Conversation, Message } from '@/types'
import api, { getStreamUrl } from '@/lib/api'
import * as SecureStore from 'expo-secure-store'

interface ChatState {
  conversations: Conversation[]
  activeConversation: Conversation | null
  messages: Message[]
  isStreaming: boolean
  loadConversations: () => Promise<void>
  createConversation: () => Promise<Conversation>
  selectConversation: (id: number) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  appendChunk: (chunk: string) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isStreaming: false,

  loadConversations: async () => {
    const { data } = await api.get('/conversations')
    set({ conversations: data.data ?? data })
  },

  createConversation: async () => {
    const { data } = await api.post('/conversations', { channel: 'mobile' })
    set((s) => ({
      conversations: [data, ...s.conversations],
      activeConversation: data,
      messages: [],
    }))
    return data
  },

  selectConversation: async (id) => {
    const { data } = await api.get(`/conversations/${id}`)
    set({ activeConversation: data, messages: data.messages ?? [] })
  },

  sendMessage: async (content) => {
    let conv = get().activeConversation
    if (!conv) conv = await get().createConversation()

    const userMsg: Message = {
      id: Date.now(),
      conversation_id: conv.id,
      role: 'user',
      content,
      provider: null,
      model: null,
      input_tokens: 0,
      output_tokens: 0,
      latency_ms: null,
      created_at: new Date().toISOString(),
    }

    const aiMsg: Message = {
      id: Date.now() + 1,
      conversation_id: conv.id,
      role: 'assistant',
      content: '',
      provider: null,
      model: null,
      input_tokens: 0,
      output_tokens: 0,
      latency_ms: null,
      created_at: new Date().toISOString(),
    }

    set((s) => ({ messages: [...s.messages, userMsg, aiMsg], isStreaming: true }))

    const token = await SecureStore.getItemAsync('token')
    const url = getStreamUrl(`/conversations/${conv.id}/messages`)

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, stream: true }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value)
          for (const line of text.split('\n')) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const json = JSON.parse(line.slice(6))
                if (json.chunk) get().appendChunk(json.chunk)
              } catch {}
            }
          }
        }
      }
    } finally {
      set({ isStreaming: false })
    }

    await get().loadConversations()
  },

  appendChunk: (chunk) =>
    set((s) => {
      const msgs = [...s.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + chunk }
      }
      return { messages: msgs }
    }),
}))

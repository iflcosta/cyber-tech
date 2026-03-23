export type ChatRole = 'user' | 'model' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

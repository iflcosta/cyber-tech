export interface SendResult {
  success: boolean
  messageId: string
  timestamp: string
}

export interface WhatsAppProvider {
  send(to: string, message: string): Promise<SendResult>
}

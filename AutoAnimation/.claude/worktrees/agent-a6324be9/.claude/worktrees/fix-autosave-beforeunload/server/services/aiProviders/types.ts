export interface AIJobStatus {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  result?: { url?: string; urls?: string[]; base64?: string }
  error?: string
  estimatedSeconds?: number
}

export interface AIProviderHandler {
  providerId: string
  isConfigured(): boolean
  execute(capability: string, model: string, params: Record<string, any>): Promise<any>
  getJobStatus(jobId: string): Promise<AIJobStatus>
}

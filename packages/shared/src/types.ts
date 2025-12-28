export interface GenerationResult {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';
  prompt: string;
  result?: string | null;
  error?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

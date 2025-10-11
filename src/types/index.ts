export interface MatchSession {
  id: string;
  users: string[];
  status: 'waiting' | 'pending' | 'connected' | 'rejected' | 'ended';
  startedAt: string;
  chatType: 'voice' | 'text';
  endedAt?: string;
}

export interface CleanupStats {
  totalScanned: number;
  totalDeleted: number;
  rejectedDeleted: number;
  endedDeleted: number;
  lastCleanup: Date | null;
  errors: number;
  lastError: string | null;
}

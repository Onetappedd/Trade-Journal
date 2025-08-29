/**
 * Import data contracts and types
 */

export type ImportSource = 'csv' | 'email' | 'manual' | 'api';
export type ImportStatus = 'pending' | 'processing' | 'partial' | 'success' | 'failed';

export interface ImportRun {
  id: string;
  user_id: string;
  broker_account_id?: string | null;
  source: ImportSource;
  status: ImportStatus;
  started_at: string | null;
  finished_at: string | null;
  summary?: Record<string, any> | null;
  error?: string | null;
}

export interface ImportRunsResponse {
  items: ImportRun[];
  total: number;
  page: number;
  limit: number;
}

export interface ImportFilters {
  page?: number;
  limit?: number;
  status?: ImportStatus;
  source?: ImportSource;
  dateFrom?: string;
  dateTo?: string;
}

export interface BrokerAccount {
  id: string;
  broker: string;
  label: string;
  status: 'connected' | 'disconnected' | 'error';
  connected_at?: string;
  last_sync?: string;
}

export interface CsvUpload {
  id: string;
  filename: string;
  uploaded_at: string;
  status: 'pending' | 'mapped' | 'imported' | 'error';
  records_count?: number;
  mapped_fields?: Record<string, string>;
}

export interface EmailForwardingAddress {
  address: string;
  domain: string;
  status: 'active' | 'pending' | 'disabled';
  created_at: string;
  last_used?: string;
}

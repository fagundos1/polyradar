import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ghfywkldzzgpyoxkiydt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZnl3a2xkenpncHlveGtpeWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwODE2NDIsImV4cCI6MjA3NjY1NzY0Mn0.90pJCE21tmJoDVpnAmzpFrCJaf_lCLtnUkxU74_0_N8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Types for database tables
export interface User {
  id: string;
  wallet_address: string;
  radar_balance: number;
  free_searches_used: number;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  event_url: string;
  event_title: string | null;
  event_data: any | null;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  user_id: string | null;
}

export interface ModelPrediction {
  id: string;
  analysis_id: string;
  model_name: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'timeout';
  outcome: 'YES' | 'NO' | 'UNCERTAIN' | null;
  confidence_percent: number | null;
  reasoning: string | null;
  sources_count: number | null;
  error: string | null;
  requested_at: string;
  completed_at: string | null;
  raw_response: any | null;
}

export interface Timeline {
  id: string;
  analysis_id: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'timeout';
  events: any[];
  error: string | null;
  requested_at: string;
  completed_at: string | null;
  raw_response: any | null;
}

export interface Insights {
  id: string;
  analysis_id: string;
  status: 'pending' | 'processing' | 'success' | 'error' | 'timeout';
  risks: any[];
  opportunities: any[];
  trends: any[];
  consensus: any | null;
  error: string | null;
  requested_at: string;
  completed_at: string | null;
  raw_response: any | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'purchase' | 'spend' | 'refund';
  amount: number;
  description: string | null;
  created_at: string;
}

export interface Prediction {
  model: string;
  modelIcon: string;
  outcome: string;
  confidence: number;
  reasoning: string;
  sources: number;
}

export interface TimelineEvent {
  date: string;
  label: string;
  type: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface Insight {
  type: 'agreement' | 'divergent' | 'risk';
  title: string;
  description: string | string[];
  icon: string;
}


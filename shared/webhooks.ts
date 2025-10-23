// Webhook configuration for Make.com integration

export const WEBHOOK_CONFIG = {
  models: {
    model1: {
      name: "Model 1",
      makeWebhook: "https://hook.us2.make.com/mio87mwc00gx78v2wo1ex41xwzhrmpd5",
      callbackUrl: "https://polyradar.io/api/webhooks/predictions/model1"
    },
    model2: {
      name: "Model 2",
      makeWebhook: "https://hook.us2.make.com/632ia2fn81ycsukbgc1qnkbgfoitq2dc",
      callbackUrl: "https://polyradar.io/api/webhooks/predictions/model2"
    },
    model3: {
      name: "Model 3",
      makeWebhook: "https://hook.us2.make.com/832gwe0qrpvrdxa1ktt7xb3nwwe7vnpb",
      callbackUrl: "https://polyradar.io/api/webhooks/predictions/model3"
    },
    model4: {
      name: "Model 4",
      makeWebhook: "https://hook.us2.make.com/ee8yx5gny4wg158ypnsjx869jijk84rz",
      callbackUrl: "https://polyradar.io/api/webhooks/predictions/model4"
    }
  },
  timeline: {
    makeWebhook: "https://hook.us2.make.com/oz2vahabhwhxutwohwpkoxtkaaym3nxa",
    callbackUrl: "https://polyradar.io/api/webhooks/timeline"
  },
  insights: {
    makeWebhook: "https://hook.us2.make.com/sv2tup1yq1hddwnolhhngv67f8jttynh",
    callbackUrl: "https://polyradar.io/api/webhooks/insights"
  }
} as const;

export type ModelKey = keyof typeof WEBHOOK_CONFIG.models;

// Request payload sent to Make.com webhooks
export interface AnalysisRequest {
  analysis_id: string;
  event_url: string;
  callback_url: string;
  event_data?: {
    title?: string;
    end_date?: string;
    current_odds?: {
      yes: number;
      no: number;
    };
  };
}

// Response from Make.com webhooks (predictions)
export interface PredictionResponse {
  analysis_id: string;
  model_name: string;
  status: "success" | "error";
  error?: string;
  outcome?: "YES" | "NO" | "UNCERTAIN";
  confidence_percent?: number;
  reasoning?: string;
  sources_count?: number;
}

// Response from Make.com webhooks (timeline)
export interface TimelineResponse {
  analysis_id: string;
  status: "success" | "error";
  error?: string;
  events?: Array<{
    date: string;
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    source_url?: string;
  }>;
}

// Response from Make.com webhooks (insights)
export interface InsightsResponse {
  analysis_id: string;
  status: "success" | "error";
  error?: string;
  risks?: Array<{
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
  }>;
  opportunities?: Array<{
    title: string;
    description: string;
    confidence: "high" | "medium" | "low";
  }>;
  trends?: Array<{
    title: string;
    description: string;
    direction: "up" | "down" | "stable";
  }>;
  consensus?: {
    outcome: "YES" | "NO" | "UNCERTAIN";
    confidence_percent: number;
    agreement_level: "high" | "moderate" | "low";
  };
}


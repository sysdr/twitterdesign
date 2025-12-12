export interface Incident {
  id: number;
  alert_name: string;
  severity: string;
  status: string;
  service: string;
  metrics: Record<string, any>;
  created_at: number;
  classified_at?: number;
  resolved_at?: number;
  escalated_at?: number;
  escalated_to?: string;
  resolved_by?: string;
  incident_type?: string;
  confidence?: number;
  actions_taken: any[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  type: string;
  description: string;
  result?: string;
  error?: string;
  timestamp: number;
}

export interface Metrics {
  total_incidents: number;
  auto_resolved: number;
  auto_resolution_rate: string;
  avg_mttr_seconds: number;
  escalated_count: number;
}

export interface Postmortem {
  id: number;
  incident_id: number;
  content: string;
  created_at: number;
  action_items: ActionItem[];
}

export interface ActionItem {
  priority: string;
  description: string;
  owner: string;
}

export interface DetectedEntity {
  entity_type: string;
  text: string;
  start: number;
  end: number;
  confidence_score: number;
  sensitivity_level: 'HIGH' | 'MEDIUM' | 'LOW';
  is_validated: boolean;
  validation_details?: string | null;
  masked_text: string;
}

export interface RiskBreakdownItem {
  entity_type: string;
  count: number;
  weight_per_item: number;
  total_points: number;
  sensitivity_level: string;
  explanation: string;
}

export interface RiskAssessment {
  score: number;
  category: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  raw_points: number;
  capped_points: number;
  breakdown: RiskBreakdownItem[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  entity_type?: string | null;
  action_steps: string[];
}

export interface ScanResponse {
  scan_id: string;
  timestamp: string;
  input_type: 'text' | 'document';
  document_name?: string | null;
  character_count: number;
  total_entities_detected: number;
  high_sensitivity_count: number;
  medium_sensitivity_count: number;
  low_sensitivity_count: number;
  detected_entities: DetectedEntity[];
  risk_assessment: RiskAssessment;
  recommendations: Recommendation[];
  original_text?: string | null;
  masked_text: string;
  processing_time_ms: number;
}

export interface ScanHistoryItem {
  scan_id: string;
  timestamp: string;
  input_type: string;
  document_name?: string | null;
  risk_score: number;
  risk_category: 'LOW' | 'MEDIUM' | 'HIGH';
  total_entities: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  entity_types_summary: Record<string, number>;
  character_count: number;
  processing_time_ms: number;
}

export interface DashboardSummary {
  total_scans: number;
  average_risk_score: number;
  high_risk_scans: number;
  medium_risk_scans: number;
  low_risk_scans: number;
  total_pii_detected: number;
  entity_distribution: Record<string, number>;
  sensitivity_distribution: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  recent_scans: ScanHistoryItem[];
}

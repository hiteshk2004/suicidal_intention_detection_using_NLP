
export enum PageStep {
  CONSENT = 0,
  REGISTER = 1,
  HOME = 2,
  ASSESSMENT = 3,
  DESCRIPTION = 4,
  LOADING = 5,
  RESULTS = 6,
  CRISIS_INTERVENTION = 7,
  // Removed FUTURE_SCOPE as requested
}

export interface UserProfile {
  name: string;
  phone: string;
  guardianPhone: string;
}

export interface AssessmentData {
  hopeless: number; // 0-3
  anxiety: number; // 0-3
  social_withdraw: 'Yes' | 'No';
  sleep: number; // 0-3
  self_harm: number; // 0-3
  plan?: 'Yes' | 'No';
  means?: 'Yes' | 'No';
  [key: string]: string | number | undefined; 
}

export interface QuestionDef {
  id: string;
  text: string;
  subtext: string;
  options: {
    label: string;
    value: string | number;
  }[];
}

export interface AnalysisResult {
  prediction: string; 
  confidence: string;
  suicidal_prob: string; 
  non_suicidal_prob: string;

  overall_mood_level: string;
  anxiety_concern: string;
  risk_alert: string;
  nlp_insights: {
    sentiment: string;
    key_themes: string[];
  };
  supportive_message: string;
  coping_suggestions: string[];
  crisis_support?: string;
}

export interface AppState {
  step: PageStep;
  user: UserProfile;
  data: AssessmentData;
  userDescription: string;
  result: AnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  currentQuestionIndex: number;
}

export const INITIAL_DATA: AssessmentData = {
  hopeless: -1,
  anxiety: -1,
  social_withdraw: 'No',
  sleep: -1,
  self_harm: -1,
};
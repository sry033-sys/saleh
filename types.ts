export interface OutlineItem {
  id: string;
  title: string;
}

export interface ResearchSection {
  title: string;
  content: string;
  citations: string[]; // Extracted for list view if needed
  sources: Array<{ title: string; uri: string }>; // From grounding
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING_OUTLINE = 'GENERATING_OUTLINE',
  OUTLINE_REVIEW = 'OUTLINE_REVIEW',
  GENERATING_RESEARCH = 'GENERATING_RESEARCH',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export type ResearchMode = 'scientific' | 'intellectual';

export interface ResearchData {
  topic: string;
  outline: OutlineItem[];
  sections: ResearchSection[];
  mode: ResearchMode;
}
export interface Character {
    name: string;
    mentions: number;
    description: string;
    aliases?: string[];
  }
  
  export interface Interaction {
    source: string;
    target: string;
    weight: number;
    contexts: string[];
  }
  
  export interface AnalysisResult {
    characters: Character[];
    interactions: Interaction[];
  }
  
  export interface StreamingUpdate {
    type: 'batch_complete' | 'analysis_complete' | 'error' | 'progress';
    batchIndex?: number;
    totalBatches?: number;
    data?: AnalysisResult;
    message?: string;
  }
  
  export interface NetworkNode {
    id: string;
    name: string;
    mentions: number;
    description: string;
    radius: number;
    importance: number;
    color: string;
    x?: number;
    y?: number;
    fx?: number;
    fy?: number;
  }
  
  export interface NetworkLink {
    source: string | NetworkNode;
    target: string | NetworkNode;
    weight: number;
    contexts: string[];
    strokeWidth: number;
  }
  
  export interface Book {
    title: string;
    url: string;
    author: string;
    description: string;
  }
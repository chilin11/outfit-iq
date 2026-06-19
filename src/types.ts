export type AppConfig = {
  apiUrl: string;
  apiKey: string;
  model: string;
};

export type RatingDimension = {
  name: string;
  score: number;
  comment: string;
};

export type RatingResult = {
  overall: number;
  title: string;
  summary: string;
  dimensions: RatingDimension[];
  pros: string[];
  cons: string[];
  suggestions: string[];
  outfit_items?: string[];
  occasion?: string;
  raw?: string;
};

export const DEFAULT_CONFIG: AppConfig = {
  apiUrl: 'https://api.anthropic.com',
  apiKey: '',
  model: 'claude-sonnet-4-5',
};

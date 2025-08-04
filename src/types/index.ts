// Analysis Types
export interface AnalysisSettings {
  aiProvider: 'claude' | 'openai';
  analysisDepth: 'quick' | 'standard' | 'deep';
  includeMobile: boolean;
  stealthMode: boolean;
  firecrawlKey?: string;
  aiKey?: string;
}

export interface UsabilityCategory {
  id: string;
  name: string;
  description: string;
  weight: number;
  score?: number;
  issues?: Issue[];
  recommendations?: (string | Recommendation)[];
  implementationTasks?: string[];
  details?: string;
}

export interface Issue {
  type: 'high' | 'medium' | 'low';
  description: string;
  page?: string;
  element?: string;
  krugPrinciple?: string;
}

export interface Recommendation {
  action: string;
  userTask: string;
  krugReference: string;
}

export interface CrawlResult {
  pages: PageData[];
  metadata: CrawlMetadata;
}

export interface PageData {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    keywords?: string;
    statusCode?: number;
    htmlContent?: string;  // Raw HTML content for comprehensive analysis
    markdownContent?: string;  // Markdown content for readable analysis
  };
}

export interface CrawlMetadata {
  totalPages: number;
  crawlDepth: string;
  crawlTime: string;
  baseUrl: string;
  fallback?: boolean;
}

export interface AnalysisResult {
  url: string;
  timestamp: Date;
  settings: AnalysisSettings;
  overallScore: number;
  categories: UsabilityCategory[];
  crawlData: CrawlResult;
  summary: {
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    recommendations: (string | Recommendation)[];
  };
}

export interface ProgressStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CrawlApiResponse extends ApiResponse<CrawlResult> {}
export interface AnalysisApiResponse extends ApiResponse<AnalysisResult> {}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    pointBackgroundColor?: string;
    pointBorderColor?: string;
    pointHoverBackgroundColor?: string;
    pointHoverBorderColor?: string;
  }[];
}

// Export Types
export interface ExportOptions {
  format: 'pdf' | 'markdown';
  includeCharts: boolean;
  includeRecommendations: boolean;
  includeDetails: boolean;
}

export interface TodoTask {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  krugReference?: string;
  userAction?: string;
  estimatedTime?: string;
  completed?: boolean;
}

export interface TodoExportOptions {
  format: 'markdown' | 'json' | 'csv';
  includePriority: boolean;
  includeReferences: boolean;
  groupByCategory: boolean;
}

// History Types
export interface HistoryItem {
  id: string;
  url: string;
  timestamp: Date;
  overallScore: number;
  summary: {
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  resultData: AnalysisResult;
  settings: {
    aiProvider: string;
    analysisDepth: string;
  };
}
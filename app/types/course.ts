// Content block types for rich content support
export type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'image'; url: string; caption?: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'chart'; chartType: 'bar' | 'line' | 'pie'; title: string; data: ChartData[] };

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface CoursePage {
  id: string;
  title: string;
  content: string; // Plain text content (for backwards compatibility)
  blocks?: ContentBlock[]; // Rich content blocks (optional)
}

export interface SectionQuiz {
  questions: import('./quiz').Question[];
}

export interface CourseSection {
  id: string;
  title: string;
  pages: CoursePage[];
  quiz?: SectionQuiz;
  slides?: import('./slideshow').Slide[];
  spanningImages?: import('./slideshow').SpanningImage[];
}

export interface Course {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  sections: CourseSection[];
}

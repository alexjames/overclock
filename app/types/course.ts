// 9-quadrant position grid: top/middle/bottom × left/center/right
export type ImagePosition =
  | 'top-left'    | 'top-center'    | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// Content block types for rich content support
export type TextAlign = 'left' | 'center' | 'right';

export type ContentBlock =
  | { type: 'text'; content: string; align?: TextAlign }
  | { type: 'code'; content: string; language?: string }
  | { type: 'image'; url: string; caption?: string; position?: ImagePosition; scale?: number }
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

export type SectionDisplayMode = 'slideshow' | 'pages';

export interface CourseSection {
  id: string;
  title: string;
  group?: string;
  pages: CoursePage[];
  displayMode?: SectionDisplayMode; // defaults to 'slideshow'
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

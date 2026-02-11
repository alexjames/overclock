import { ContentBlock } from './course';

export interface DiscoverSlide {
  id: string;
  title: string;
  blocks: ContentBlock[];
}

export interface DiscoverItem {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  color: string;
  slides: DiscoverSlide[];
}

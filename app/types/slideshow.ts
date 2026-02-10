export type SlideTextSize = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';

export interface SlideTextElement {
  type: 'text';
  content: string; // Supports **bold**, *italic*, ***both***
  x: number; // X position as percentage (0-100)
  y: number; // Y position as percentage (0-100, or 0-100*verticalPages for multi-page slides)
  size?: SlideTextSize; // defaults to 'medium'
  color?: string; // defaults to white
}

export interface SlideImageElement {
  type: 'image';
  url: string;
  x: number; // X position as percentage (0-100)
  y: number; // Y position as percentage (0-100, or 0-100*verticalPages for multi-page slides)
  width?: number; // percentage of screen width (0-100), defaults to 50
  height?: number; // percentage of screen height (0-100), defaults to 50
}

export type SlideElement = SlideTextElement | SlideImageElement;

// A spanning image that stretches across multiple slides
// The image stays fixed while slides scroll, revealing different portions
export interface SpanningImage {
  url: string;
  y: number; // Y position as percentage (0-100)
  height?: number; // percentage of content height (0-100), defaults to 50
  startSlide: number; // Index of first slide where image appears (0-based)
  endSlide: number; // Index of last slide where image appears (inclusive)
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  // Number of vertical pages (1 = no scroll, 2+ = scrollable)
  // Each page is one screen height, swipe up to reveal more
  verticalPages?: number;
}

export interface SlideshowData {
  slides: Slide[];
  spanningImages?: SpanningImage[];
}

// Text size mapping in pixels
export const TEXT_SIZES: Record<SlideTextSize, number> = {
  small: 14,
  medium: 20,
  large: 28,
  xlarge: 36,
  xxlarge: 48,
};

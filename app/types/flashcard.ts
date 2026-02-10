export type FlashcardType = 'tap_reveal' | 'fill_blank';

export interface Flashcard {
  id: string;
  type: FlashcardType;
  color: string;
  question: string;  // For tap_reveal: the question. For fill_blank: sentence with _____
  answer: string;    // The revealed answer
  category: string;
}

// Minimalist color palette for cards
export const CARD_COLORS = {
  softBlue: '#E8F4FD',
  warmBeige: '#FDF6E8',
  paleGreen: '#E8FDF4',
  lightLavender: '#F4E8FD',
  softCoral: '#FDE8E8',
  mutedMint: '#E8FDFA',
} as const;

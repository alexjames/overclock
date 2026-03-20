export type FlashcardType = 'tap_reveal' | 'fill_blank';

export interface Flashcard {
  id: string;
  type: FlashcardType;
  category: number;
  question: string;  // For tap_reveal: the question. For fill_blank: sentence with _____
  answer: string;    // The revealed answer
}

export interface FlashcardDeck {
  id: string;
  title: string;
  color: string;
  icon: string;
  count: number;
}

// Quiz question types for section quizzes

export enum QuestionFormat {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
}

export interface BaseQuestion {
  id: string;
  format: QuestionFormat;
  question: string;
  explanation?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  format: QuestionFormat.MULTIPLE_CHOICE;
  options: string[];
  correctAnswerIndex: number;
}

export interface TrueFalseQuestion extends BaseQuestion {
  format: QuestionFormat.TRUE_FALSE;
  correctAnswer: boolean;
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion;

export interface Quiz {
  id: string;
  questions: Question[];
}

export interface QuizAnswer {
  questionId: string;
  isCorrect: boolean;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
}

import { Course, CourseSection } from '../types/course';
import { DiscoverItem } from '../types/discover';
import { Flashcard, FlashcardDeck } from '../types/flashcard';
import { Quiz, Question } from '../types/quiz';

export interface QuizSummary {
  id: string;
  title: string;
  color: string;
  icon: string;
  questionCount: number;
}

const TIMEOUT_MS = 10000;

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function fetchCourses(apiHost: string): Promise<Course[]> {
  const res = await fetchWithTimeout(`${apiHost}/beta/v1/courses`);
  if (!res.ok) {
    throw new Error(`Failed to fetch courses: ${res.status}`);
  }
  return res.json();
}

export async function fetchSections(apiHost: string, courseId: string): Promise<CourseSection[]> {
  const res = await fetchWithTimeout(`${apiHost}/beta/v1/courses/${courseId}/sections`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sections: ${res.status}`);
  }
  return res.json();
}

export async function fetchSectionDetail(apiHost: string, courseId: string, sectionId: string): Promise<CourseSection> {
  const res = await fetchWithTimeout(`${apiHost}/beta/v1/courses/${courseId}/sections/${sectionId}/pages`);
  if (!res.ok) {
    throw new Error(`Failed to fetch section detail: ${res.status}`);
  }
  return res.json();
}

export async function fetchQuizList(apiHost: string): Promise<QuizSummary[]> {
  const res = await fetchWithTimeout(`${apiHost}/beta/v1/quiz`);
  if (!res.ok) {
    throw new Error(`Failed to fetch quiz list: ${res.status}`);
  }
  return res.json();
}

export async function fetchQuiz(apiHost: string, quizId: string): Promise<{ id: string; questions: Question[] }> {
  const res = await fetchWithTimeout(`${apiHost}/beta/v1/quiz/${quizId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch quiz: ${res.status}`);
  }
  return res.json();
}

export async function fetchFlashcardDecks(apiHost: string): Promise<FlashcardDeck[]> {
  const res = await fetchWithTimeout(`${apiHost}/beta/v1/review`);
  if (!res.ok) {
    throw new Error(`Failed to fetch flashcard decks: ${res.status}`);
  }
  return res.json();
}

export async function fetchFlashcardDeck(apiHost: string, deckId: string): Promise<{ id: string; cards: Flashcard[] }> {
  const res = await fetchWithTimeout(`${apiHost}/beta/v1/review/${deckId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch flashcard deck: ${res.status}`);
  }
  return res.json();
}

export async function fetchDiscover(apiHost: string): Promise<DiscoverItem[]> {
  const res = await fetchWithTimeout(`${apiHost}/beta/v1/discover`);
  if (!res.ok) {
    throw new Error(`Failed to fetch discover content: ${res.status}`);
  }
  return res.json();
}

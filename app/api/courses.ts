import { Course, CourseSection } from '../types/course';

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

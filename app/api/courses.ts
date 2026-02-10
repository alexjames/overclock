import { API_HOST } from '../config';
import { Course, CourseSection } from '../types/course';

export async function fetchCourses(): Promise<Course[]> {
  const res = await fetch(`${API_HOST}/beta/v1/courses`);
  if (!res.ok) {
    throw new Error(`Failed to fetch courses: ${res.status}`);
  }
  return res.json();
}

export async function fetchSections(courseId: string): Promise<CourseSection[]> {
  const res = await fetch(`${API_HOST}/beta/v1/courses/${courseId}/sections`);
  if (!res.ok) {
    throw new Error(`Failed to fetch sections: ${res.status}`);
  }
  return res.json();
}

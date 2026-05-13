import api from './api';
import courseService from './courseService';
import enrollmentService from './enrollmentService';
import userService from './userService';

export const fetchEnrollmentCounts = async (courseIds = []) => {
  const ids = [...new Set(courseIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
  if (ids.length === 0) return {};

  const response = await enrollmentService.getEnrollmentCounts(ids);
  const payload = response?.data || {};
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [String(key), Number(value) || 0]));
};

export const fetchCoursesByIds = async (courseIds = []) => {
  const courses = await courseService.getBulk(courseIds);
  return courses.reduce((acc, course) => {
    if (course?.courseId != null) {
      acc[course.courseId] = course;
    }
    return acc;
  }, {});
};

export const fetchProfilesByIds = async (userIds = []) => userService.getBulkProfiles(userIds);

export const fetchUniqueStudentCountByCourses = async (courseIds = []) => {
  const ids = [...new Set(courseIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
  if (ids.length === 0) return 0;

  const results = await Promise.allSettled(ids.map((courseId) => enrollmentService.getCourseEnrollments(courseId)));
  const studentIds = new Set();

  results.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    const enrollments = Array.isArray(result.value?.data) ? result.value.data : (result.value?.data?.data || []);
    enrollments.forEach((enrollment) => {
      const studentId = Number(enrollment?.studentId);
      if (Number.isFinite(studentId) && studentId > 0) {
        studentIds.add(studentId);
      }
    });
  });

  return studentIds.size;
};

export const fetchCourseContentCounts = async (courseIds = []) => {
  const ids = [...new Set(courseIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
  if (ids.length === 0) return { totalLessons: 0, totalAssessments: 0 };

  const results = await Promise.allSettled(
    ids.map((courseId) =>
      Promise.all([
        api.get(`/api/lesson/course/${courseId}`).catch(() => ({ data: [] })),
        api.get(`/api/assessment/quizzes/course/${courseId}`).catch(() => ({ data: [] })),
      ])
    )
  );

  return results.reduce(
    (acc, result) => {
      if (result.status !== 'fulfilled') return acc;
      const [lessonsRes, quizzesRes] = result.value;
      acc.totalLessons += Array.isArray(lessonsRes?.data) ? lessonsRes.data.length : 0;
      acc.totalAssessments += Array.isArray(quizzesRes?.data) ? quizzesRes.data.length : 0;
      return acc;
    },
    { totalLessons: 0, totalAssessments: 0 }
  );
};

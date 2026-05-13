import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import enrollmentService from '../services/enrollmentService';
import assessmentService from '../services/assessmentService';
import progressService from '../services/progressService';
import courseService from '../services/courseService';
import { fetchCoursesByIds } from '../services/dashboardService';
import { extractCollection } from '../lib/api/responseNormalizer';

/**
 * useDashboardData Hook
 * 
 * Orchestrates parallel data fetching for the student dashboard.
 * Eliminates waterfalls by triggering all core requests simultaneously.
 * Normalizes results into a ready-to-use view model.
 * 
 * @param {number|string} userId 
 */
export const useDashboardData = (userId) => {
  // 1. Fetch all core metrics in parallel
  const enrollmentsQuery = useQuery({
    queryKey: ['studentEnrollments', userId],
    queryFn: () => enrollmentService.getStudentEnrollments(userId),
    enabled: !!userId,
    staleTime: 60000,
    select: (res) => extractCollection(res.data)
  });

  const attemptsQuery = useQuery({
    queryKey: ['studentAttempts', userId],
    queryFn: () => assessmentService.getStudentAttempts(userId),
    enabled: !!userId,
    staleTime: 60000,
    select: (res) => extractCollection(res.data)
  });

  const certificatesQuery = useQuery({
    queryKey: ['studentCertificates', userId],
    queryFn: () => progressService.getAllCertificates(userId),
    enabled: !!userId,
    staleTime: 60000,
    select: (res) => extractCollection(res.data)
  });

  // 2. Fetch course details only after enrollments are loaded
  const enrollments = enrollmentsQuery.data || [];
  const courseIds = useMemo(() => 
    enrollments.map(e => e.courseId).filter(Boolean), 
    [enrollments]
  );

  const coursesQuery = useQuery({
    queryKey: ['coursesBulk', courseIds],
    queryFn: () => fetchCoursesByIds(courseIds),
    enabled: courseIds.length > 0,
    staleTime: 300000,
  });

  // 3. Recommended courses
  const featuredQuery = useQuery({
    queryKey: ['featuredCourses'],
    queryFn: () => courseService.getFeatured(),
    staleTime: 600000,
    select: (courses) => [...courses].sort(() => 0.5 - Math.random()).slice(0, 8)
  });

  // 4. Assemble the dashboard view model
  const dashboard = useMemo(() => {
    const courseMap = coursesQuery.data || {};
    
    const activeCourses = enrollments.map(e => {
      const course = courseMap[e.courseId];
      if (course) return { ...course, progressPercentage: e.progressPercent || 0, enrollmentId: e.enrollmentId };
      return e.courseId ? { courseId: e.courseId, title: `Course ${e.courseId}`, progressPercentage: e.progressPercent || 0 } : null;
    }).filter(Boolean);

    return {
      stats: {
        enrolled: enrollments.length,
        completed: enrollments.filter(e => e.status === 'COMPLETED' || e.progressPercent === 100).length,
        certificates: (certificatesQuery.data || []).length,
        quizzesTaken: (attemptsQuery.data || []).length
      },
      activeCourses,
      featuredCourses: featuredQuery.data || []
    };
  }, [enrollments, coursesQuery.data, certificatesQuery.data, attemptsQuery.data, featuredQuery.data]);

  return {
    dashboard,
    isLoading: enrollmentsQuery.isLoading || coursesQuery.isLoading,
    isRefreshing: enrollmentsQuery.isFetching,
    error: enrollmentsQuery.error || coursesQuery.error
  };
};

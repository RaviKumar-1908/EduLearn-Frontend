import api from './api';

const progressService = {
  // Track watched time (seconds)
  trackProgress: (studentId, courseId, lessonId, watchedSeconds) => 
    api.post(`/api/progress/track?studentId=${studentId}&courseId=${courseId}&lessonId=${lessonId}&watchedSeconds=${watchedSeconds}`),

  // Mark lesson as completed
  markLessonComplete: (studentId, courseId, lessonId) => 
    api.post(`/api/progress/complete?studentId=${studentId}&courseId=${courseId}&lessonId=${lessonId}`),

  // Get completion % for a course
  getCourseProgress: (studentId, courseId) => 
    api.get(`/api/progress/course?studentId=${studentId}&courseId=${courseId}`),

  // Get progress for a specific lesson
  getLessonProgress: (studentId, lessonId) => 
    api.get(`/api/progress/lesson?studentId=${studentId}&lessonId=${lessonId}`),

  // Get all progress records for a student
  getAllStudentProgress: (studentId) => 
    api.get(`/api/progress/student?studentId=${studentId}`),

  // Certificate Management
  issueCertificate: (studentId, courseId, courseName, instructorName, courseLevel, courseDuration) => 
    api.post(`/api/progress/certificates/issue?studentId=${studentId}&courseId=${courseId}&courseName=${encodeURIComponent(courseName)}&instructorName=${encodeURIComponent(instructorName)}&courseLevel=${encodeURIComponent(courseLevel)}&courseDuration=${courseDuration}`),

  getCertificate: (studentId, courseId) => 
    api.get(`/api/progress/certificates?studentId=${studentId}&courseId=${courseId}`),

  getAllCertificates: (studentId) => 
    api.get(`/api/progress/certificates/student?studentId=${studentId}`),

  verifyCertificate: (code) => 
    api.get(`/api/progress/certificates/verify?code=${code}`),

  emailCertificate: (emailData) =>
    api.post('/api/notification/email/certificate', emailData),
};

export default progressService;

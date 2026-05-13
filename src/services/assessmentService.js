import api from './api';

const assessmentService = {
  // Quiz Management
  getQuizzesByCourse: (courseId) => api.get(`/api/assessment/quizzes/course/${courseId}`),
  createQuiz: (quizData) => api.post('/api/assessment/quizzes', quizData),
  updateQuiz: (quizData) => api.put('/api/assessment/quizzes', quizData),
  deleteQuiz: (quizId) => api.delete(`/api/assessment/quizzes/${quizId}`),
  publishQuiz: (quizId) => api.put(`/api/assessment/quizzes/${quizId}/publish`),

  // Question Management
  addQuestions: (quizId, questions) => api.post(`/api/assessment/quizzes/${quizId}/questions`, questions),
  getQuizById: (quizId) => api.get(`/api/assessment/quizzes/${quizId}`),
  getQuestions: (quizId) => api.get(`/api/assessment/quizzes/${quizId}/questions`),

  // Attempts
  startAttempt: (quizId, studentId) => api.post(`/api/assessment/attempts/start?quizId=${quizId}&studentId=${studentId}`),
  submitAttempt: (attemptId, answers) => api.post(`/api/assessment/attempts/${attemptId}/submit`, answers),
  getStudentAttempts: (studentId) => api.get(`/api/assessment/attempts/student/${studentId}`),
  getQuizAttempts: (quizId) => api.get(`/api/assessment/attempts/quiz/${quizId}`),
  getBestAttempt: (quizId, studentId) => api.get(`/api/assessment/attempts/best?quizId=${quizId}&studentId=${studentId}`),
};

export default assessmentService;

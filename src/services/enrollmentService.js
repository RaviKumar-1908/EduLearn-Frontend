import api from './api';

const enrollmentService = {
  enroll: (studentId, courseId, price = 0) => api.post('/api/enrollment/enroll', {}, {
    params: {
      studentId: Number(studentId),
      courseId: Number(courseId),
      price: Number(price)
    }
  }),
  
  unenroll: (studentId, courseId) => api.delete('/api/enrollment/unenroll', {
    params: {
      studentId: Number(studentId),
      courseId: Number(courseId)
    }
  }),
  
  getStudentEnrollments: (studentId) => api.get(`/api/enrollment/student/${Number(studentId)}`),
  
  getCourseEnrollments: (courseId) => api.get(`/api/enrollment/course/${Number(courseId)}`),
  
  updateProgress: (studentId, courseId, progress) => api.put(`/api/enrollment/progress?studentId=${Number(studentId)}&courseId=${Number(courseId)}&progressPercent=${Number(progress)}`),
  
  markComplete: (studentId, courseId) => api.put(`/api/enrollment/complete?studentId=${Number(studentId)}&courseId=${Number(courseId)}`),
  
  checkEnrollment: (studentId, courseId) => api.get(`/api/enrollment/isEnrolled?studentId=${Number(studentId)}&courseId=${Number(courseId)}`),
  
  getEnrollmentCount: (courseId) => api.get(`/api/enrollment/count/${Number(courseId)}`),

  getEnrollmentCounts: (courseIds = []) => {
    const params = new URLSearchParams();
    courseIds
      .map((courseId) => Number(courseId))
      .filter((courseId) => Number.isFinite(courseId) && courseId > 0)
      .forEach((courseId) => params.append('courseIds', courseId));
    return api.get(`/api/enrollment/counts?${params.toString()}`);
  },
  
  issueCertificate: (studentId, courseId) => api.post(`/api/enrollment/certificate?studentId=${Number(studentId)}&courseId=${Number(courseId)}`)
};

export default enrollmentService;

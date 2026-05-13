import api from './api';

const DEFAULT_ERROR_MESSAGE = "I'm sorry, I couldn't generate a response right now.";

const aiService = {
  /**
   * Ask the AI Tutor a question about a specific lesson.
   * @param {string|number} lessonId - The ID of the lesson.
   * @param {string} question - The student's question.
   * @returns {Promise<string>} - The AI's response.
   */
  askLessonAI: async (lessonId, question) => {
    try {
      const response = await api.post(`/api/lesson/${lessonId}/ask-ai`, {
        question: question
      });

      const payload = response?.data;

      if (payload?.success === false) {
        throw new Error(payload.response || payload.message || DEFAULT_ERROR_MESSAGE);
      }

      if (typeof payload === 'string') {
        return payload;
      }

      return payload?.data || payload?.response || DEFAULT_ERROR_MESSAGE;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }
};

export default aiService;

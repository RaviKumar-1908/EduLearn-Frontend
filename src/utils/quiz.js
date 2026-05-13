export function extractLessonIdFromQuizTitle(title = '') {
  const match = title.match(/\[L-(\d+)\]/i);
  return match ? Number(match[1]) : null;
}

export function findQuizForLesson(quizzes = [], lesson) {
  if (!lesson?.lessonId) return null;

  return quizzes.find((quiz) => {
    const title = quiz?.title || '';
    const lessonIdFromTitle = extractLessonIdFromQuizTitle(title);
    return lessonIdFromTitle === Number(lesson.lessonId) || title === `${lesson.title} - Quiz`;
  }) || null;
}

export function isQuizVisibleToStudent(quiz) {
  return quiz?.published !== false && quiz?.isPublished !== false;
}

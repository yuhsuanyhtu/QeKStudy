function fail(code) {
  return { ok: false, error: { code, message: code } };
}

function success(data) {
  return { ok: true, data };
}

export function calculateSavingPool(events = []) {
  return events.reduce((sum, event) => sum + Math.max(0, Number(event.rewardAmount) || 0), 0);
}

export function calculateDailySubjectEarned({ events = [], studentId, subject, date }) {
  return events.reduce((sum, event) => {
    const eventDate = String(event.occurredAt || '').slice(0, 10);
    if (event.studentId === studentId && event.subject === subject && eventDate === date) {
      return sum + Math.max(0, Number(event.rewardAmount) || 0);
    }
    return sum;
  }, 0);
}

export function countSuccessfulHistory({ events = [], studentId, contentId }) {
  return events.filter(
    (event) =>
      event.studentId === studentId &&
      event.contentId === contentId &&
      event.correct === true,
  ).length;
}

export function createLearningEventService({
  repository,
  resolveControlledStudent,
  idFactory,
  now = () => new Date().toISOString(),
}) {
  async function recordLearningEvent(input) {
    try {
      const student = await resolveControlledStudent();
      if (!student?.studentId || !student?.familyId) return fail('CONTROLLED_STUDENT_NOT_AVAILABLE');

      const event = {
        learningEventId: idFactory('learning_event'),
        occurredAt: now(),
        familyId: student.familyId,
        studentId: student.studentId,
        subject: input.subject || 'ENGLISH',
        sessionId: input.sessionId || '',
        eventType: input.eventType || '',
        lessonId: input.lessonId || '',
        contentId: input.contentId || '',
        questionSourceType: input.questionSourceType || '',
        attemptNo: input.attemptNo ?? '',
        correct: input.correct ?? '',
        firstAttemptCorrect: input.firstAttemptCorrect ?? '',
        rewardAmount: Math.max(0, Number(input.rewardAmount) || 0),
        reviewTarget: input.reviewTarget || '',
        sourceRef: input.sourceRef || '',
        note: input.note || '',
      };

      await repository.appendLearningEvent(event);
      return success({ event: { ...event } });
    } catch {
      return fail('PERSISTENCE_FAILED');
    }
  }

  return { recordLearningEvent };
}

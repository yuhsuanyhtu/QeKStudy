export function isQuestionEligible({ question, learnedKnowledgePointIds = [] }) {
  if (question?.sourceType !== 'CAP') return true;
  const learned = new Set(learnedKnowledgePointIds);
  return (question.prerequisiteKnowledgePointIds || []).every((id) => learned.has(id));
}

export function composeQuiz({ questions = [], learnedKnowledgePointIds = [] }) {
  const eligible = questions.filter((question) =>
    isQuestionEligible({ question, learnedKnowledgePointIds }),
  );

  const requiredTypes = ['CURRENT', 'PRIOR', 'CAP'];
  for (const type of requiredTypes) {
    if (!eligible.some((question) => question.sourceType === type)) {
      const code = 'QUIZ_MISSING_' + type;
      const error = new Error(code);
      error.code = code;
      throw error;
    }
  }

  return { questions: eligible };
}

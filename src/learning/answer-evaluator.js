function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function evaluateZhToEn({ answer, acceptedAnswers = [] }) {
  const actual = normalize(answer);
  return {
    correct: actual.length > 0 && acceptedAnswers.some((candidate) => normalize(candidate) === actual),
  };
}

export function evaluateMultipleChoice({ selectedChoiceId, correctChoiceId }) {
  return { correct: String(selectedChoiceId ?? '') === String(correctChoiceId ?? '') };
}

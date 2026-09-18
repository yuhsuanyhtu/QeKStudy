export function createAttemptState({ questionId }) {
  const attempts = [];
  let rewardConsumed = false;

  function recordAttempt({ answer, correct }) {
    attempts.push({
      attemptNo: attempts.length + 1,
      answer,
      correct: Boolean(correct),
    });
  }

  function snapshot() {
    return {
      questionId,
      attempts: attempts.map((item) => ({ ...item })),
      firstAttemptCorrect: attempts.length ? attempts[0].correct : null,
      resolved: attempts.some((item) => item.correct),
      rewardGranted: rewardConsumed,
    };
  }

  function consumeRewardEligibility() {
    if (rewardConsumed || !attempts.some((item) => item.correct)) return false;
    rewardConsumed = true;
    return true;
  }

  return { recordAttempt, snapshot, consumeRewardEligibility };
}

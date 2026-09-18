// BDD-005 reward policy has not been numerically approved yet.
// Keep learning/event persistence usable, but do not invent real allowance amounts.
// Once the family approves actual values, change configured to true and fill every value.
function getEnglishRewardConfig_() {
  return {
    configured: false,
    dailyCap: null,
    flashcardLessonCompletion: null,
    difficultyBase: {},
    retryFactor: null,
    repeatFactors: [],
  };
}

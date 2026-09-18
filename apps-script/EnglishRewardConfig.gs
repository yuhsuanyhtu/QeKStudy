function getEnglishRewardConfig_() {
  return {
    dailyCap: 100,
    flashcardLessonCompletion: 5,
    difficultyBase: {
      1: 2,
      2: 4,
      3: 6,
    },
    retryFactor: 0.5,
    repeatFactors: [1, 0.5, 0.25],
  };
}

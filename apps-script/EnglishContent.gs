function getEnglishLesson_() {
  return {
    lessonId: 'demo-english-001',
    displayName: 'English Demo Lesson 1',
    words: [
      { wordId: 'w-apple', english: 'apple', chinese: '蘋果', reviewTarget: 'Demo Lesson 1 / apple' },
      { wordId: 'w-book', english: 'book', chinese: '書', reviewTarget: 'Demo Lesson 1 / book' },
      { wordId: 'w-family', english: 'family', chinese: '家庭', reviewTarget: 'Demo Lesson 1 / family' },
      { wordId: 'w-study', english: 'study', chinese: '學習', reviewTarget: 'Demo Lesson 1 / study' },
      { wordId: 'w-because', english: 'because', chinese: '因為', reviewTarget: 'Demo Lesson 1 / because' },
    ],
    source: {
      type: 'PROJECT_AUTHORED_DEMO',
      name: 'QeKStudy demo vocabulary',
      licenseOrLegalBasis: 'Project-authored demo content',
    },
  };
}

function getEnglishQuiz_() {
  return [
    {
      questionId: 'q-current-apple',
      kind: 'ZH_TO_EN',
      sourceType: 'CURRENT',
      prompt: '蘋果',
      acceptedAnswers: ['apple'],
      difficulty: 1,
      prerequisiteKnowledgePointIds: ['word-apple'],
      reviewTarget: 'Demo Lesson 1 / apple',
      sourceRef: 'QeKStudy demo vocabulary',
    },
    {
      questionId: 'q-prior-book',
      kind: 'ZH_TO_EN',
      sourceType: 'PRIOR',
      prompt: '書',
      acceptedAnswers: ['book'],
      difficulty: 1,
      prerequisiteKnowledgePointIds: ['word-book'],
      reviewTarget: 'Previously learned vocabulary / book',
      sourceRef: 'QeKStudy demo vocabulary',
    },
    {
      questionId: 'q-cap-placeholder',
      kind: 'MULTIPLE_CHOICE',
      sourceType: 'CAP',
      prompt: 'CAP integration placeholder — replace with verified official question before acceptance.',
      choices: [
        { choiceId: 'a', label: 'A' },
        { choiceId: 'b', label: 'B' },
      ],
      correctChoiceId: 'a',
      difficulty: 2,
      prerequisiteKnowledgePointIds: ['word-because'],
      reviewTarget: 'because / so',
      sourceRef: 'PLACEHOLDER_NOT_FOR_ACCEPTANCE',
      acceptanceBlocked: true,
    },
  ];
}

function englishCatalogUrl_() {
  return 'https://yuhsuanyhtu.github.io/QeKStudy/data/english/catalog.json';
}

function loadEnglishCatalog_() {
  let response;
  try {
    response = UrlFetchApp.fetch(englishCatalogUrl_(), {
      muteHttpExceptions: true,
      headers: { 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    throw qekError_('CONTENT_NOT_AVAILABLE');
  }

  if (response.getResponseCode() !== 200) {
    throw qekError_('CONTENT_HTTP_' + response.getResponseCode());
  }

  let catalog;
  try {
    catalog = JSON.parse(response.getContentText());
  } catch (error) {
    throw qekError_('CONTENT_INVALID');
  }

  validateEnglishCatalog_(catalog);
  return catalog;
}

function validateEnglishCatalog_(catalog) {
  if (!catalog || !catalog.catalogVersion || !catalog.lesson || !Array.isArray(catalog.questions)) {
    throw qekError_('CONTENT_INVALID');
  }

  if (!catalog.lesson.lessonId || !catalog.lesson.revision || !Array.isArray(catalog.lesson.words)) {
    throw qekError_('CONTENT_INVALID');
  }

  catalog.lesson.words.forEach(function(word) {
    if (!word.wordId || !word.revision || !word.english || !word.chinese || !word.source) {
      throw qekError_('CONTENT_INVALID');
    }
  });

  catalog.questions.forEach(function(question) {
    if (
      !question.questionId ||
      !question.revision ||
      !question.kind ||
      !question.sourceType ||
      !question.prompt ||
      !question.reviewTarget ||
      !question.source
    ) {
      throw qekError_('CONTENT_INVALID');
    }

    if (question.kind === 'ZH_TO_EN' && !Array.isArray(question.acceptedAnswers)) {
      throw qekError_('CONTENT_INVALID');
    }

    if (
      question.kind === 'MULTIPLE_CHOICE' &&
      (!Array.isArray(question.choices) || !question.correctChoiceId)
    ) {
      throw qekError_('CONTENT_INVALID');
    }
  });
}

function contentKey_(id, revision) {
  return String(id) + '@r' + String(revision);
}

function activeEnglishQuestions_(catalog) {
  return catalog.questions.filter(function(question) {
    return question.active !== false;
  });
}

function findEnglishQuestionRevision_(catalog, questionId, revision) {
  return catalog.questions.find(function(question) {
    return (
      question.questionId === questionId &&
      Number(question.revision) === Number(revision)
    );
  }) || null;
}

function publicEnglishQuestion_(question) {
  const result = {
    questionId: question.questionId,
    revision: question.revision,
    contentId: contentKey_(question.questionId, question.revision),
    kind: question.kind,
    sourceType: question.sourceType,
    prompt: question.prompt,
    difficulty: question.difficulty,
    reviewTarget: question.reviewTarget,
  };

  if (question.kind === 'MULTIPLE_CHOICE') {
    result.choices = question.choices.map(function(choice) {
      return { choiceId: choice.choiceId, label: choice.label };
    });
  }

  return result;
}

function sourceRefForQuestion_(catalog, question) {
  const source = question.source || {};
  const pieces = [
    'catalog=' + catalog.catalogVersion,
    'content=' + contentKey_(question.questionId, question.revision),
    'source=' + String(source.name || source.type || ''),
  ];

  if (source.year) pieces.push('year=' + source.year);
  if (source.questionNumber) pieces.push('question=' + source.questionNumber);
  return pieces.join('; ');
}

function sourceRefForLesson_(catalog, lesson) {
  return [
    'catalog=' + catalog.catalogVersion,
    'content=' + contentKey_(lesson.lessonId, lesson.revision),
    'source=' + String((lesson.source && (lesson.source.name || lesson.source.type)) || ''),
  ].join('; ');
}

function normalizeEnglishAnswer_(value) {
  return String(value == null ? '' : value).trim().toLowerCase();
}

function evaluateQuestion_(question, input) {
  if (question.kind === 'ZH_TO_EN') {
    const answer = normalizeEnglishAnswer_(input && input.answer);
    return answer !== '' && question.acceptedAnswers.some(function(candidate) {
      return normalizeEnglishAnswer_(candidate) === answer;
    });
  }

  if (question.kind === 'MULTIPLE_CHOICE') {
    return String(input && input.selectedChoiceId || '') === String(question.correctChoiceId);
  }

  throw qekError_('CONTENT_INVALID');
}

function repeatFactor_(factors, previousSuccessCount) {
  if (!Array.isArray(factors) || factors.length === 0) return 1;
  const index = Math.min(Math.max(0, previousSuccessCount), factors.length - 1);
  const value = Number(factors[index]);
  return isFinite(value) ? Math.max(0, value) : 0;
}

function calculateEnglishReward_({
  baseAmount,
  attemptNo,
  previousSuccessCount,
  todayEarned,
  config,
}) {
  const attemptFactor = Number(attemptNo) > 1 ? Number(config.retryFactor) : 1;
  const repeatFactor = repeatFactor_(config.repeatFactors, previousSuccessCount);
  const rawAmount = Math.round(
    Math.max(0, Number(baseAmount) || 0) *
    Math.max(0, Number(attemptFactor) || 0) *
    repeatFactor
  );
  const remaining = Math.max(0, Number(config.dailyCap) - Number(todayEarned || 0));
  return Math.min(rawAmount, remaining);
}

function previousSuccessfulContentCount_(events, contentId, currentSessionId) {
  return events.filter(function(event) {
    return (
      event.contentId === contentId &&
      event.correct === true &&
      String(event.sessionId || '') !== String(currentSessionId || '')
    );
  }).length;
}

function currentSessionAttempts_(events, contentId, sessionId) {
  return events.filter(function(event) {
    return (
      event.eventType === 'ANSWER_ATTEMPT' &&
      event.contentId === contentId &&
      String(event.sessionId || '') === String(sessionId || '')
    );
  });
}

function currentSessionAlreadyRewarded_(events, contentId, sessionId) {
  return currentSessionAttempts_(events, contentId, sessionId).some(function(event) {
    return event.correct === true && Number(event.rewardAmount) > 0;
  });
}

function apiEnglishBootstrap() {
  return apiResult_(function() {
    ensureSchema_();
    const student = controlledStudent_();
    const events = listLearningEventsForStudent_(student.studentId);
    const catalog = loadEnglishCatalog_();
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    const config = getEnglishRewardConfig_();

    return {
      student: student,
      catalogVersion: catalog.catalogVersion,
      savingPool: calculateSavingPool_(events),
      todayEnglishEarned: calculateDailySubjectEarned_(events, 'ENGLISH', today),
      rewardConfigured: config.configured === true,
      dailyCap: config.configured === true ? config.dailyCap : null,
      lesson: {
        lessonId: catalog.lesson.lessonId,
        revision: catalog.lesson.revision,
        contentId: contentKey_(catalog.lesson.lessonId, catalog.lesson.revision),
        displayName: catalog.lesson.displayName,
        words: catalog.lesson.words.map(function(word) {
          return {
            wordId: word.wordId,
            revision: word.revision,
            contentId: contentKey_(word.wordId, word.revision),
            english: word.english,
            chinese: word.chinese,
            reviewTarget: word.reviewTarget,
          };
        }),
      },
      quiz: activeEnglishQuestions_(catalog).map(publicEnglishQuestion_),
    };
  });
}

function apiEnglishSubmitAnswer(input) {
  return apiResult_(function() {
    ensureSchema_();
    const sessionId = String(input && input.sessionId || '');
    const questionId = String(input && input.questionId || '');
    const revision = Number(input && input.revision);
    if (!sessionId || !questionId || !revision) throw qekError_('ANSWER_REQUIRED');

    const student = controlledStudent_();
    const catalog = loadEnglishCatalog_();
    const question = findEnglishQuestionRevision_(
      catalog,
      questionId,
      revision
    );
    if (!question) throw qekError_('CONTENT_NOT_AVAILABLE');

    const contentId = contentKey_(question.questionId, question.revision);
    const events = listLearningEventsForStudent_(student.studentId);
    const attempts = currentSessionAttempts_(events, contentId, sessionId);
    const attemptNo = attempts.length + 1;
    const correct = evaluateQuestion_(question, input);
    const firstAttemptCorrect = attempts.length
      ? Boolean(attempts[0].firstAttemptCorrect)
      : correct;

    let rewardAmount = 0;
    const config = getEnglishRewardConfig_();
    if (
      correct &&
      config.configured === true &&
      !currentSessionAlreadyRewarded_(events, contentId, sessionId)
    ) {
      const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
      const todayEarned = calculateDailySubjectEarned_(events, 'ENGLISH', today);
      const previousSuccessCount = previousSuccessfulContentCount_(
        events,
        contentId,
        sessionId
      );
      rewardAmount = calculateEnglishReward_({
        baseAmount: config.difficultyBase[question.difficulty] || 0,
        attemptNo: attemptNo,
        previousSuccessCount: previousSuccessCount,
        todayEarned: todayEarned,
        config: config,
      });
    }

    const event = {
      learningEventId: 'learn_' + Utilities.getUuid(),
      occurredAt: new Date().toISOString(),
      familyId: student.familyId,
      studentId: student.studentId,
      subject: 'ENGLISH',
      sessionId: sessionId,
      eventType: 'ANSWER_ATTEMPT',
      lessonId: '',
      contentId: contentId,
      questionSourceType: question.sourceType,
      attemptNo: attemptNo,
      correct: correct,
      firstAttemptCorrect: firstAttemptCorrect,
      rewardAmount: rewardAmount,
      reviewTarget: correct ? '' : question.reviewTarget,
      sourceRef: sourceRefForQuestion_(catalog, question),
      note: '',
    };

    withScriptLock_(function() {
      appendLearningEvent_(event);
      SpreadsheetApp.flush();
    });

    const updatedEvents = listLearningEventsForStudent_(student.studentId);
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    return {
      correct: correct,
      attemptNo: attemptNo,
      firstAttemptCorrect: firstAttemptCorrect,
      rewardAmount: rewardAmount,
      reviewTarget: correct ? '' : question.reviewTarget,
      rewardConfigured: config.configured === true,
      savingPool: calculateSavingPool_(updatedEvents),
      todayEnglishEarned: calculateDailySubjectEarned_(
        updatedEvents,
        'ENGLISH',
        today
      ),
    };
  });
}

function apiEnglishCompleteFlashcards(input) {
  return apiResult_(function() {
    ensureSchema_();
    const sessionId = String(input && input.sessionId || '');
    const lessonId = String(input && input.lessonId || '');
    const revision = Number(input && input.revision);
    const exposureByWordId = (input && input.exposureByWordId) || {};
    if (!sessionId || !lessonId || !revision) throw qekError_('CONTENT_INVALID');

    const student = controlledStudent_();
    const catalog = loadEnglishCatalog_();
    const lesson = catalog.lesson;
    if (
      lesson.lessonId !== lessonId ||
      Number(lesson.revision) !== revision
    ) {
      throw qekError_('CONTENT_NOT_AVAILABLE');
    }

    const complete = lesson.words.every(function(word) {
      return Number(exposureByWordId[word.wordId] || 0) >= 1000;
    });
    if (!complete) throw qekError_('FLASHCARD_NOT_COMPLETE');

    const contentId = contentKey_(lesson.lessonId, lesson.revision);
    const events = listLearningEventsForStudent_(student.studentId);
    const alreadyRewarded = events.some(function(event) {
      return (
        event.eventType === 'FLASHCARD_COMPLETE' &&
        event.contentId === contentId &&
        String(event.sessionId || '') === sessionId
      );
    });

    const config = getEnglishRewardConfig_();
    const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
    const todayEarned = calculateDailySubjectEarned_(events, 'ENGLISH', today);
    const rewardAmount =
      alreadyRewarded || config.configured !== true
        ? 0
        : Math.min(
            Math.max(0, Number(config.flashcardLessonCompletion) || 0),
            Math.max(0, Number(config.dailyCap) - todayEarned)
          );

    if (!alreadyRewarded) {
      const event = {
        learningEventId: 'learn_' + Utilities.getUuid(),
        occurredAt: new Date().toISOString(),
        familyId: student.familyId,
        studentId: student.studentId,
        subject: 'ENGLISH',
        sessionId: sessionId,
        eventType: 'FLASHCARD_COMPLETE',
        lessonId: lesson.lessonId,
        contentId: contentId,
        questionSourceType: '',
        attemptNo: '',
        correct: '',
        firstAttemptCorrect: '',
        rewardAmount: rewardAmount,
        reviewTarget: '',
        sourceRef: sourceRefForLesson_(catalog, lesson),
        note: 'all_words_visible_at_least_1000ms',
      };

      withScriptLock_(function() {
        appendLearningEvent_(event);
        SpreadsheetApp.flush();
      });
    }

    const updatedEvents = listLearningEventsForStudent_(student.studentId);
    return {
      complete: true,
      rewardAmount: rewardAmount,
      rewardConfigured: config.configured === true,
      savingPool: calculateSavingPool_(updatedEvents),
      todayEnglishEarned: calculateDailySubjectEarned_(
        updatedEvents,
        'ENGLISH',
        today
      ),
    };
  });
}


function apiEnglishContentDiagnostic() {
  const url = englishCatalogUrl_();
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { 'Cache-Control': 'no-cache' },
  });

  const body = response.getContentText();
  const result = {
    url: url,
    responseCode: response.getResponseCode(),
    contentType: response.getHeaders()['Content-Type'] || '',
    bodyStart: body.slice(0, 160),
  };

  console.log(JSON.stringify(result));
  return result;
}

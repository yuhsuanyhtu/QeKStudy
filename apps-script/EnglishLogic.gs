function englishCatalogUrl_() {
  return 'https://yuhsuanyhtu.github.io/QeKStudy/data/english/catalog.json';
}

// Repo content changes still need no redeploy; they appear once this cache
// expires (GitHub Pages itself serves the file with max-age=600).
function englishCatalogCacheSeconds_() {
  return 300;
}

function englishCatalogCacheKey_() {
  return 'qek:english:catalog:' + englishCatalogUrl_();
}

function loadEnglishCatalog_(options) {
  const fresh = Boolean(options && options.fresh);
  const cache = CacheService.getScriptCache();
  if (!fresh) {
    const cachedCatalog = cachedEnglishCatalog_(cache);
    if (cachedCatalog) return cachedCatalog;
  }

  const catalog = fetchEnglishCatalog_();
  try {
    cache.put(englishCatalogCacheKey_(), JSON.stringify(catalog), englishCatalogCacheSeconds_());
  } catch (error) {
    // Oversized or unavailable cache only costs speed, never correctness.
    console.warn('[QeK English] catalog not cached: ' + error);
  }
  return catalog;
}

function cachedEnglishCatalog_(cache) {
  try {
    const cached = cache.get(englishCatalogCacheKey_());
    if (!cached) return null;
    const catalog = JSON.parse(cached);
    validateEnglishCatalog_(catalog);
    return catalog;
  } catch (error) {
    return null;
  }
}

function fetchEnglishCatalog_() {
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

// A browser may hold a newer catalog than this script's cache; refetch once on a miss.
function loadEnglishQuestionRevision_(questionId, revision) {
  let catalog = loadEnglishCatalog_();
  let question = findEnglishQuestionRevision_(catalog, questionId, revision);
  if (!question) {
    catalog = loadEnglishCatalog_({ fresh: true });
    question = findEnglishQuestionRevision_(catalog, questionId, revision);
  }
  if (!question) throw qekError_('CONTENT_NOT_AVAILABLE');
  return { catalog: catalog, question: question };
}

function isRequestedLesson_(lesson, lessonId, revision) {
  return lesson.lessonId === lessonId && Number(lesson.revision) === revision;
}

function loadEnglishLessonRevision_(lessonId, revision) {
  let catalog = loadEnglishCatalog_();
  if (!isRequestedLesson_(catalog.lesson, lessonId, revision)) {
    catalog = loadEnglishCatalog_({ fresh: true });
  }
  if (!isRequestedLesson_(catalog.lesson, lessonId, revision)) {
    throw qekError_('CONTENT_NOT_AVAILABLE');
  }
  return catalog;
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
  }).sort(function(a, b) {
    return Number(a.attemptNo) - Number(b.attemptNo);
  });
}

function currentSessionAlreadyRewarded_(events, contentId, sessionId) {
  return currentSessionAttempts_(events, contentId, sessionId).some(function(event) {
    return event.correct === true && Number(event.rewardAmount) > 0;
  });
}

function englishToday_() {
  return taipeiDate_(new Date());
}

function positiveInteger_(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

// English endpoints report an error category so the page can tell content,
// busy, persistence and request problems apart.
function englishApiResult_(work) {
  try {
    return { ok: true, data: work() };
  } catch (error) {
    const expected = Boolean(error && error.code);
    const code = expected ? String(error.code) : unexpectedEnglishErrorCode_(error);
    if (!expected) {
      console.error('[QeK English] ' + code + ': ' + (error && error.stack ? error.stack : String(error)));
    }
    return {
      ok: false,
      error: {
        code: code,
        category: englishErrorCategory_(code),
        message: error && error.message ? String(error.message) : code,
      },
    };
  }
}

function unexpectedEnglishErrorCode_(error) {
  const message = String(error && error.message ? error.message : error);
  return /too many|simultaneous|rate limit|timed? ?out|lock|busy|try again later/i.test(message)
    ? 'SERVER_BUSY'
    : 'SERVER_ERROR';
}

function englishErrorCategory_(code) {
  if (/^CONTENT_/.test(code)) return 'CONTENT';
  if (code === 'PERSISTENCE_BUSY' || code === 'SERVER_BUSY') return 'SERVER_BUSY';
  if (code === 'PERSISTENCE_FAILED') return 'PERSISTENCE';
  if (code === 'ANSWER_REQUIRED' || code === 'FLASHCARD_NOT_COMPLETE') return 'REQUEST';
  if (
    code === 'SCHEMA_MISMATCH' ||
    code === 'CONTROLLED_STUDENT_NOT_CONFIGURED' ||
    code === 'RESOURCE_NOT_AVAILABLE'
  ) {
    return 'CONFIGURATION';
  }
  return 'SERVER';
}

function appendLearningEventOrFail_(event) {
  try {
    appendLearningEvent_(event);
    SpreadsheetApp.flush();
  } catch (error) {
    console.error('[QeK English] learning_events write failed: ' + (error && error.stack ? error.stack : error));
    throw qekError_('PERSISTENCE_FAILED');
  }
}

function apiEnglishBootstrap() {
  return englishApiResult_(function() {
    ensureSchema_();
    const student = controlledStudent_();
    const events = listLearningEventsForStudent_(student.studentId);
    const catalog = loadEnglishCatalog_();
    const config = getEnglishRewardConfig_();

    return {
      student: student,
      catalogVersion: catalog.catalogVersion,
      savingPool: calculateSavingPool_(events),
      todayEnglishEarned: calculateDailySubjectEarned_(events, 'ENGLISH', englishToday_()),
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

function answerResult_(event, events, config, replayed) {
  return {
    correct: event.correct === true,
    attemptNo: Number(event.attemptNo),
    firstAttemptCorrect: event.firstAttemptCorrect === true,
    rewardAmount: Number(event.rewardAmount) || 0,
    reviewTarget: event.correct === true ? '' : String(event.reviewTarget || ''),
    rewardConfigured: config.configured === true,
    savingPool: calculateSavingPool_(events),
    todayEnglishEarned: calculateDailySubjectEarned_(events, 'ENGLISH', englishToday_()),
    replayed: replayed,
  };
}

function apiEnglishSubmitAnswer(input) {
  return englishApiResult_(function() {
    ensureSchema_();
    const sessionId = String(input && input.sessionId || '');
    const questionId = String(input && input.questionId || '');
    const revision = Number(input && input.revision);
    if (!sessionId || !questionId || !revision) throw qekError_('ANSWER_REQUIRED');
    // Idempotency only: lets a resent attempt replay what was recorded. It can
    // never raise a reward or choose correctness.
    const clientAttemptNo = positiveInteger_(input && input.clientAttemptNo);

    const student = controlledStudent_();
    const content = loadEnglishQuestionRevision_(questionId, revision);
    const catalog = content.catalog;
    const question = content.question;
    const contentId = contentKey_(question.questionId, question.revision);
    const correct = evaluateQuestion_(question, input);
    const config = getEnglishRewardConfig_();

    // History read, attempt numbering, reward and append form one critical
    // section so overlapping requests cannot share an attempt or a reward.
    return withScriptLock_(function() {
      const events = listLearningEventsForStudent_(student.studentId);
      const attempts = currentSessionAttempts_(events, contentId, sessionId);

      const recorded = clientAttemptNo && attempts.find(function(attempt) {
        return Number(attempt.attemptNo) === clientAttemptNo;
      });
      if (recorded) return answerResult_(recorded, events, config, true);

      const attemptNo = attempts.length
        ? Number(attempts[attempts.length - 1].attemptNo) + 1
        : 1;
      const firstAttemptCorrect = attempts.length
        ? Boolean(attempts[0].firstAttemptCorrect)
        : correct;

      let rewardAmount = 0;
      if (
        correct &&
        config.configured === true &&
        !currentSessionAlreadyRewarded_(events, contentId, sessionId)
      ) {
        rewardAmount = calculateEnglishReward_({
          baseAmount: config.difficultyBase[question.difficulty] || 0,
          attemptNo: attemptNo,
          previousSuccessCount: previousSuccessfulContentCount_(events, contentId, sessionId),
          todayEarned: calculateDailySubjectEarned_(events, 'ENGLISH', englishToday_()),
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

      appendLearningEventOrFail_(event);
      return answerResult_(event, events.concat([event]), config, false);
    });
  });
}

function flashcardResult_(event, events, config, replayed) {
  return {
    complete: true,
    rewardAmount: Number(event.rewardAmount) || 0,
    rewardConfigured: config.configured === true,
    savingPool: calculateSavingPool_(events),
    todayEnglishEarned: calculateDailySubjectEarned_(events, 'ENGLISH', englishToday_()),
    replayed: replayed,
  };
}

function apiEnglishCompleteFlashcards(input) {
  return englishApiResult_(function() {
    ensureSchema_();
    const sessionId = String(input && input.sessionId || '');
    const lessonId = String(input && input.lessonId || '');
    const revision = Number(input && input.revision);
    const exposureByWordId = (input && input.exposureByWordId) || {};
    if (!sessionId || !lessonId || !revision) throw qekError_('CONTENT_INVALID');

    const student = controlledStudent_();
    const catalog = loadEnglishLessonRevision_(lessonId, revision);
    const lesson = catalog.lesson;

    const complete = lesson.words.every(function(word) {
      return Number(exposureByWordId[word.wordId] || 0) >= 1000;
    });
    if (!complete) throw qekError_('FLASHCARD_NOT_COMPLETE');

    const contentId = contentKey_(lesson.lessonId, lesson.revision);
    const config = getEnglishRewardConfig_();

    return withScriptLock_(function() {
      const events = listLearningEventsForStudent_(student.studentId);
      const existing = events.find(function(event) {
        return (
          event.eventType === 'FLASHCARD_COMPLETE' &&
          event.contentId === contentId &&
          String(event.sessionId || '') === sessionId
        );
      });
      if (existing) return flashcardResult_(existing, events, config, true);

      const todayEarned = calculateDailySubjectEarned_(events, 'ENGLISH', englishToday_());
      const rewardAmount = config.configured !== true
        ? 0
        : Math.min(
            Math.max(0, Number(config.flashcardLessonCompletion) || 0),
            Math.max(0, Number(config.dailyCap) - todayEarned)
          );

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

      appendLearningEventOrFail_(event);
      return flashcardResult_(event, events.concat([event]), config, false);
    });
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


function apiEnglishBootstrapDiagnostic() {
  const report = {
    schema: null,
    controlledStudent: null,
    learningEvents: null,
    catalog: null,
    rewardConfig: null,
  };

  try {
    ensureSchema_();
    report.schema = 'ok';

    const student = controlledStudent_();
    report.controlledStudent = {
      ok: true,
      studentId: student.studentId,
      familyId: student.familyId,
    };

    const events = listLearningEventsForStudent_(student.studentId);
    report.learningEvents = {
      ok: true,
      count: events.length,
    };

    const catalog = loadEnglishCatalog_();
    report.catalog = {
      ok: true,
      catalogVersion: catalog.catalogVersion,
      wordCount: catalog.lesson.words.length,
      activeQuestionCount: activeEnglishQuestions_(catalog).length,
    };

    const config = getEnglishRewardConfig_();
    report.rewardConfig = {
      ok: true,
      configured: config.configured === true,
    };

    report.ok = true;
    console.log(JSON.stringify(report));
    return report;
  } catch (error) {
    report.ok = false;
    report.error = {
      code: error && error.code ? error.code : 'INTERNAL_ERROR',
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? String(error.stack) : '',
    };
    console.error(JSON.stringify(report));
    return report;
  }
}

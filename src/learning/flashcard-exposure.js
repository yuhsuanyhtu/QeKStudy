export function createFlashcardExposureTracker({ wordIds, thresholdMs = 1000 }) {
  const visibleMs = new Map((wordIds || []).map((id) => [id, 0]));

  function record(wordId, milliseconds, { pageVisible = true } = {}) {
    if (!visibleMs.has(wordId) || !pageVisible) return;
    const amount = Number(milliseconds);
    if (!Number.isFinite(amount) || amount <= 0) return;
    visibleMs.set(wordId, visibleMs.get(wordId) + amount);
  }

  function getProgress() {
    const entries = [...visibleMs.entries()].map(([wordId, ms]) => ({
      wordId,
      visibleMs: ms,
      qualified: ms >= thresholdMs,
    }));
    const qualifiedCount = entries.filter((item) => item.qualified).length;
    return {
      words: entries,
      qualifiedCount,
      totalCount: entries.length,
      complete: entries.length > 0 && qualifiedCount === entries.length,
    };
  }

  return { record, getProgress };
}

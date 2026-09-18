function factorForRepeat(previousSuccessCount, repeatFactors) {
  const factors = Array.isArray(repeatFactors) && repeatFactors.length ? repeatFactors : [1];
  const index = Math.max(0, Math.min(Number(previousSuccessCount) || 0, factors.length - 1));
  return Number(factors[index]) || 0;
}

export function calculateReward({
  baseAmount,
  attemptNo,
  previousSuccessCount,
  retryFactor = 1,
  repeatFactors = [1],
  todayEarned = 0,
  dailyCap = Number.POSITIVE_INFINITY,
}) {
  const base = Math.max(0, Number(baseAmount) || 0);
  const attemptFactor = Number(attemptNo) > 1 ? Math.max(0, Number(retryFactor) || 0) : 1;
  const repeatFactor = factorForRepeat(previousSuccessCount, repeatFactors);
  const rawAmount = Math.max(0, Math.round(base * attemptFactor * repeatFactor));
  const remaining = Math.max(0, Number(dailyCap) - Number(todayEarned || 0));
  const awardedAmount = Math.min(rawAmount, remaining);

  return {
    rawAmount,
    awardedAmount,
    capReached: Number(todayEarned || 0) + awardedAmount >= Number(dailyCap),
    capLimited: awardedAmount < rawAmount,
    learningAllowed: true,
    breakdown: {
      baseAmount: base,
      attemptFactor,
      repeatFactor,
      todayEarned: Number(todayEarned || 0),
      dailyCap: Number(dailyCap),
    },
  };
}

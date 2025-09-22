// CommonJS port of analysis helpers used by the AI context route
// Derived from src/utils/analysis.js in the root project

const DECIDED_OUTCOMES = new Set(['Win', 'Loss']);
const RESOLVED_OUTCOMES = new Set(['Win', 'Loss', 'Push']);

function toNumber(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const str = String(value).trim();
  if (!str) return null;
  const normalized = str.replace(/[^0-9+\-\.]/g, '');
  if (!normalized) return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function isLikelyDecimal(raw, numeric) {
  if (raw === undefined || raw === null) return false;
  const str = String(raw).trim();
  if (!str) return false;
  if (str.includes('/')) return false; // fraction odds not supported yet
  if (str.includes('.')) return true;
  if (!str.startsWith('+') && !str.startsWith('-') && Math.abs(numeric) < 100) return true;
  return false;
}

function toDecimalOdds(raw) {
  const numeric = toNumber(raw);
  if (numeric === null) return null;
  if (isLikelyDecimal(raw, numeric)) {
    return numeric > 0 ? numeric : null;
  }
  if (numeric > 0) {
    return 1 + numeric / 100;
  }
  if (numeric < 0) {
    return 1 + 100 / Math.abs(numeric);
  }
  return null;
}

function toImpliedProbability(raw) {
  const numeric = toNumber(raw);
  if (numeric === null) return null;
  if (isLikelyDecimal(raw, numeric)) {
    return numeric > 0 ? 1 / numeric : null;
  }
  if (numeric > 0) {
    return 100 / (numeric + 100);
  }
  if (numeric < 0) {
    return Math.abs(numeric) / (Math.abs(numeric) + 100);
  }
  return null;
}

function asDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toPlainBet(doc) {
  const raw = typeof doc?.toObject === 'function' ? doc.toObject() : { ...doc };
  const date = asDate(raw.date);
  const stake = Number(raw.stake) || 0;
  const payout = Number(raw.payout) || 0;
  let profitLoss = Number(raw.profitLoss);
  if (!Number.isFinite(profitLoss)) {
    if (raw.outcome === 'Pending') {
      profitLoss = 0;
    } else if (raw.outcome && RESOLVED_OUTCOMES.has(raw.outcome)) {
      profitLoss = payout - stake;
    } else {
      profitLoss = 0;
    }
  }
  return {
    ...raw,
    date,
    stake,
    payout,
    profitLoss,
    oddsValue: toNumber(raw.odds),
    closingOddsValue: toNumber(raw.closingOdds),
    impliedProb: toImpliedProbability(raw.odds),
    closingImpliedProb: toImpliedProbability(raw.closingOdds),
  };
}

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sortChronologically(bets) {
  return [...bets].sort((a, b) => {
    const aTime = a.date ? a.date.getTime() : 0;
    const bTime = b.date ? b.date.getTime() : 0;
    if (aTime === bTime) {
      return (a._id || '').toString().localeCompare((b._id || '').toString());
    }
    return aTime - bTime;
  });
}

function computeStreaks(bets) {
  const chronological = sortChronologically(bets);
  let currentWin = 0;
  let currentLoss = 0;
  let maxWin = 0;
  let maxLoss = 0;
  for (const bet of chronological) {
    if (bet.outcome === 'Win') {
      currentWin += 1;
      maxWin = Math.max(maxWin, currentWin);
      currentLoss = 0;
    } else if (bet.outcome === 'Loss') {
      currentLoss += 1;
      maxLoss = Math.max(maxLoss, currentLoss);
      currentWin = 0;
    }
  }
  return { longestWinStreak: maxWin, longestLossStreak: maxLoss };
}

function computeDrawdown(bets) {
  const chronological = sortChronologically(bets).filter(b => DECIDED_OUTCOMES.has(b.outcome));
  let peak = 0;
  let peakDate = null;
  let equity = 0;
  let worst = { amount: 0, start: null, end: null };

  for (const bet of chronological) {
    equity += Number(bet.profitLoss) || 0;
    if (equity > peak) {
      peak = equity;
      peakDate = bet.date || peakDate;
    }
    const drawdown = peak - equity;
    if (drawdown > worst.amount) {
      worst = {
        amount: drawdown,
        start: peakDate,
        end: bet.date || peakDate,
      };
    }
  }
  const durationMs = worst.start && worst.end ? Math.max(0, worst.end - worst.start) : 0;
  const durationDays = durationMs ? Math.round(durationMs / (1000 * 60 * 60 * 24)) : 0;
  return {
    amount: round(worst.amount, 2) || 0,
    start: worst.start || null,
    end: worst.end || null,
    durationDays,
  };
}

function computeBreakdowns(bets) {
  const resolved = bets.filter(b => RESOLVED_OUTCOMES.has(b.outcome));
  const bySport = {};
  const byMarket = {};
  const byMonthMap = new Map();

  for (const bet of resolved) {
    const sportKey = bet.sport || 'Unspecified';
    const sportEntry = bySport[sportKey] || { bets: 0, wins: 0, stake: 0, payout: 0, profit: 0 };
    sportEntry.bets += 1;
    sportEntry.stake += bet.stake || 0;
    sportEntry.payout += bet.payout || 0;
    sportEntry.profit += bet.profitLoss || 0;
    if (bet.outcome === 'Win') sportEntry.wins += 1;
    bySport[sportKey] = sportEntry;

    const marketKey = bet.betType || 'Other';
    const marketEntry = byMarket[marketKey] || { bets: 0, stake: 0, profit: 0 };
    marketEntry.bets += 1;
    marketEntry.stake += bet.stake || 0;
    marketEntry.profit += bet.profitLoss || 0;
    byMarket[marketKey] = marketEntry;

    if (bet.date) {
      const monthKey = `${bet.date.getUTCFullYear()}-${String(bet.date.getUTCMonth() + 1).padStart(2, '0')}`;
      const monthEntry = byMonthMap.get(monthKey) || 0;
      byMonthMap.set(monthKey, monthEntry + (bet.profitLoss || 0));
    }
  }

  const bySportFormatted = Object.fromEntries(
    Object.entries(bySport).map(([sport, entry]) => {
      const winRate = entry.bets ? (entry.wins / entry.bets) * 100 : null;
      const roi = entry.stake > 0 ? (entry.profit / entry.stake) * 100 : null;
      return [sport, {
        bets: entry.bets,
        winRatePct: winRate !== null ? round(winRate, 2) : null,
        roiPct: roi !== null ? round(roi, 2) : null,
        netProfit: round(entry.profit, 2) || 0,
      }];
    })
  );

  const byMarketFormatted = Object.fromEntries(
    Object.entries(byMarket).map(([market, entry]) => {
      const roi = entry.stake > 0 ? (entry.profit / entry.stake) * 100 : null;
      return [market, {
        bets: entry.bets,
        roiPct: roi !== null ? round(roi, 2) : null,
        netProfit: round(entry.profit, 2) || 0,
      }];
    })
  );

  const byMonth = Array.from(byMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, profit]) => ({ x: month, y: round(profit, 2) || 0 }));

  return { bySport: bySportFormatted, byMarket: byMarketFormatted, byMonth };
}

function detectIssues(bets) {
  const issues = new Set();
  for (const bet of bets) {
    if ((bet.stake || 0) < 0) {
      issues.add('Negative stake values detected.');
    }
    if (RESOLVED_OUTCOMES.has(bet.outcome)) {
      if (bet.payout === undefined || bet.payout === null) {
        issues.add('Some settled bets are missing payout values.');
      }
      if (bet.profitLoss === undefined || bet.profitLoss === null) {
        issues.add('Some settled bets are missing profit/loss values.');
      }
    }
    if (bet.outcome === 'Pending' && (bet.payout || 0) !== 0) {
      issues.add('Pending bets should not have payouts recorded yet.');
    }
  }
  return Array.from(issues);
}

function computeMetrics(bets) {
  const totalBets = bets.length;
  const resolved = bets.filter(b => RESOLVED_OUTCOMES.has(b.outcome));
  const decided = resolved.filter(b => DECIDED_OUTCOMES.has(b.outcome));
  const wins = decided.filter(b => b.outcome === 'Win');
  const losses = decided.filter(b => b.outcome === 'Loss');

  const totalStake = resolved.reduce((sum, bet) => sum + (bet.stake || 0), 0);
  const totalPayout = resolved.reduce((sum, bet) => sum + (bet.payout || 0), 0);
  const netProfit = totalPayout - totalStake;
  const winRate = decided.length ? (wins.length / decided.length) * 100 : null;
  const roi = totalStake > 0 ? (netProfit / totalStake) * 100 : null;

  const decimalOdds = decided
    .map(bet => toDecimalOdds(bet.odds))
    .filter(value => Number.isFinite(value) && value > 0);
  const avgDecimalOdds = decimalOdds.length
    ? decimalOdds.reduce((sum, value) => sum + value, 0) / decimalOdds.length
    : null;

  const clvEntries = bets
    .map(bet => {
      if (!Number.isFinite(bet.impliedProb) || !Number.isFinite(bet.closingImpliedProb)) {
        return null;
      }
      return (bet.closingImpliedProb - bet.impliedProb) * 100;
    })
    .filter(value => value !== null);
  const clvPct = clvEntries.length
    ? clvEntries.reduce((sum, value) => sum + value, 0) / clvEntries.length
    : null;

  const pendingExposure = bets
    .filter(bet => bet.outcome === 'Pending')
    .reduce((sum, bet) => sum + (bet.stake || 0), 0);

  const { longestWinStreak, longestLossStreak } = computeStreaks(bets);
  const drawdown = computeDrawdown(bets);

  const closingTracked = bets.filter(bet => Number.isFinite(bet.closingImpliedProb) && Number.isFinite(bet.impliedProb));
  const closingCoveragePct = totalBets ? (closingTracked.length / totalBets) * 100 : 0;

  return {
    totalBets,
    winRatePct: winRate !== null ? round(winRate, 2) : null,
    roiPct: roi !== null ? round(roi, 2) : null,
    netProfit: round(netProfit, 2) || 0,
    avgOdds: avgDecimalOdds !== null ? round(avgDecimalOdds, 2) : null,
    clvPct: clvPct !== null ? round(clvPct, 2) : null,
    longestWinStreak,
    longestLossStreak,
    pendingExposure: round(pendingExposure, 2) || 0,
    decidedBets: decided.length,
    resolvedBets: resolved.length,
    wins: wins.length,
    losses: losses.length,
    totalStake: round(totalStake, 2) || 0,
    totalPayout: round(totalPayout, 2) || 0,
    closingTracked: closingTracked.length,
    closingCoveragePct: round(closingCoveragePct, 2) || 0,
    drawdown,
  };
}

function buildFilterFacets(bets) {
  const sports = new Set();
  const betTypes = new Set();
  const outcomes = new Set();
  for (const bet of bets) {
    if (bet.sport) sports.add(bet.sport);
    if (bet.betType) betTypes.add(bet.betType);
    if (bet.outcome) outcomes.add(bet.outcome);
  }
  return {
    sports: Array.from(sports).sort((a, b) => a.localeCompare(b)),
    betTypes: Array.from(betTypes).sort((a, b) => a.localeCompare(b)),
    outcomes: Array.from(outcomes).sort((a, b) => a.localeCompare(b)),
  };
}

function sanitizeFilters(filters = {}) {
  const clean = {};
  if (filters.startDate) clean.startDate = filters.startDate;
  if (filters.endDate) clean.endDate = filters.endDate;
  if (filters.sports?.length) clean.sports = [...filters.sports];
  if (filters.betTypes?.length) clean.betTypes = [...filters.betTypes];
  if (filters.outcomes?.length) clean.outcomes = [...filters.outcomes];
  return clean;
}

function formatSampleBet(bet) {
  return {
    date: bet.date ? bet.date.toISOString().split('T')[0] : null,
    sport: bet.sport || null,
    market: bet.betType || null,
    selection: bet.description || null,
    outcome: bet.outcome || null,
    odds: bet.odds || null,
    closingOdds: bet.closingOdds || null,
    stake: bet.stake,
    payout: bet.payout,
    profitLoss: bet.profitLoss,
    note: bet.note || null,
    sportsbook: bet.sportsbook || null,
  };
}

function summarizeForModel(rawBets, { scope = 'all', filters = {} } = {}) {
  const bets = rawBets.map(toPlainBet);
  const chronological = sortChronologically(bets);
  const metrics = computeMetrics(chronological);
  const breakdowns = computeBreakdowns(chronological);
  const issues = detectIssues(chronological);
  const facets = buildFilterFacets(chronological);

  const sampleLimit = chronological.length > 200 ? 80 : 150;
  const condensedSample = chronological.length > sampleLimit
    ? chronological.slice(-sampleLimit)
    : chronological;

  const firstBet = chronological[0];
  const lastBet = chronological[chronological.length - 1];

  const summary = {
    scope,
    filtersApplied: sanitizeFilters(filters),
    metrics,
    breakdowns,
    issues,
    dataset: {
      totalBets: metrics.totalBets,
      resolvedBets: metrics.resolvedBets,
      decidedBets: metrics.decidedBets,
      wins: metrics.wins,
      losses: metrics.losses,
      pendingBets: metrics.totalBets - metrics.resolvedBets,
      totalStake: metrics.totalStake,
      totalPayout: metrics.totalPayout,
      pendingExposure: metrics.pendingExposure,
      closingTracked: metrics.closingTracked,
      closingCoveragePct: metrics.closingCoveragePct,
      firstBetDate: firstBet?.date ? firstBet.date.toISOString() : null,
      lastBetDate: lastBet?.date ? lastBet.date.toISOString() : null,
    },
    drawdown: metrics.drawdown,
    sampleSize: condensedSample.length,
    sampleBets: condensedSample.map(formatSampleBet),
    availableFilters: facets,
  };

  return summary;
}

function computeUserStatsForClient(rawBets) {
  const bets = rawBets.map(toPlainBet);
  const chronological = sortChronologically(bets);
  const metrics = computeMetrics(chronological);
  const bestSport = (() => {
    const { bySport } = computeBreakdowns(chronological);
    let top = null;
    for (const [sport, entry] of Object.entries(bySport)) {
      if (top === null || (entry.netProfit || 0) > (top.netProfit || 0)) {
        top = { sport, ...entry };
      }
    }
    return top;
  })();

  return {
    totalBets: metrics.totalBets,
    winRate: metrics.winRatePct || 0,
    roi: metrics.roiPct || 0,
    totalStaked: metrics.totalStake,
    totalReturn: metrics.totalPayout,
    netProfit: metrics.netProfit,
    mostProfitable: bestSport?.sport || '-',
    avgStake: metrics.resolvedBets ? round(metrics.totalStake / metrics.resolvedBets, 2) || 0 : 0,
    winStreak: metrics.longestWinStreak || 0,
    clv: metrics.clvPct,
    pendingExposure: metrics.pendingExposure,
  };
}

function selectBetsWithFilters(rawBets, filters = {}) {
  const bets = rawBets.map(toPlainBet);
  const { startDate, endDate, sports, betTypes, outcomes } = filters;
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const sportSet = sports?.length ? new Set(sports) : null;
  const betTypeSet = betTypes?.length ? new Set(betTypes) : null;
  const outcomeSet = outcomes?.length ? new Set(outcomes) : null;

  return bets.filter(bet => {
    if (start && bet.date && bet.date < start) return false;
    if (end && bet.date && bet.date > end) return false;
    if (sportSet && bet.sport && !sportSet.has(bet.sport)) return false;
    if (betTypeSet && bet.betType && !betTypeSet.has(bet.betType)) return false;
    if (outcomeSet && bet.outcome && !outcomeSet.has(bet.outcome)) return false;
    return true;
  });
}

function formatDrawdown(drawdown) {
  if (!drawdown?.amount) return null;
  return {
    amount: drawdown.amount,
    start: drawdown.start ? drawdown.start.toISOString() : null,
    end: drawdown.end ? drawdown.end.toISOString() : null,
    durationDays: drawdown.durationDays,
  };
}

module.exports = {
  summarizeForModel,
  computeUserStatsForClient,
  selectBetsWithFilters,
  buildFilterFacets,
  formatDrawdown,
};


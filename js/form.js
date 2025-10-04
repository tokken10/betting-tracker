import { addBet as addBetData, calculatePayout, updateBet as updateBetData, bets } from './bets.js';
import { renderBets, resetPagination } from './render.js';
import { updateStats } from './stats.js';

const FORM_FIELDS = ['date', 'sport', 'event', 'betType', 'odds', 'stake', 'outcome', 'description', 'note', 'closingOdds', 'sportsbook'];

let editingBetId = null;

export function initForm() {
  const outcomeEl = document.getElementById('outcome');
  const oddsEl = document.getElementById('odds');
  const stakeEl = document.getElementById('stake');
  if (outcomeEl && oddsEl && stakeEl) {
    outcomeEl.addEventListener('change', updatePayoutPreview);
    oddsEl.addEventListener('input', updatePayoutPreview);
    stakeEl.addEventListener('input', updatePayoutPreview);
  }

  restoreFormData();
}

export function saveFormData() {
  const data = {};
  FORM_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value) data[id] = el.value;
  });
  try {
    localStorage.setItem('pendingBet', JSON.stringify(data));
  } catch (err) {
    console.error('❌ Error saving form data:', err.message);
  }
}

function restoreFormData() {
  try {
    const raw = localStorage.getItem('pendingBet');
    if (!raw) return;
    const data = JSON.parse(raw);
    FORM_FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && data[id] !== undefined) {
        el.value = data[id];
      }
    });
    updatePayoutPreview();
  } catch (err) {
    console.error('❌ Error restoring form data:', err.message);
  } finally {
    localStorage.removeItem('pendingBet');
  }
}

export function updatePayoutPreview() {
  const oddsEl = document.getElementById('odds');
  const stakeEl = document.getElementById('stake');
  const outcomeEl = document.getElementById('outcome');
  const oddsValue = oddsEl?.value;
  const stake = parseFloat(stakeEl?.value);
  const outcome = outcomeEl?.value;
  const payoutInput = document.getElementById('payout');
  if (!payoutInput) return;
  if (outcome === 'Win' && oddsValue && !isNaN(stake)) {
    payoutInput.value = calculatePayout(oddsValue, stake).toFixed(2);
  } else if (outcome === 'Loss') {
    payoutInput.value = '0.00';
  } else if (outcome === 'Push' && !isNaN(stake)) {
    payoutInput.value = stake.toFixed(2);
  } else {
    payoutInput.value = '';
  }
}

export async function handleAddBet() {
  const date = document.getElementById('date').value;
  const sport = document.getElementById('sport').value;
  const event = document.getElementById('event').value;
  const betType = document.getElementById('betType').value;
  const oddsInput = document.getElementById('odds').value.trim();
  const numOdds = parseFloat(oddsInput);
  const odds = (!oddsInput.startsWith('+') && !oddsInput.startsWith('-') && !isNaN(numOdds) && Math.abs(numOdds) >= 100)
    ? `+${oddsInput}`
    : oddsInput;
  const stake = parseFloat(document.getElementById('stake').value) || 0;
  const outcome = document.getElementById('outcome').value;
  const description = document.getElementById('description').value.trim();
  const note = document.getElementById('note').value.trim();
  const closingOddsInput = document.getElementById('closingOdds').value.trim();
  let closingOdds = closingOddsInput;
  const closingNum = parseFloat(closingOddsInput);
  if (
    closingOddsInput &&
    !closingOddsInput.startsWith('+') &&
    !closingOddsInput.startsWith('-') &&
    !isNaN(closingNum) &&
    Math.abs(closingNum) >= 100
  ) {
    closingOdds = `${closingNum > 0 ? '+' : ''}${closingOddsInput}`;
  }
  const sportsbook = document.getElementById('sportsbook').value.trim();

  if (!date || !sport || !event || !betType || !odds || !stake || !outcome) {
    alert('Please fill in all required fields');
    return;
  }

  let payout = 0;
  let profitLoss = 0;

  if (outcome === 'Win') {
    payout = calculatePayout(odds, stake);
    profitLoss = payout - stake;
  } else if (outcome === 'Loss') {
    payout = 0;
    profitLoss = -stake;
  } else if (outcome === 'Push') {
    payout = stake;
    profitLoss = 0;
  }

  const bet = {
    date,
    sport,
    event,
    betType,
    odds,
    stake,
    outcome,
    payout,
    profitLoss,
    description,
    note,
    closingOdds,
    sportsbook,
  };

  try {
    if (editingBetId) {
      await updateBetData(editingBetId, bet);
    } else {
      bet.id = Date.now();
      await addBetData(bet);
      resetPagination();
    }
    renderBets();
    await updateStats();
    clearForm();
  } catch (err) {
    console.error('❌ Error adding bet:', err.message);
  }
}

export function clearForm() {
  const fields = ['event', 'odds', 'stake', 'payout', 'outcome', 'description', 'note', 'closingOdds', 'sportsbook'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  editingBetId = null;
  const addBtn = document.getElementById('add-bet-btn');
  if (addBtn) addBtn.textContent = 'Add Bet';
}

export function startEditBet(betId) {
  const bet = bets.find(b => b._id === betId);
  if (!bet) return;
  editingBetId = betId;
  const dateEl = document.getElementById('date');
  if (dateEl) {
    const d = new Date(bet.date);
    dateEl.value = d.toISOString().split('T')[0];
  }
  const fields = ['sport', 'event', 'betType', 'odds', 'stake', 'outcome', 'description', 'note', 'closingOdds', 'sportsbook'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = bet[id] ?? '';
  });
  const payoutEl = document.getElementById('payout');
  if (payoutEl) {
    payoutEl.value = bet.payout?.toFixed(2) ?? '';
  }
  const addBtn = document.getElementById('add-bet-btn');
  if (addBtn) addBtn.textContent = 'Update Bet';
}

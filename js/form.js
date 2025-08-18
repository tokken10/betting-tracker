import { addBet as addBetData, calculatePayout } from './bets.js';
import { renderBets } from './render.js';
import { updateStats } from './stats.js';

const FORM_FIELDS = ['date', 'sport', 'event', 'betType', 'odds', 'stake', 'outcome', 'description', 'note'];

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
    id: Date.now(),
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
    note
  };

  try {
    await addBetData(bet);
    renderBets();
    await updateStats();
    clearForm();
  } catch (err) {
    console.error('❌ Error adding bet:', err.message);
  }
}

export function clearForm() {
  const fields = ['event', 'odds', 'stake', 'payout', 'outcome', 'description', 'note'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

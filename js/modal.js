import { formatDate } from './utils.js';

let activeModal = null;

function handleKeyDown(e) {
  if (!activeModal) return;
  const focusable = activeModal.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  } else if (e.key === 'Escape') {
    closeModal();
  }
}

function openModal(modal) {
  activeModal = modal;
  modal.classList.add('active');
  modal.addEventListener('keydown', handleKeyDown);
  const focusable = modal.querySelectorAll(
    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable[0]) focusable[0].focus();
}

export function closeModal() {
  if (!activeModal) return;
  activeModal.classList.remove('active');
  activeModal.removeEventListener('keydown', handleKeyDown);
  activeModal = null;
}

export function showFullText(text) {
  const modal = document.getElementById('textModal');
  const modalText = document.getElementById('modalText');
  if (modal && modalText) {
    modalText.textContent = text || '';
    openModal(modal);
  }
}

export function showBetDetails(bet) {
  const modal = document.getElementById('betDetailsModal');
  const body = document.getElementById('betDetailsBody');
  if (modal && body) {
    body.innerHTML = `
      <div><strong>Outcome:</strong> ${bet.outcome}</div>
      <div><strong>Description:</strong> ${bet.description || ''}</div>
      <div><strong>Bet Type:</strong> ${bet.betType}</div>
      <div><strong>Odds:</strong> ${bet.odds}</div>
      <div><strong>Stake:</strong> $${parseFloat(bet.stake).toFixed(2)}</div>
      <div><strong>Payout:</strong> $${parseFloat(bet.payout).toFixed(2)}</div>
      <div><strong>Profit/Loss:</strong> ${bet.outcome === 'Pending' ? '—' : (bet.profitLoss > 0 ? '+' : '') + '$' + parseFloat(bet.profitLoss).toFixed(2)}</div>
      <div><strong>Date:</strong> ${formatDate(bet.date)}</div>
      <div><strong>Event:</strong> ${bet.event}</div>
      <div><strong>Sport:</strong> ${bet.sport}</div>
      <div><strong>Note:</strong> ${bet.note || ''}</div>
    `;
    openModal(modal);
  }
}


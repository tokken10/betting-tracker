import { formatDate } from './utils.js';

let activeModal = null;
let previousFocus = null;

function handleKeyDown(e) {
  if (!activeModal) return;
  const focusable = activeModal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
  previousFocus = document.activeElement;
  activeModal = modal;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  modal.addEventListener('keydown', handleKeyDown);
  const content = modal.querySelector('.modal-content');
  if (content) content.focus();
  document.body.style.overflow = 'hidden';
}

export function closeModal(event) {
  if (event) {
    if (event.target.classList.contains('modal')) {
      // backdrop click
    } else if (!event.target.closest('.modal-close') && !event.target.classList.contains('modal')) {
      return;
    }
  }

  if (!activeModal) return;
  activeModal.classList.remove('active');
  activeModal.setAttribute('aria-hidden', 'true');
  activeModal.removeEventListener('keydown', handleKeyDown);
  document.body.style.overflow = '';

  if (previousFocus) {
    previousFocus.focus();
    previousFocus = null;
  }

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
    const details = [
      { label: 'Outcome', value: bet.outcome, class: `status ${bet.outcome.toLowerCase()}` },
      { label: 'Description', value: bet.description || '', class: '' },
      { label: 'Bet Type', value: bet.betType, class: '' },
      { label: 'Odds', value: bet.odds, class: parseFloat(bet.odds) > 0 ? 'positive' : parseFloat(bet.odds) < 0 ? 'negative' : '' },
      { label: 'Stake', value: `$${parseFloat(bet.stake).toFixed(2)}`, class: '' },
      { label: 'Payout', value: `$${parseFloat(bet.payout).toFixed(2)}`, class: bet.payout > 0 ? 'positive' : '' },
      {
        label: 'Profit/Loss',
        value: bet.outcome === 'Pending' ? '—' : (bet.profitLoss > 0 ? '+' : '') + '$' + parseFloat(bet.profitLoss).toFixed(2),
        class: bet.outcome === 'Pending' ? '' : bet.profitLoss > 0 ? 'positive' : bet.profitLoss < 0 ? 'negative' : ''
      },
      { label: 'Date', value: formatDate(bet.date), class: '' },
      { label: 'Event', value: bet.event, class: '' },
      { label: 'Sport', value: bet.sport, class: '' },
      { label: 'Note', value: bet.note || '', class: '', fullWidth: true }
    ];

    body.innerHTML = '';
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.innerHTML =
      bet.outcome === 'Pending'
        ? `
          <select onchange="settleBet(this, '${bet._id}'); closeModal();">
            <option value="">Settle</option>
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
            <option value="Push">Push</option>
          </select>
          <button class="btn btn-danger" onclick="removeBet('${bet._id}'); closeModal();">Remove</button>
        `
        : `<button class="btn btn-danger" onclick="removeBet('${bet._id}'); closeModal();">Remove</button>`;
    body.appendChild(actions);

    details.forEach(detail => {
      const card = document.createElement('div');
      card.className = 'detail-card';
      if (detail.fullWidth) card.classList.add('full-width');
      card.innerHTML = `
        <div class="detail-label">${detail.label}</div>
        <div class="detail-value ${detail.class}">${detail.value}</div>
      `;
      body.appendChild(card);
    });

    openModal(modal);
  }
}

export function showLearnMore() {
  const modal = document.getElementById('learnMoreModal');
  if (modal) {
    openModal(modal);
  }
}


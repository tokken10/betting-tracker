import { formatDate, escapeHtml } from './utils.js';
import { updateBet as updateBetData, calculatePayout, bets } from './bets.js';
import { renderBets } from './render.js';
import { updateStats } from './stats.js';


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
  if (!modal || !body) return;

  const user = window.CURRENT_USER || null;
  let currentBet = bet;


  function renderView() {
    body.innerHTML = '';

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    let actionsHTML =
      currentBet.outcome === 'Pending'

        ? `
          <select onchange="settleBet(this, '${currentBet._id}'); closeModal();">
            <option value="">Settle</option>
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
            <option value="Push">Push</option>
          </select>
          <button class="btn btn-danger" onclick="removeBet('${currentBet._id}'); closeModal();">Remove</button>
        `

        : `<button class="btn btn-danger" onclick="removeBet('${currentBet._id}'); closeModal();">Remove</button>`;
    if (user?.role === 'admin') {
      actionsHTML += `<button class="btn" id="editBetBtn">Edit</button>`;
    }
    actions.innerHTML = actionsHTML;
    body.appendChild(actions);

    const details = [
      { label: 'Outcome', value: escapeHtml(currentBet.outcome), class: `status ${currentBet.outcome.toLowerCase()}` },
      { label: 'Description', value: escapeHtml(currentBet.description || ''), class: '' },
      { label: 'Bet Type', value: escapeHtml(currentBet.betType), class: '' },
      {
        label: 'Odds',
        value: escapeHtml(currentBet.odds),
        class:
          parseFloat(currentBet.odds) > 0
            ? 'positive'
            : parseFloat(currentBet.odds) < 0
            ? 'negative'
            : ''
      },
      { label: 'Stake', value: `$${parseFloat(currentBet.stake).toFixed(2)}`, class: '' },
      {
        label: 'Closing Odds',
        value: escapeHtml(currentBet.closingOdds || '—'),
        class: '',
      },
      { label: 'Payout', value: `$${parseFloat(currentBet.payout).toFixed(2)}`, class: currentBet.payout > 0 ? 'positive' : '' },
      {
        label: 'Profit/Loss',
        value:
          currentBet.outcome === 'Pending'
            ? '—'
            : (currentBet.profitLoss > 0 ? '+' : '') + '$' + parseFloat(currentBet.profitLoss).toFixed(2),
        class:
          currentBet.outcome === 'Pending'
            ? ''
            : currentBet.profitLoss > 0
            ? 'positive'
            : currentBet.profitLoss < 0
            ? 'negative'
            : ''
      },
      { label: 'Date', value: formatDate(currentBet.date), class: '' },
      { label: 'Event', value: escapeHtml(currentBet.event), class: '' },
      { label: 'Sport', value: escapeHtml(currentBet.sport), class: '' },
      { label: 'Sportsbook', value: escapeHtml(currentBet.sportsbook || '—'), class: '' },
      { label: 'Note', value: escapeHtml(currentBet.note || ''), class: '', fullWidth: true }
    ];

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

    if (user?.role === 'admin') {
      const editBtn = document.getElementById('editBetBtn');
      editBtn?.addEventListener('click', renderEdit);
    }
  }

  function renderEdit() {
    body.innerHTML = '';

    const form = document.createElement('div');
    form.innerHTML = `
      <label>Date<input type="date" id="edit-date" value="${new Date(currentBet.date).toISOString().split('T')[0]}"></label>
      <label>Sport<input type="text" id="edit-sport" value="${escapeHtml(currentBet.sport)}"></label>
      <label>Event<input type="text" id="edit-event" value="${escapeHtml(currentBet.event)}"></label>
      <label>Bet Type<input type="text" id="edit-betType" value="${escapeHtml(currentBet.betType)}"></label>
      <label>Odds<input type="text" id="edit-odds" value="${escapeHtml(currentBet.odds)}"></label>
      <label>Stake<input type="number" step="0.01" id="edit-stake" value="${currentBet.stake}"></label>
      <label>Outcome
        <select id="edit-outcome">
          <option value="Pending" ${currentBet.outcome === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Win" ${currentBet.outcome === 'Win' ? 'selected' : ''}>Win</option>
          <option value="Loss" ${currentBet.outcome === 'Loss' ? 'selected' : ''}>Loss</option>
          <option value="Push" ${currentBet.outcome === 'Push' ? 'selected' : ''}>Push</option>
        </select>
      </label>
      <label>Closing Odds<input type="text" id="edit-closingOdds" value="${escapeHtml(currentBet.closingOdds || '')}"></label>
      <label>Sportsbook<input type="text" id="edit-sportsbook" value="${escapeHtml(currentBet.sportsbook || '')}"></label>
      <label>Description<input type="text" id="edit-description" value="${escapeHtml(currentBet.description || '')}"></label>
      <label>Note<textarea id="edit-note">${escapeHtml(currentBet.note || '')}</textarea></label>
    `;
    body.appendChild(form);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.innerHTML = `<button class="btn" id="saveEditBtn">Save</button><button class="btn btn-secondary" id="cancelEditBtn">Cancel</button>`;
    body.appendChild(actions);

    document.getElementById('cancelEditBtn').addEventListener('click', renderView);
    document.getElementById('saveEditBtn').addEventListener('click', async () => {
      const updates = {
        date: document.getElementById('edit-date').value,
        sport: document.getElementById('edit-sport').value.trim(),
        event: document.getElementById('edit-event').value.trim(),
        betType: document.getElementById('edit-betType').value.trim(),
        odds: document.getElementById('edit-odds').value.trim(),
        stake: parseFloat(document.getElementById('edit-stake').value) || 0,
        outcome: document.getElementById('edit-outcome').value,
        description: document.getElementById('edit-description').value.trim(),
        note: document.getElementById('edit-note').value.trim(),
        closingOdds: document.getElementById('edit-closingOdds').value.trim(),
        sportsbook: document.getElementById('edit-sportsbook').value.trim(),
      };

      let payout = 0;
      let profitLoss = 0;
      if (updates.outcome === 'Win') {
        payout = calculatePayout(updates.odds, updates.stake);
        profitLoss = payout - updates.stake;
      } else if (updates.outcome === 'Loss') {
        payout = 0;
        profitLoss = -updates.stake;
      } else if (updates.outcome === 'Push') {
        payout = updates.stake;
        profitLoss = 0;
      }
      updates.payout = payout;
      updates.profitLoss = profitLoss;

      await updateBetData(currentBet._id, updates);
      renderBets();
      await updateStats();
      const updated = bets.find(b => b._id === currentBet._id);
      if (updated) currentBet = updated;
      renderView();
    });
  }

  renderView();
  openModal(modal);
}

export function showLearnMore() {
  const modal = document.getElementById('learnMoreModal');
  if (modal) {
    openModal(modal);
  }
}

import { bets, fetchBets, loadDemoData as loadDemoBets, exportToCSV } from './bets.js';
import { initForm, handleAddBet, saveFormData, startEditBet } from './form.js';
import { renderBets, handleRemoveBet, handleSettleBet, showTableLoading } from './render.js';
import { updateStats } from './stats.js';
import { showFullText, closeModal, showLearnMore } from './modal.js';

// Always make core functions globally available for buttons
window.addBet = handleAddBet;
window.startEditBet = startEditBet;
window.removeBet = handleRemoveBet;
window.loadDemoData = async () => {
  loadDemoBets();
  renderBets();
  await updateStats();
};
window.settleBet = handleSettleBet;
window.showFullText = showFullText;
window.closeModal = closeModal;
window.showLearnMore = showLearnMore;
window.exportToCSV = exportToCSV;
window.renderBets = renderBets;
window.saveFormData = saveFormData;

// Initialize form handlers
initForm();

// Wait for shared HTML components before loading bets
  window.addEventListener('shared:loaded', async () => {
    const isDemoMode = new URLSearchParams(window.location.search).get('demo');

    showTableLoading();

    const me = window.CURRENT_USER || null;
    if (isDemoMode || !me) {
      loadDemoBets();
    } else {
      await fetchBets();
    }

    renderBets();
    await updateStats();
  });

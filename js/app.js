import { bets, fetchBets, loadDemoData as loadDemoBets, exportToCSV } from './bets.js';
import { initForm, handleAddBet, handleClearAll } from './form.js';
import { renderBets, handleRemoveBet, handleSettleBet } from './render.js';
import { updateStats } from './stats.js';
import { showFullText, closeModal } from './modal.js';

// Always make core functions globally available for buttons
window.addBet = handleAddBet;
window.clearAllBets = handleClearAll;
window.loadDemoData = async () => {
  loadDemoBets();
  renderBets();
  updateStats();
};
window.settleBet = handleSettleBet;
window.showFullText = showFullText;
window.closeModal = closeModal;
window.exportToCSV = exportToCSV;

// Initialize form handlers
initForm();

// Wait for shared HTML components before loading bets
window.addEventListener('shared:loaded', async () => {
  const isDemoMode = new URLSearchParams(window.location.search).get('demo');

  if (isDemoMode) {
    loadDemoBets();
  } else {
    await fetchBets();
  }

  renderBets();
  updateStats();
});
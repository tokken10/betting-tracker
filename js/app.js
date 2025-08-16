import { bets, fetchBets, loadDemoData as loadDemoBets, exportToCSV } from './bets.js';
import { initForm, handleAddBet } from './form.js';
import { renderBets, handleRemoveBet, handleSettleBet } from './render.js';
import { updateStats } from './stats.js';
import { showFullText, closeModal } from './modal.js';

// Always make core functions globally available for buttons
window.addBet = handleAddBet;
window.removeBet = handleRemoveBet;
window.loadDemoData = async () => {
  loadDemoBets();
  renderBets();
  await updateStats();
};
window.settleBet = handleSettleBet;
window.showFullText = showFullText;
window.closeModal = closeModal;
window.exportToCSV = exportToCSV;
window.renderBets = renderBets;

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
  await updateStats();
});
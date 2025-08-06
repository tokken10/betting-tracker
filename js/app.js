import { bets, loadDemoData as loadDemoBets, exportToCSV } from './bets.js';
import { initForm, handleAddBet, handleClearAll } from './form.js';
import { renderBets, handleRemoveBet, handleSettleBet } from './render.js';
import { updateStats } from './stats.js';
import { showFullText, closeModal } from './modal.js';

initForm();

// Wait for shared HTML components to load before rendering
window.addEventListener('shared:loaded', () => {
  if (bets.length === 0 && new URLSearchParams(window.location.search).get('demo')) {
    loadDemoBets();
  }
  renderBets();
  updateStats();
});

// Expose functions globally for HTML event handlers
window.addBet = handleAddBet;
window.removeBet = handleRemoveBet;
window.clearAllBets = handleClearAll;
window.loadDemoData = () => { loadDemoBets(); renderBets(); updateStats(); };
window.settleBet = handleSettleBet;
window.showFullText = showFullText;
window.closeModal = closeModal;
window.exportToCSV = exportToCSV;

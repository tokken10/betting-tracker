export function showFullText(text) {
  const modal = document.getElementById('textModal');
  const modalText = document.getElementById('modalText');
  if (modal && modalText) {
    modalText.textContent = text || '';
    modal.classList.add('active');
  }
}

export function closeModal() {
  const modal = document.getElementById('textModal');
  if (modal) modal.classList.remove('active');
}

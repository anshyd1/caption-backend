// ===== PANEL TOGGLE =====
let panelOpen = false;
let clipHistory = [];
let activeElement = null;

function togglePanel() {
  panelOpen = !panelOpen;
  document.getElementById('sidePanel').classList.toggle('open', panelOpen);
  document.getElementById('overlay').classList.toggle('show', panelOpen);

  if (panelOpen) {
    activeElement = document.activeElement;
    updatePreview();
  }
}

// ===== TRACK ACTIVE INPUT =====
document.addEventListener('focusin', (e) => {
  if (
    (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') &&
    !e.target.closest('.side-panel')
  ) {
    activeElement = e.target;
  }
});

// ===== GET SELECTED TEXT OR ACTIVE INPUT =====
function getSelectedText() {
  const sel = window.getSelection();
  if (sel && sel.toString().length > 0) return sel.toString();
  if (activeElement) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    if (start !== end) return activeElement.value.substring(start, end);
    return activeElement.value;
  }
  return '';
}

// ===== COPY =====
async function copyText() {
  const text = getSelectedText();
  if (!text) {
    showToast('⚠️ Kuch select karo pehle!');
    setStatus('Kuch select nahi hua ❌');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    addToHistory(text);
    updatePreview(text);
    showToast('✅ Copied!');
    setStatus('Copied ✅ ' + text.length + ' chars');
  } catch {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  addToHistory(text);
  updatePreview(text);
  showToast('✅ Copied!');
  setStatus('Copied ✅');
}

// ===== CUT =====
async function cutText() {
  if (!activeElement) {
    showToast('⚠️ Koi input box focus karo!');
    return;
  }
  const start = activeElement.selectionStart;
  const end = activeElement.selectionEnd;
  if (start === end) {
    showToast('⚠️ Kuch select karo cut ke liye!');
    return;
  }
  const text = activeElement.value.substring(start, end);
  activeElement.value =
    activeElement.value.substring(0, start) +
    activeElement.value.substring(end);
  activeElement.setSelectionRange(start, start);

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    fallbackCopy(text);
  }

  addToHistory('✂️ ' + text);
  updatePreview(text);
  showToast('✂️ Cut ho gaya!');
  setStatus('Cut ✂️ ' + text.length + ' chars');
}

// ===== PASTE =====
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText();
    if (!activeElement) {
      showToast('⚠️ Pehle koi input box click karo!');
      return;
    }
    const start = activeElement.selectionStart || activeElement.value.length;
    const end = activeElement.selectionEnd || activeElement.value.length;
    activeElement.value =
      activeElement.value.substring(0, start) +
      text +
      activeElement.value.substring(end);
    activeElement.setSelectionRange(start + text.length, start + text.length);
    activeElement.focus();
    showToast('📋 Pasted!');
    setStatus('Pasted ✅');
  } catch {
    showToast('⚠️ Browser permission chahiye paste ke liye!');
    setStatus('Paste failed - Permission denied ❌');
  }
}

// ===== SELECT ALL =====
function selectAll() {
  if (activeElement) {
    activeElement.focus();
    activeElement.select();
    showToast('🔵 Sab select ho gaya!');
    setStatus('Selected All ✅');
  } else {
    document.execCommand('selectAll');
    showToast('🔵 Select All!');
  }
}

// ===== QUICK TOOLS =====
function toUpperCase() {
  if (!activeElement) return showToast('⚠️ Input focus karo pehle!');
  const s = activeElement.selectionStart;
  const e = activeElement.selectionEnd;
  if (s === e) {
    activeElement.value = activeElement.value.toUpperCase();
  } else {
    const selected = activeElement.value.substring(s, e).toUpperCase();
    activeElement.value = activeElement.value.substring(0, s) + selected + activeElement.value.substring(e);
    activeElement.setSelectionRange(s, e);
  }
  showToast('🔠 UPPERCASE done!');
}

function toLowerCase() {
  if (!activeElement) return showToast('⚠️ Input focus karo pehle!');
  const s = activeElement.selectionStart;
  const e = activeElement.selectionEnd;
  if (s === e) {
    activeElement.value = activeElement.value.toLowerCase();
  } else {
    const selected = activeElement.value.substring(s, e).toLowerCase();
    activeElement.value = activeElement.value.substring(0, s) + selected + activeElement.value.substring(e);
    activeElement.setSelectionRange(s, e);
  }
  showToast('🔡 lowercase done!');
}

function clearActive() {
  if (!activeElement) return showToast('⚠️ Input focus karo pehle!');
  activeElement.value = '';
  showToast('🗑️ Clear ho gaya!');
  setStatus('Cleared ✅');
}

function copyAll() {
  if (!activeElement) return showToast('⚠️ Input focus karo pehle!');
  const text = activeElement.value;
  if (!text) return showToast('⚠️ Kuch nahi hai copy karne ko!');
  fallbackCopy(text);
  showToast('✅ Sab copy ho gaya!');
}

// ===== HISTORY =====
function addToHistory(text) {
  const clean = text.replace('✂️ ', '');
  if (clipHistory.includes(clean)) return;
  clipHistory.unshift(clean);
  if (clipHistory.length > 10) clipHistory.pop();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (clipHistory.length === 0) {
    list.innerHTML = '<p class="no-history">Abhi koi history nahi...</p>';
    return;
  }
  list.innerHTML = clipHistory
    .map((item, i) => `
      <div class="history-item">
        <span class="history-text">${escapeHtml(item)}</span>
        <button class="history-copy" onclick="copyFromHistory(${i})">Copy</button>
      </div>`)
    .join('');
}

function copyFromHistory(index) {
  const text = clipHistory[index];
  navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  updatePreview(text);
  showToast('✅ History se copy!');
}

function clearHistory() {
  clipHistory = [];
  renderHistory();
  showToast('🗑️ History clear!');
}

// ===== PREVIEW =====
async function updatePreview(text) {
  const box = document.getElementById('previewBox');
  if (text) {
    box.textContent = text.length > 120 ? text.substring(0, 120) + '...' : text;
    box.style.color = '#e0e0e0';
    return;
  }
  try {
    const clip = await navigator.clipboard.readText();
    if (clip) {
      box.textContent = clip.length > 120 ? clip.substring(0, 120) + '...' : clip;
      box.style.color = '#e0e0e0';
    }
  } catch {
    box.innerHTML = '<em>Clipboard preview unavailable</em>';
  }
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
    if (e.key === 'C' || e.key === 'c') { e.preventDefault(); copyText(); }
    if (e.key === 'X' || e.key === 'x') { e.preventDefault(); cutText(); }
    if (e.key === 'V' || e.key === 'v') { e.preventDefault(); pasteText(); }
    if (e.key === 'P' || e.key === 'p') { e.preventDefault(); togglePanel(); }
  }
});

// ===== HELPERS =====
function setStatus(msg) {
  document.getElementById('statusBar').textContent = msg;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== INIT =====
setStatus('Ready ✅ — Ctrl+Shift+P to toggle panel');

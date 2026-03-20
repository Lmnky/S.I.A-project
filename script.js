/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
function goTo(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);

  if (id === 'screen-scan-loading') {
    startZxingScanner();
  } else {
    stopZxingScanner();
  }
}

/* ─────────────────────────────────────────────
   BOTTOM SHEET
───────────────────────────────────────────── */
function openSheet() {
  document.getElementById('overlay-add').classList.add('open');
}
function closeSheet() {
  document.getElementById('overlay-add').classList.remove('open');
}
document.getElementById('overlay-add').addEventListener('click', function(e) {
  if (e.target === this) closeSheet();
});

/* ─────────────────────────────────────────────
   QTY BUTTONS
───────────────────────────────────────────── */
document.querySelectorAll('.qty-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const display = this.parentElement.querySelector('.qty-display');
    let v = parseInt(display.textContent);
    if (this.textContent === '+') v++;
    else if (v > 0) v--;
    display.textContent = v;
  });
});

/* ─────────────────────────────────────────────
   CHIPS
───────────────────────────────────────────── */
document.querySelectorAll('.chips').forEach(group => {
  group.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', function() {
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    });
  });
});

/* ─────────────────────────────────────────────
   ZXING BARCODE SCANNER
   Uses BrowserMultiFormatReader which supports:
   EAN-8, EAN-13, Code128, QR Code, DataMatrix,
   UPC-A, UPC-E, ITF, Codabar, PDF417, Aztec, etc.
───────────────────────────────────────────── */
let codeReader   = null;  // ZXing.BrowserMultiFormatReader instance
let scanControls = null;  // returned by decodeFromConstraints — used to stop()
let scanDone     = false; // prevent multiple triggers on the same scan

async function startZxingScanner() {
  scanDone = false;
  updateScanStatus('Avvio fotocamera…', 'neutral');
  resetEanDisplay();
  resetScanFrame();

  const videoEl = document.getElementById('scan-video');

  try {
    // BrowserMultiFormatReader tries all supported barcode formats automatically
    codeReader = new ZXing.BrowserMultiFormatReader();

    // decodeFromConstraints handles getUserMedia internally and returns a
    // controls object with a .stop() method — much cleaner than managing
    // the stream manually.
    scanControls = await codeReader.decodeFromConstraints(
      {
        video: {
          facingMode: { ideal: 'environment' }  // prefer rear camera on mobile
        }
      },
      videoEl,
      (result, error) => {
        // This callback fires on every frame:
        // - result is set when a barcode is found
        // - error is a NotFoundException on frames with no barcode (ignore it)
        if (result && !scanDone) {
          scanDone = true;
          onBarcodeFound(result.getText());
        }
      }
    );

    updateScanStatus('Punta la fotocamera sul barcode…', 'neutral');

  } catch (err) {
    console.error('ZXing error:', err);
    if (err.name === 'NotAllowedError') {
      updateScanStatus('❌ Permesso fotocamera negato', 'error');
    } else {
      updateScanStatus('❌ Fotocamera non disponibile', 'error');
    }
  }
}

function stopZxingScanner() {
  if (scanControls) {
    try { scanControls.stop(); } catch (_) {}
    scanControls = null;
  }
  if (codeReader) {
    try { codeReader.reset(); } catch (_) {}
    codeReader = null;
  }
  scanDone = false;
}

function onBarcodeFound(rawValue) {
  // Update scan screen EAN display
  const eanDisplay = document.getElementById('ean-display');
  if (eanDisplay) eanDisplay.textContent = rawValue;

  // Pre-populate the result screen EAN
  const resultEan = document.getElementById('result-ean-display');
  if (resultEan) resultEan.textContent = 'EAN: ' + rawValue;

  updateScanStatus('✅ Barcode rilevato!', 'success');
  flashScanFrame();

  // Brief visual pause then navigate to result
  setTimeout(() => goTo('screen-scan-result'), 900);
}

/* ── Scanner UI helpers ── */
function updateScanStatus(msg, state) {
  const el = document.getElementById('scan-status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = state === 'success' ? '#4ade80'
                 : state === 'error'   ? '#f87171'
                 : 'rgba(255,255,255,0.75)';
}

function resetEanDisplay() {
  const el = document.getElementById('ean-display');
  if (el) el.textContent = '— — —';
}

function flashScanFrame() {
  const frame = document.getElementById('scan-frame');
  if (!frame) return;
  frame.querySelectorAll('.scan-corner').forEach(c => {
    c.style.borderColor = '#4ade80';
    c.style.transition  = 'border-color 0.2s ease';
  });
  const line = frame.querySelector('.scan-line');
  if (line) line.style.background = '#4ade80';
}

function resetScanFrame() {
  const frame = document.getElementById('scan-frame');
  if (!frame) return;
  frame.querySelectorAll('.scan-corner').forEach(c => {
    c.style.borderColor = '';
    c.style.transition  = '';
  });
  const line = frame.querySelector('.scan-line');
  if (line) line.style.background = '';
}

/* ─────────────────────────────────────────────
   CHEF AI CHAT
───────────────────────────────────────────── */
const fakeReplies = {
  'Cosa cucino stasera?': 'Con quello che hai ti suggerisco: 🍳 <strong>Spaghetti alla carbonara</strong> — usi le uova in scadenza, la pasta e il parmigiano. Oppure una <strong>frittata di pasta</strong> per svuotare il frigo!',
  'Ho usato 2 uova': '✅ Ho aggiornato l\'inventario: <strong>Uova Bio</strong> ora hai <strong>4 pezzi</strong>. Ti rimangono 4 uova — te ne ricordo la scadenza domani! 🥚',
  'Ricetta con la pasta': '🍝 <strong>Pasta al pomodoro classica</strong> — hai tutto: Barilla n.5, polpa Mutti, olio EVO. Pronti in 12 minuti. Vuoi i passaggi dettagliati?',
  'Lista della spesa': '🛒 Basandomi su ciò che sta finendo, ti consiglio di comprare: latte fresco, uova (6 pz), burro e yogurt. Aggiungo anche pomodori freschi?'
};

function sendChat(el) {
  const text = el.textContent;
  addChatMsg(text, 'user');
  el.style.opacity = '0.4';
  setTimeout(() => {
    showTyping();
    setTimeout(() => {
      removeTyping();
      addChatMsg(fakeReplies[text] || 'Ottima domanda! Sto analizzando il tuo inventario…', 'ai');
    }, 1400);
  }, 300);
}

function sendChatText() {
  const input = document.getElementById('chat-input-field');
  const text = input.value.trim();
  if (!text) return;
  addChatMsg(text, 'user');
  input.value = '';
  showTyping();
  setTimeout(() => {
    removeTyping();
    addChatMsg('Capito! Sto elaborando una risposta basata sul tuo inventario attuale. Con gli ingredienti che hai, potresti preparare qualcosa di gustoso! 🍽️', 'ai');
  }, 1600);
}

function addChatMsg(html, type) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg ' + type;
  div.innerHTML = type === 'ai'
    ? '<div class="msg-sender">Chef AI</div><div class="msg-bubble">' + html + '</div>'
    : '<div class="msg-bubble">' + html + '</div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyping() {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.id = 'typing-indicator';
  div.innerHTML = '<div class="msg-sender">Chef AI</div><div class="msg-bubble"><div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>';
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing-indicator');
  if (t) t.remove();
}
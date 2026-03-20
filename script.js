function goTo(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    window.scrollTo(0,0);
    
    /*Quando si è in scanning la camera si attiva/disattiva*/
    if (id === 'screen-scan-loading') {
      startCamera();
    } else {
      stopCamera();
    }
  }
  
  function openSheet() {
    document.getElementById('overlay-add').classList.add('open');
  }
  function closeSheet() {
    document.getElementById('overlay-add').classList.remove('open');
  }
  document.getElementById('overlay-add').addEventListener('click', function(e) {
    if (e.target === this) closeSheet();
  });
  
  // Qty buttons
  document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const display = this.parentElement.querySelector('.qty-display');
      let v = parseInt(display.textContent);
      if (this.textContent === '+') v++;
      else if (v > 0) v--;
      display.textContent = v;
    });
  });
  
  // Chips toggle
  document.querySelectorAll('.chips').forEach(group => {
    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', function() {
        group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
      });
    });
  });
  
  // FAKE CHAT RESPONSES
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
    if (type === 'ai') div.innerHTML = '<div class="msg-sender">Chef AI</div><div class="msg-bubble">' + html + '</div>';
    else div.innerHTML = '<div class="msg-bubble">' + html + '</div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }
  
  function showTyping() {
    const msgs = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'msg ai'; div.id = 'typing-indicator';
    div.innerHTML = '<div class="msg-sender">Chef AI</div><div class="msg-bubble"><div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function removeTyping() {
    const t = document.getElementById('typing-indicator');
    if (t) t.remove();
  }
  let cameraStream = null;
/*Camera logic*/
async function startCamera() {
  const video = document.getElementById('scan-video');
  if (!video) return;

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' } // rear camera on mobile
    });
    video.srcObject = cameraStream;
  } catch (err) {
    console.error('Camera error:', err);
    // Fallback: show the original animation if camera is denied
    document.getElementById('scan-anim-fallback').style.display = 'block';
    document.getElementById('scan-video').style.display = 'none';
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
}
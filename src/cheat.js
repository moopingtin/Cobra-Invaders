window.__cheatFlags = { infiniteLives: false, autoPlay: false };

export function initCheat(game) {
  // ── Styles ──────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #cheat-btn {
      position: fixed; bottom: 14px; right: 14px;
      width: 34px; height: 34px; line-height: 30px; text-align: center;
      background: #00050f; border: 2px solid #00ccff44; border-radius: 8px;
      color: #00ccff66; font-size: 16px; cursor: pointer;
      z-index: 1000; user-select: none; transition: all .15s;
    }
    #cheat-btn:hover { border-color: #00ccff; color: #00ccff; background: #001a33; }

    .cc-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,.82); z-index: 2000;
      align-items: center; justify-content: center;
    }
    .cc-overlay.open { display: flex; }

    .cc-panel {
      background: #00050f; border: 2px solid #00ccff; border-radius: 14px;
      padding: 30px 36px; font-family: monospace; color: #00ccff;
      text-align: center; min-width: 270px;
    }
    .cc-panel h2 { margin: 0 0 20px; font-size: 14px; letter-spacing: 4px; }

    #cc-boxes { display: flex; gap: 10px; justify-content: center; margin-bottom: 14px; }
    .cc-box {
      width: 48px; height: 56px; border: 2px solid #00ccff44; border-radius: 6px;
      font-size: 28px; color: #ffee00; display: flex;
      align-items: center; justify-content: center;
      background: #000; transition: border-color .1s;
    }
    .cc-box.filled { border-color: #ffee00; }
    #cc-msg { height: 20px; font-size: 12px; color: #ff4466; margin-bottom: 12px; }

    .cc-btn {
      margin: 5px 4px 0; padding: 9px 20px;
      background: #001133; border: 2px solid #00ccff55; border-radius: 6px;
      color: #00ccff; font-family: monospace; font-size: 13px;
      cursor: pointer; letter-spacing: 1px; transition: all .15s;
    }
    .cc-btn:hover { background: #002266; border-color: #00ccff; }
    .cc-btn.on   { border-color: #00ff88; color: #00ff88; }

    #llac-btns { display: flex; flex-direction: column; gap: 10px; margin: 16px 0 18px; }
    .llac-wide { width: 100%; font-size: 14px !important; padding: 13px !important; }
  `;
  document.head.appendChild(style);

  // ── Cheat button ─────────────────────────────────────────────────────────────
  const btn = document.createElement('div');
  btn.id = 'cheat-btn';
  btn.textContent = '🔑';
  btn.title = 'Enter cheat code';
  document.body.appendChild(btn);

  // ── Code-input overlay ───────────────────────────────────────────────────────
  const codeOv = document.createElement('div');
  codeOv.className = 'cc-overlay';
  codeOv.innerHTML = `
    <div class="cc-panel">
      <h2>ENTER CODE</h2>
      <div id="cc-boxes">
        <div class="cc-box" id="ccb0">_</div>
        <div class="cc-box" id="ccb1">_</div>
        <div class="cc-box" id="ccb2">_</div>
        <div class="cc-box" id="ccb3">_</div>
      </div>
      <div id="cc-msg"></div>
      <button class="cc-btn" id="cc-close">CLOSE</button>
    </div>`;
  document.body.appendChild(codeOv);

  // ── LLAC cheat-menu overlay ───────────────────────────────────────────────────
  const llacOv = document.createElement('div');
  llacOv.className = 'cc-overlay';
  llacOv.innerHTML = `
    <div class="cc-panel">
      <h2>CHEAT MENU</h2>
      <div id="llac-btns">
        <button class="cc-btn llac-wide" id="btn-autoplay">AUTO PLAY</button>
        <button class="cc-btn llac-wide" id="btn-inflives">INFINITE LIVES</button>
      </div>
      <button class="cc-btn" id="llac-close">CLOSE</button>
    </div>`;
  document.body.appendChild(llacOv);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const boxes = [0, 1, 2, 3].map(i => document.getElementById(`ccb${i}`));
  const msgEl = document.getElementById('cc-msg');
  let code = '';

  function kbOff() {
    game.scene.getScenes(true).forEach(s => {
      try { s.input.keyboard.enabled = false; } catch (_) {}
    });
  }
  function kbOn() {
    game.scene.getScenes(true).forEach(s => {
      try { s.input.keyboard.enabled = true; } catch (_) {}
    });
  }

  function resetCode() {
    code = '';
    boxes.forEach(b => { b.textContent = '_'; b.classList.remove('filled'); });
    msgEl.textContent = '';
  }

  function openCode()  { resetCode(); codeOv.classList.add('open'); kbOff(); }
  function closeCode() { codeOv.classList.remove('open'); kbOn(); }

  function syncLLAC() {
    document.getElementById('btn-autoplay').classList.toggle('on', window.__cheatFlags.autoPlay);
    document.getElementById('btn-inflives').classList.toggle('on', window.__cheatFlags.infiniteLives);
  }
  function openLLAC()  { syncLLAC(); llacOv.classList.add('open'); kbOff(); }
  function closeLLAC() { llacOv.classList.remove('open'); kbOn(); }

  function submitCode() {
    const c = code.toUpperCase();
    if (c === 'LLAC') {
      closeCode();
      openLLAC();
    } else if (c === 'LLSB') {
      closeCode();
      game.scene.getScenes(true).forEach(s => game.scene.stop(s.sys.key));
      game.scene.start('CobraPlayScene');
    } else {
      msgEl.textContent = 'INVALID CODE';
      setTimeout(resetCode, 800);
    }
  }

  // ── Keyboard handler for code input ───────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (!codeOv.classList.contains('open')) return;
    if (e.key === 'Escape') { closeCode(); return; }
    if (e.key === 'Backspace') {
      if (code.length > 0) {
        code = code.slice(0, -1);
        boxes[code.length].textContent = '_';
        boxes[code.length].classList.remove('filled');
        msgEl.textContent = '';
      }
      return;
    }
    if (code.length >= 4 || !/^[a-zA-Z0-9]$/.test(e.key)) return;
    const ch = e.key.toUpperCase();
    boxes[code.length].textContent = ch;
    boxes[code.length].classList.add('filled');
    code += ch;
    if (code.length === 4) submitCode();
  });

  // ── Wire buttons ──────────────────────────────────────────────────────────────
  btn.addEventListener('click', openCode);
  document.getElementById('cc-close').addEventListener('click', closeCode);
  document.getElementById('llac-close').addEventListener('click', closeLLAC);

  document.getElementById('btn-autoplay').addEventListener('click', () => {
    window.__cheatFlags.autoPlay = !window.__cheatFlags.autoPlay;
    syncLLAC();
  });
  document.getElementById('btn-inflives').addEventListener('click', () => {
    window.__cheatFlags.infiniteLives = !window.__cheatFlags.infiniteLives;
    syncLLAC();
  });
}

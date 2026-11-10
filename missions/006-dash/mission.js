'use strict';

function createDashMission({panel, body, title, kicker, element, button, isCompleted, archive}) {
  const channel = 'lovequest.love-dash';
  const version = 1;
  const receiptKey = 'lovequest.chapter04.dash.v1';
  const gameURL = new URL('missions/love-dash/index.html', document.baseURI);
  const gameOrigin = gameURL.protocol === 'file:' ? 'null' : gameURL.origin;
  const modes = ['start', 'playing', 'paused', 'recover', 'won'];
  let receipt = readReceipt();
  let frame = null;
  let session = null;
  let ready = false;
  let gameMode = 'start';
  let loadTimer;
  let status;
  let retry;
  let playArea;
  let exitPrompt = null;

  function hasKeys(value, keys) {
    return value && typeof value === 'object' && !Array.isArray(value) &&
      Object.keys(value).sort().join(',') === [...keys].sort().join(',');
  }

  function readReceipt() {
    try {
      const saved = JSON.parse(localStorage.getItem(receiptKey));
      if (hasKeys(saved, ['version', 'mission', 'session', 'hearts', 'ringCollected', 'wonAt']) &&
          saved.version === version && saved.mission === '006' &&
          typeof saved.session === 'string' && /^[a-f0-9]{32}$/.test(saved.session) &&
          Number.isSafeInteger(saved.hearts) && saved.hearts >= 100 && saved.ringCollected === true &&
          Number.isSafeInteger(saved.wonAt) && saved.wonAt > 0 && saved.wonAt <= Date.now()) {
        return saved;
      }
    } catch { /* A confirmed result can also live in memory for this tab. */ }
    return null;
  }

  function saveReceipt() {
    try { localStorage.setItem(receiptKey, JSON.stringify(receipt)); }
    catch { /* Keep the confirmed result until the current tab is closed. */ }
  }

  function clearReceipt() {
    receipt = null;
    try { localStorage.removeItem(receiptKey); }
    catch { /* Completed progress is still owned by the shell. */ }
  }

  function newSession() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function post(type) {
    if (!frame || !session) return;
    frame.contentWindow.postMessage({channel, version, type, session}, gameOrigin === 'null' ? '*' : gameOrigin);
  }

  function stopGame() {
    clearTimeout(loadTimer);
    window.removeEventListener('message', onMessage);
    frame?.remove();
    frame = null;
    session = null;
    ready = false;
    exitPrompt = null;
    playArea = null;
  }

  function setScreen(heading) {
    stopGame();
    panel.classList.add('dash-panel');
    panel.classList.remove('dash-playing');
    title.textContent = heading;
    title.tabIndex = -1;
    kicker.textContent = 'Игровой парк · Дело 006';
    body.replaceChildren();
    panel.scrollTop = 0;
    if (panel.open) title.focus({preventScroll: true});
  }

  function showResult() {
    if (!isCompleted() && !receipt) return;
    setScreen(isCompleted() ? 'Последняя улика в архиве' : 'Кольцо найдено');
    const success = element('div', undefined, 'dash-success');
    success.append(element('span', 'VI', 'dash-seal'),
      element('h3', isCompleted() ? 'Шестое дело раскрыто' : 'Последнее испытание пройдено'),
      element('p', isCompleted() ? 'Твоя находка сохранена. Можно вернуться в городок или снова пробежать по аллее.' :
        'Сто сердечек и кольцо привели тебя к последней улике. Осталось сохранить её в архиве дела.'));
    body.append(success);
    const feedback = element('p');
    feedback.setAttribute('role', 'status');
    const actions = element('div', undefined, 'dash-actions');
    if (!isCompleted()) {
      const save = button('Сохранить последнюю улику', () => {
        if (!receipt || isCompleted()) return;
        save.disabled = true;
        if (archive()) clearReceipt();
        else {
          feedback.textContent = 'Вернись на карту и открой текущее дело, чтобы сохранить находку.';
          save.disabled = false;
        }
      }, true);
      actions.append(save);
    } else {
      actions.append(button('Сыграть ещё раз', startGame, true));
    }
    actions.append(button('Вернуться на карту', () => panel.close()));
    body.append(feedback, actions);
  }

  function updateStatus() {
    const messages = {
      start: 'Последняя аллея · 100 сердечек и кольцо',
      playing: 'Забег идёт · кольцо появится после 100',
      paused: 'Пауза · продолжить можно в игре',
      recover: 'Сердечки сохранены · можно продолжить',
      won: 'Кольцо найдено · ожидаем подтверждение'
    };
    status.textContent = messages[gameMode];
  }

  function onMessage(event) {
    if (!frame || event.source !== frame.contentWindow || event.origin !== gameOrigin) return;
    const data = event.data;
    if (!data || data.channel !== channel || data.version !== version || data.session !== session) return;
    if ((data.type === 'ready' || data.type === 'state') &&
        hasKeys(data, ['channel', 'version', 'type', 'session', 'mode']) && modes.includes(data.mode)) {
      if (data.type === 'ready') {
        ready = true;
        clearTimeout(loadTimer);
        retry.hidden = true;
      }
      if (!ready) return;
      gameMode = data.mode;
      updateStatus();
      return;
    }
    if (data.type !== 'won' || !ready ||
        !hasKeys(data, ['channel', 'version', 'type', 'session', 'hearts', 'ringCollected']) ||
        !Number.isSafeInteger(data.hearts) || data.hearts < 100 || data.ringCollected !== true) return;
    if (!isCompleted()) {
      receipt = {version, mission: '006', session, hearts: data.hearts, ringCollected: true, wonAt: Date.now()};
      saveReceipt();
    }
    showResult();
  }

  function startGame() {
    setScreen('LOVE DASH · Последнее испытание');
    panel.classList.add('dash-playing');
    const toolbar = element('div', undefined, 'dash-toolbar');
    status = element('p', 'Открываем парковую аллею…');
    status.setAttribute('role', 'status');
    const leave = button('На карту', requestClose);
    retry = button('Открыть заново', startGame);
    retry.hidden = true;
    toolbar.append(status, retry, leave);
    playArea = element('div', undefined, 'dash-play-area');
    frame = element('iframe', undefined, 'dash-frame');
    frame.title = 'LOVE DASH — собрать 100 сердечек и кольцо';
    const activeFrame = frame;
    frame.addEventListener('load', () => {
      if (frame !== activeFrame || !frame.isConnected) return;
      session = newSession();
      ready = false;
      gameMode = 'start';
      clearTimeout(loadTimer);
      post('init');
      loadTimer = setTimeout(() => {
        if (!frame || ready) return;
        status.textContent = 'Игра не загрузилась. Попробуй открыть её заново.';
        retry.hidden = false;
      }, 8000);
    });
    window.addEventListener('message', onMessage);
    frame.src = gameURL.href;
    playArea.append(frame);
    body.append(toolbar, playArea);
  }

  function requestClose() {
    if (!frame) return false;
    if (exitPrompt) {
      exitPrompt.querySelector('button')?.focus();
      return true;
    }
    const resumeOnCancel = gameMode === 'playing';
    post('pause');
    frame.inert = true;
    exitPrompt = element('section', undefined, 'dash-exit-prompt');
    exitPrompt.setAttribute('role', 'group');
    exitPrompt.setAttribute('aria-label', 'Вернуться на карту?');
    const paper = element('div', undefined, 'dash-exit-paper');
    const stay = button('Остаться в игре', () => {
      if (!frame || !exitPrompt) return;
      exitPrompt.remove();
      exitPrompt = null;
      frame.inert = false;
      frame.focus();
      if (resumeOnCancel) post('resume');
    }, true);
    paper.append(element('h3', 'Вернуться в городок?'),
      element('p', 'При следующем входе этот забег начнётся заново. Найденные фрагменты останутся в журнале.'),
      stay, button('Выйти на карту', () => panel.close()));
    exitPrompt.append(paper);
    playArea.append(exitPrompt);
    stay.focus();
    return true;
  }

  return {
    open() {
      if (isCompleted()) clearReceipt();
      if (isCompleted() || receipt) showResult();
      else startGame();
    },
    requestClose,
    clearView() {
      stopGame();
      panel.classList.remove('dash-panel', 'dash-playing');
    },
    reset() {
      stopGame();
      clearReceipt();
    }
  };
}

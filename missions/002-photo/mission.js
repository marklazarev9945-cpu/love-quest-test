'use strict';

function createPhotoMission({panel, body, title, kicker, closeButton, element, button, isCompleted, archive}) {
  const storageKey = 'lovequest.chapter04.photo.v1';
  const photoSource = 'assets/mission-002/proposal.jpg';
  const ornamentSource = 'assets/mission-002/ornament.svg';
  const photoWidth = 1046;
  const photoHeight = 1800;
  const columns = 3;
  const rows = 4;
  const tileCount = columns * rows;
  const caption = '14 июня 2026 года. Балтийская коса. В тот день началась наша следующая глава.';
  let order = readOrder();
  let selected = null;
  let returnFromPreview = null;

  function readOrder() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved) && saved.length === tileCount && new Set(saved).size === tileCount &&
          saved.every(tile => Number.isInteger(tile) && tile >= 0 && tile < tileCount)) return saved;
    } catch { /* Play continues in memory when browser storage is unavailable. */ }
    return null;
  }

  function saveOrder() {
    try { localStorage.setItem(storageKey, JSON.stringify(order)); }
    catch { /* Keep the board in memory for the current tab. */ }
  }

  function correctCount() {
    return order.reduce((count, tile, position) => count + Number(tile === position), 0);
  }

  function shuffle() {
    order = Array.from({length: tileCount}, (_, index) => index);
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [order[index], order[other]] = [order[other], order[index]];
    }
    if (correctCount() === tileCount) [order[0], order[1]] = [order[1], order[0]];
    selected = null;
    saveOrder();
  }

  function setScreen(heading) {
    panel.classList.add('photo-panel');
    title.textContent = heading;
    title.tabIndex = -1;
    kicker.textContent = 'Фотостудия · Дело 002';
    body.replaceChildren();
    panel.scrollTop = 0;
    if (panel.open) title.focus({preventScroll: true});
  }

  function clearView() {
    selected = null;
    returnFromPreview = null;
    panel.classList.remove('photo-panel', 'photo-preview');
    closeButton.setAttribute('aria-label', 'Закрыть окно');
  }

  function makePhoto(onLoad) {
    const image = element('img', undefined, 'studio-photo');
    image.alt = 'Фотография предложения на берегу Балтийского моря';
    image.width = photoWidth;
    image.height = photoHeight;
    if (onLoad) image.addEventListener('load', onLoad, {once: true});
    image.addEventListener('error', () => {
      image.after(element('p', 'Снимок не загрузился. Вернись на карту и открой Фотостудию снова.', 'studio-note'));
    }, {once: true});
    image.src = photoSource;
    return image;
  }

  function makeOrnament() {
    const image = element('img', undefined, 'studio-photo');
    image.alt = 'Орнамент с розой, листьями и лентами';
    image.width = 600;
    image.height = 720;
    image.src = ornamentSource;
    return image;
  }

  function showPreview(restore, ornament) {
    const previousScroll = panel.scrollTop;
    returnFromPreview = () => {
      restore();
      panel.scrollTop = previousScroll;
      body.querySelector('.studio-open-preview')?.focus({preventScroll: true});
    };
    panel.classList.add('photo-preview');
    closeButton.setAttribute('aria-label', 'Закрыть просмотр снимка');
    setScreen(ornament ? 'Цельный орнамент' : 'Оригинал фотографии');
    const viewport = element('div', undefined, 'studio-viewport');
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', ornament ? 'Просмотр орнамента' : 'Просмотр фотографии');
    viewport.append(ornament ? makeOrnament() : makePhoto());
    const zoom = button('Увеличить', () => {
      const expanded = viewport.classList.toggle('is-expanded');
      zoom.textContent = expanded ? 'Показать целиком' : 'Увеличить';
      if (!expanded) viewport.scrollTo(0, 0);
    });
    body.append(zoom, viewport, button('Вернуться в Фотостудию', closePreview));
  }

  function closePreview() {
    if (!returnFromPreview) return false;
    const restore = returnFromPreview;
    returnFromPreview = null;
    panel.classList.remove('photo-preview');
    closeButton.setAttribute('aria-label', 'Закрыть окно');
    restore();
    return true;
  }

  function previewButton(label, restore, ornament = false) {
    const control = button(label, () => showPreview(restore, ornament));
    control.classList.add('studio-open-preview');
    return control;
  }

  function backToMap() {
    return button('Вернуться на карту', () => panel.close());
  }

  function showPuzzle() {
    setScreen('Восстановить утраченное');
    const count = element('p', '', 'studio-count');
    count.setAttribute('role', 'status');
    const board = element('div', undefined, 'studio-board');
    board.setAttribute('role', 'group');
    board.setAttribute('aria-label', 'Пазл: 3 столбца и 4 строки');
    board.style.aspectRatio = '5 / 6';
    const tiles = order.map((_, position) => {
      const tile = button('', () => choose(position));
      tile.className = 'studio-tile';
      tile.setAttribute('aria-label', `Плитка ${position + 1}`);
      return tile;
    });
    board.append(...tiles);

    function updateBoard() {
      tiles.forEach((tile, position) => {
        const fragment = order[position];
        const x = (fragment % columns) * 100 / (columns - 1);
        const y = Math.floor(fragment / columns) * 100 / (rows - 1);
        tile.style.backgroundPosition = `${x}% ${y}%`;
        tile.setAttribute('aria-pressed', String(position === selected));
      });
      count.textContent = `На своих местах: ${correctCount()} из ${tileCount}`;
    }

    function choose(position) {
      if (selected === null || selected === position) {
        selected = selected === position ? null : position;
      } else {
        [order[selected], order[position]] = [order[position], order[selected]];
        selected = null;
        saveOrder();
        if (correctCount() === tileCount) {
          showReveal(true);
          return;
        }
      }
      updateBoard();
    }

    const hint = element('details', undefined, 'studio-note');
    hint.append(element('summary', 'Подсказка'), element('p', 'Сначала найди края и ориентиры на фоне. Если сложно — посмотри цельный орнамент'));
    const confirmation = element('div', undefined, 'studio-note');
    confirmation.hidden = true;
    const shuffleButton = button('Перемешать заново', () => {
      confirmation.hidden = false;
      keepOrder.focus();
    });
    const keepOrder = button('Оставить как есть', () => {
      confirmation.hidden = true;
      shuffleButton.focus();
    });
    confirmation.append(element('p', 'Перемешать плитки? Текущая раскладка заменится новой.'), keepOrder, button('Да, перемешать', () => {
      shuffle();
      showPuzzle();
    }, true));
    const actions = element('div', undefined, 'studio-actions');
    actions.append(previewButton('Посмотреть орнамент', showPuzzle, true), shuffleButton, backToMap());
    body.append(element('p', 'Нажми на два фрагмента, чтобы поменять их местами'), count, board, actions, confirmation, hint);
    updateBoard();
  }

  function showReveal(justSolved = false) {
    const completed = isCompleted();
    setScreen(completed ? 'Снимок из архива' : 'Фотография восстановлена');
    const figure = element('figure', undefined, justSolved ? 'studio-figure studio-found' : 'studio-figure');
    const actions = element('div', undefined, 'studio-actions');
    actions.append(previewButton('Рассмотреть снимок', showReveal));
    let saveButton;
    if (!completed) {
      saveButton = button('Сохранить снимок в архиве', () => {
        if (correctCount() === tileCount && !isCompleted()) archive();
      }, true);
      saveButton.disabled = true;
      actions.append(saveButton);
    }
    actions.append(backToMap());
    const picture = element('div', undefined, 'studio-picture');
    picture.append(makePhoto(() => {
      picture.classList.add('is-loaded');
      if (saveButton) saveButton.disabled = false;
    }));
    if (justSolved) {
      const ornament = makeOrnament();
      ornament.classList.add('studio-merging');
      ornament.alt = '';
      picture.append(ornament);
    }
    figure.append(picture, element('figcaption', caption));
    body.append(figure, element('p', 'Некоторые мгновения хочется собрать по кусочкам, чтобы снова увидеть их целиком.'), actions);
  }

  return {
    open() {
      setScreen('Фотостудия');
      polishInterior({body, element, button}, 'studio', () => {
        if (isCompleted()) return showReveal();
        if (!order) shuffle();
        if (correctCount() === tileCount) showReveal();
        else showPuzzle();
      });
      body.append(backToMap());
    },
    closePreview,
    clearView,
    reset() {
      order = null;
      selected = null;
      try { localStorage.removeItem(storageKey); }
      catch { /* The board is already reset in memory. */ }
    }
  };
}

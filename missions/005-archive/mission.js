'use strict';

function createArchiveMission({panel, body, title, kicker, closeButton, element, button, isCompleted, archive}) {
  const storageKey = 'lovequest.chapter04.archive.v1';
  const photos = [
    {id: 'b47c', alt: 'Совместное уличное селфи', width: 1080, height: 1440},
    {id: 'f2a9', alt: 'Совместный снимок в большом зеркале', width: 1080, height: 1440},
    {id: 'c61d', alt: 'Поцелуй на фоне здания у воды', width: 1080, height: 1440},
    {id: 'a83e', alt: 'Селфи в костюмах перед зеркалом', width: 1080, height: 1440},
    {id: 'e59b', alt: 'Девушка на SUP-доске на воде', width: 1080, height: 1440},
    {id: 'd04f', alt: 'Снимок пары с букетом', width: 960, height: 1280}
  ];
  const correctOrder = photos.map(photo => photo.id);
  let progress = readProgress();
  let selected = null;
  let returnFromPreview = null;

  function freshProgress() {
    return {order: null, hintUsed: false, verified: false, archived: false};
  }

  function validOrder(order) {
    return Array.isArray(order) && order.length === photos.length &&
      new Set(order).size === photos.length && order.every(id => correctOrder.includes(id));
  }

  function isCorrect(order) {
    return validOrder(order) && order.every((id, index) => id === correctOrder[index]);
  }

  function readProgress() {
    const state = freshProgress();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || !validOrder(saved.order)) return state;
      state.order = [...saved.order];
      state.hintUsed = saved.hintUsed === true;
      state.verified = saved.verified === true && isCorrect(state.order);
      state.archived = saved.archived === true && isCompleted();
    } catch { /* Continue in memory when storage is unavailable or invalid. */ }
    return state;
  }

  function saveProgress() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); }
    catch { /* This tab retains the current arrangement. */ }
  }

  function ensureOrder() {
    if (progress.order) return;
    progress.order = [...correctOrder];
    for (let index = progress.order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [progress.order[index], progress.order[other]] = [progress.order[other], progress.order[index]];
    }
    if (isCorrect(progress.order)) {
      [progress.order[0], progress.order[1]] = [progress.order[1], progress.order[0]];
    }
    saveProgress();
  }

  function setScreen(heading) {
    panel.classList.add('archive-panel');
    title.textContent = heading;
    title.tabIndex = -1;
    kicker.textContent = 'Секретный архив · Дело 005';
    body.replaceChildren();
    panel.scrollTop = 0;
    if (panel.open) title.focus({preventScroll: true});
  }

  function backToMap() {
    return button('Вернуться на карту', () => panel.close());
  }

  function photoById(id) {
    return photos.find(photo => photo.id === id);
  }

  function makePhoto(id, onLoad) {
    const photo = photoById(id);
    const image = element('img', undefined, 'archive-photo');
    image.alt = photo.alt;
    image.width = photo.width;
    image.height = photo.height;
    image.decoding = 'async';
    if (onLoad) image.addEventListener('load', onLoad, {once: true});
    image.addEventListener('error', () => {
      image.after(element('p', 'Снимок не загрузился. Проверь соединение и открой архив снова.', 'archive-image-error'));
    }, {once: true});
    image.src = 'assets/mission-005/frame-' + photo.id + '.jpg';
    return image;
  }

  function openPhotos() {
    selected = null;
    if (isCompleted()) {
      progress.order = [...correctOrder];
      progress.verified = true;
      progress.archived = true;
      saveProgress();
    }
    ensureOrder();
    if (progress.verified) showTimeline();
    else showPuzzle();
  }

  function showRoom() {
    selected = null;
    setScreen('Секретный архив');
    const scene = element('div', undefined, 'archive-scene');
    const illustration = element('img', undefined, 'archive-illustration');
    illustration.src = 'assets/mission-005/archive.svg';
    illustration.alt = 'Тёплый архив с полками, папками, лампой и коробкой фотографий на столе';
    illustration.width = 480;
    illustration.height = 420;
    scene.append(illustration);
    for (let index = 0; index < 3; index++) {
      const mote = element('span', undefined, 'archive-mote');
      mote.setAttribute('aria-hidden', 'true');
      scene.append(mote);
    }
    const box = button('', openPhotos);
    box.className = 'archive-box';
    box.setAttribute('aria-label', 'Открыть коробку с фотографиями');
    box.append(element('span', 'Открыть коробку', 'archive-box-label'));
    scene.append(box);
    body.append(
      element('p', 'В этом архиве хранятся дороги, по которым мы уже прошли. Кажется, в коробке на столе перепутались фотографии…'),
      scene,
      element('p', isCompleted() || progress.verified ? 'Воспоминания уже нашли свой порядок. Открой коробку, чтобы пересмотреть их.' :
        'Коснись коробки с фотографиями. У каждого снимка есть своё место в нашей истории.', 'archive-note'),
      backToMap()
    );
  }

  function showPreview(id, restore, focusSelector) {
    const previousScroll = panel.scrollTop;
    returnFromPreview = () => {
      restore();
      panel.scrollTop = previousScroll;
      body.querySelector(focusSelector)?.focus({preventScroll: true});
    };
    setScreen('Рассмотреть снимок');
    panel.classList.add('archive-preview');
    closeButton.setAttribute('aria-label', 'Закрыть просмотр снимка');
    const viewport = element('div', undefined, 'archive-preview-viewport');
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Увеличенный снимок с прокруткой');
    const image = makePhoto(id);
    viewport.style.setProperty('--archive-photo-width', photoById(id).width + 'px');
    viewport.append(image);
    const zoom = button('Увеличить', () => {
      const expanded = viewport.classList.toggle('is-expanded');
      zoom.textContent = expanded ? 'Показать целиком' : 'Увеличить';
      if (!expanded) viewport.scrollTo(0, 0);
    });
    body.append(zoom, viewport, button('Вернуться к фотографиям', closePreview), backToMap());
  }

  function closePreview() {
    if (!returnFromPreview) return false;
    const restore = returnFromPreview;
    returnFromPreview = null;
    panel.classList.remove('archive-preview');
    closeButton.setAttribute('aria-label', 'Закрыть окно');
    restore();
    return true;
  }

  function showPuzzle() {
    setScreen('Восстановить хронологию');
    const instructions = element('p', 'Расставь снимки от самого раннего к самому позднему. Выбери две фотографии, чтобы поменять их местами.');
    const selectionNote = element('p', undefined, 'archive-selection-note');
    selectionNote.setAttribute('role', 'status');
    const board = element('ol', undefined, 'archive-board');
    board.setAttribute('aria-label', 'Шесть позиций хронологии');
    const controls = [];
    const images = [];
    const labels = [];
    const feedback = element('p', undefined, 'archive-feedback');
    feedback.setAttribute('role', 'status');

    function updateBoard() {
      progress.order.forEach((id, position) => {
        const photo = photoById(id);
        const image = images[position];
        const source = 'assets/mission-005/frame-' + id + '.jpg';
        if (image.getAttribute('src') !== source) image.src = source;
        image.alt = photo.alt;
        image.width = photo.width;
        image.height = photo.height;
        controls[position].setAttribute('aria-pressed', String(selected === position));
        controls[position].setAttribute('aria-label', 'Выбрать снимок в позиции ' + (position + 1));
        labels[position].textContent = selected === position ? 'Выбрано' : 'Выбрать снимок';
      });
      selectionNote.textContent = selected === null ? 'Снимков: 6. Выбери первую карточку.' :
        'Выбрана позиция ' + (selected + 1) + '. Выбери вторую карточку для обмена.';
    }

    function choose(position) {
      feedback.textContent = '';
      if (selected === null || selected === position) {
        selected = selected === position ? null : position;
      } else {
        const previous = selected;
        [progress.order[previous], progress.order[position]] = [progress.order[position], progress.order[previous]];
        selected = null;
        saveProgress();
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          for (const index of [previous, position]) {
            controls[index].getAnimations?.().forEach(animation => animation.cancel());
            controls[index].animate?.([{opacity: .55}, {opacity: 1}], {duration: 220});
          }
        }
      }
      updateBoard();
    }

    progress.order.forEach((id, position) => {
      const card = element('li', undefined, 'archive-card');
      const select = button('', () => choose(position));
      select.className = 'archive-select';
      select.dataset.position = position;
      const image = makePhoto(id);
      const label = element('span', undefined, 'archive-select-label');
      select.append(image, label);
      controls.push(select);
      images.push(image);
      labels.push(label);
      const preview = button('Рассмотреть', () => showPreview(progress.order[position], showPuzzle, '[data-preview="' + position + '"]'));
      preview.classList.add('archive-preview-button');
      preview.dataset.preview = position;
      preview.setAttribute('aria-label', 'Рассмотреть снимок в позиции ' + (position + 1));
      card.append(element('span', 'Позиция ' + (position + 1), 'archive-position'), select, preview);
      board.append(card);
    });

    const hintText = element('p', undefined, 'archive-hint');
    hintText.hidden = !progress.hintUsed;
    hintText.textContent = 'Начни с воспоминания, которое было ещё до осени 2025 года.';
    const hint = button(progress.hintUsed ? 'Подсказка открыта' : 'Нужна помощь?', () => {
      progress.hintUsed = true;
      hintText.hidden = false;
      hint.textContent = 'Подсказка открыта';
      hint.disabled = true;
      saveProgress();
    });
    hint.disabled = progress.hintUsed;
    const check = button('Проверить хронологию', () => {
      if (!isCorrect(progress.order)) {
        feedback.textContent = 'Пока история не складывается. Вспомни, что было раньше, и попробуй поменять снимки местами.';
        return;
      }
      progress.verified = true;
      selected = null;
      saveProgress();
      showTimeline();
    }, true);
    const navigation = element('div', undefined, 'archive-actions');
    navigation.append(check, button('Вернуться в архив', showRoom), backToMap());
    body.append(instructions, hint, hintText, selectionNote, board, feedback, navigation);
    updateBoard();
  }

  function showTimeline() {
    if (!progress.verified && !isCompleted()) return;
    setScreen(isCompleted() ? 'Воспоминания из архива' : 'Хронология восстановлена');
    // Dates are rendered only after a successful check or in the archived view.
    const dates = ['28.06.2025', '14.09.2025', '14.10.2025', '25.04.2026', '18.07.2026', '30.07.2026'];
    body.append(element('p', 'Шесть мгновений снова на своих местах. Как много дорог уже позади — и сколько ещё впереди, вместе.'));
    const timeline = element('ol', undefined, 'archive-timeline');
    let loaded = 0;
    let saveButton;
    const feedback = element('p', undefined, 'archive-feedback');
    feedback.setAttribute('role', 'status');
    if (!isCompleted()) {
      saveButton = button('Сохранить воспоминания в архиве', () => {
        if (!progress.verified || !isCorrect(progress.order) || isCompleted()) return;
        if (archive()) {
          progress.archived = true;
          saveProgress();
        } else {
          feedback.textContent = 'Не удалось сохранить находку. Вернись на карту и открой текущее дело.';
        }
      }, true);
      saveButton.disabled = true;
    }
    photos.forEach((photo, index) => {
      const item = element('li', undefined, 'archive-memory');
      const figure = element('figure');
      const image = makePhoto(photo.id, () => {
        loaded++;
        if (saveButton && loaded === photos.length) saveButton.disabled = false;
      });
      const caption = element('figcaption');
      const date = element('time', dates[index]);
      const [day, month, year] = dates[index].split('.');
      date.dateTime = year + '-' + month + '-' + day;
      caption.append(date);
      figure.append(image, caption);
      const preview = button('Рассмотреть', () => showPreview(photo.id, showTimeline, '[data-memory="' + index + '"]'));
      preview.dataset.memory = index;
      preview.setAttribute('aria-label', 'Рассмотреть воспоминание ' + (index + 1));
      item.append(figure, preview);
      timeline.append(item);
    });
    const actions = element('div', undefined, 'archive-actions');
    if (saveButton) actions.append(saveButton);
    actions.append(button('Вернуться в архив', showRoom), backToMap());
    body.append(timeline, feedback, actions);
  }

  return {
    open: showRoom,
    closePreview,
    clearView() {
      selected = null;
      returnFromPreview = null;
      panel.classList.remove('archive-panel', 'archive-preview');
      closeButton.setAttribute('aria-label', 'Закрыть окно');
    },
    reset() {
      progress = freshProgress();
      selected = null;
      returnFromPreview = null;
      try { localStorage.removeItem(storageKey); }
      catch { /* The in-memory state is already reset. */ }
    }
  };
}

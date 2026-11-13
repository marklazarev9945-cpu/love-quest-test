'use strict';

// Fixed coordinates keep the same puzzle and saved cell keys across visits.
function buildLibraryCrossword() {
  const words = [
    {id: 1, answer: 'КАРА', question: 'Как звали мою первую кошку?', row: 6, col: 2, direction: 'down'},
    {id: 2, answer: 'НОКИА', question: 'Какой марки был мой первый телефон?', row: 6, col: 0, direction: 'across'},
    {id: 3, answer: 'ДУАЛСЕНС', question: 'Как называется контроллер PlayStation 5?', row: 0, col: 0, direction: 'down'},
    {id: 4, answer: 'КАРТОШКА', question: 'Какую еду я особенно люблю?', row: 11, col: 0, direction: 'across'},
    {id: 5, answer: 'ПАРМЕЗАН', question: 'Какой сыр я люблю?', row: 0, col: 4, direction: 'down'},
    {id: 6, answer: 'ПЕНЗА', question: 'В каком городе я играл в бильярд?', row: 7, col: 7, direction: 'down'},
    {id: 7, answer: 'ВАЛЕНТИН', question: 'Как звали моего дедушку?', row: 1, col: 3, direction: 'across'},
    {id: 8, answer: 'ЕКАТЕРИНУ', question: 'Кого я люблю больше всего?', row: 9, col: 0, direction: 'across'}
  ];
  const cells = new Map();
  const starts = new Set();
  const ids = new Set();

  for (const word of words) {
    const start = word.row + ',' + word.col;
    if (ids.has(word.id) || starts.has(start) || !/^[А-ЯЁ]+$/.test(word.answer) ||
        !['across', 'down'].includes(word.direction) ||
        !Number.isInteger(word.row) || !Number.isInteger(word.col) || word.row < 0 || word.col < 0) {
      throw new Error('Invalid crossword word or starting cell.');
    }
    ids.add(word.id);
    starts.add(start);
    word.keys = [];
    for (let index = 0; index < word.answer.length; index++) {
      const row = word.row + (word.direction === 'down' ? index : 0);
      const col = word.col + (word.direction === 'across' ? index : 0);
      const key = row + ',' + col;
      let cell = cells.get(key);
      if (!cell) {
        cell = {key, row, col, answer: word.answer[index], words: []};
        cells.set(key, cell);
      }
      if (cell.answer !== word.answer[index] ||
          cell.words.some(other => other.direction === word.direction)) {
        throw new Error('Conflicting crossword letters or overlapping words.');
      }
      cell.words.push(word);
      word.keys.push(key);
    }
  }

  // Every touching pair must belong to a declared word in that direction.
  for (const cell of cells.values()) {
    for (const [dr, dc, direction] of [[0, 1, 'across'], [1, 0, 'down']]) {
      const adjacent = cells.get((cell.row + dr) + ',' + (cell.col + dc));
      if (adjacent && !cell.words.some(word => word.direction === direction && adjacent.words.includes(word))) {
        throw new Error('Undeclared adjacent crossword letters.');
      }
    }
  }
  const connected = new Set([words[0]]);
  const queue = [words[0]];
  while (queue.length) {
    const word = queue.shift();
    for (const key of word.keys) {
      for (const neighbour of cells.get(key).words) {
        if (!connected.has(neighbour)) {
          connected.add(neighbour);
          queue.push(neighbour);
        }
      }
    }
  }
  if (words.length !== 8 || connected.size !== words.length) {
    throw new Error('The crossword must connect all eight words.');
  }
  return {
    words, cells,
    rows: Math.max(...[...cells.values()].map(cell => cell.row)) + 1,
    columns: Math.max(...[...cells.values()].map(cell => cell.col)) + 1
  };
}

function createLibraryMission({panel, body, title, kicker, element, button, isCompleted, archive}) {
  const storageKey = 'lovequest.chapter04.library.v1';
  const layout = buildLibraryCrossword();
  const {words, cells} = layout;
  let progress = readProgress();
  let loveTimer;

  function updateViewport() {
    panel.style.setProperty('--library-view-height', (window.visualViewport?.height || window.innerHeight) + 'px');
    panel.style.setProperty('--library-view-top', (window.visualViewport?.offsetTop || 0) + 'px');
  }

  function freshProgress() {
    return {letters: {}, solved: [], hints: [], selected: 1, page: 'library', loveSeen: false};
  }

  function readProgress() {
    const state = freshProgress();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || typeof saved !== 'object') return state;
      for (const key of cells.keys()) {
        const letter = saved.letters?.[key];
        if (typeof letter === 'string' && /^[А-ЯЁ]$/.test(letter)) state.letters[key] = letter;
      }
      // Old saves use a word ID for its first letter. New hints use cell coordinates.
      if (Array.isArray(saved.hints)) {
        state.hints = [...new Set(saved.hints.filter(hint =>
          cells.has(hint) || words.some(word => word.id === hint)))];
        for (const hint of state.hints) {
          const key = cells.has(hint) ? hint : words.find(word => word.id === hint).keys[0];
          state.letters[key] = cells.get(key).answer;
        }
      }
      state.solved = words.filter(word =>
        Array.isArray(saved.solved) && saved.solved.includes(word.id) &&
        word.keys.every((key, index) => state.letters[key] === word.answer[index])
      ).map(word => word.id);
      if (words.some(word => word.id === saved.selected)) state.selected = saved.selected;
      if (['library', 'crossword', 'complete'].includes(saved.page)) state.page = saved.page;
      state.loveSeen = saved.loveSeen === true || state.solved.includes(8);
    } catch { /* Keep playing in memory if storage is unavailable or invalid. */ }
    return state;
  }

  function saveProgress() {
    try { localStorage.setItem(storageKey, JSON.stringify(progress)); }
    catch { /* Discoveries remain available in this tab. */ }
  }

  function isSolved(word) {
    return isCompleted() || progress.solved.includes(word.id);
  }

  function isLocked(key) {
    return progress.hints.includes(key) || cells.get(key).words.some(word =>
      isSolved(word) || (progress.hints.includes(word.id) && word.keys[0] === key));
  }

  function letterAt(key) {
    return isCompleted() ? cells.get(key).answer : progress.letters[key] || '';
  }

  function allSolved() {
    return isCompleted() || progress.solved.length === words.length;
  }

  function setScreen(heading, page) {
    clearTimeout(loveTimer);
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);
    updateViewport();
    panel.classList.add('library-panel');
    panel.classList.remove('library-crossword');
    title.textContent = heading;
    title.tabIndex = -1;
    kicker.textContent = 'Библиотека · Дело 004';
    body.replaceChildren();
    panel.scrollTop = 0;
    progress.page = page;
    saveProgress();
    if (panel.open) title.focus({preventScroll: true});
  }

  function backToMap() {
    return button('Вернуться на карту', () => panel.close());
  }

  function showLibrary() {
    setScreen('Библиотека секретов', 'library');
    const scene = element('div', undefined, 'library-scene');
    const illustration = element('img', undefined, 'library-illustration');
    illustration.src = 'assets/mission-004/library.svg';
    illustration.alt = 'Уютная библиотека с книжными шкафами, окном и письменным столом';
    illustration.width = 480;
    illustration.height = 420;
    const desk = button('', () => allSolved() ? showComplete() : showCrossword());
    desk.className = 'library-desk';
    desk.setAttribute('aria-label', allSolved() ? 'Открыть собранную страницу на столе' : 'Открыть книгу с загадками на столе');
    desk.append(element('span', 'Открыть книгу', 'library-desk-label'));
    scene.append(illustration, desk);
    body.append(
      element('p', 'Кажется, на столе оставили книгу с загадками…'),
      scene,
      element('p', allSolved() ? 'Все ответы уже на страницах. Загляни в книгу, чтобы перечитать историю.' :
        'Коснись раскрытой книги на столе. Восемь ответов помогут продолжить расследование.', 'library-note'),
      backToMap()
    );
  }

  function showComplete() {
    if (!allSolved()) return;
    setScreen(isCompleted() ? 'Страница из архива' : 'Одна история на двоих', 'complete');
    const book = element('div', undefined, 'library-final-book');
    book.append(element('span', 'VIII', 'eyebrow'), element('h3', 'Все ответы сложились в одну историю.'),
      element('p', 'В знакомых словах — столько дорогих сердцу воспоминаний. Эта страница теперь на своём месте.'));
    body.append(book, button('Рассмотреть решённый кроссворд', showCrossword));
    if (!isCompleted()) {
      body.append(button('Сохранить страницу в архиве', () => {
        if (allSolved() && !isCompleted()) archive();
      }, true));
    }
    body.append(button('Вернуться в библиотеку', showLibrary), backToMap());
  }

  function showCrossword() {
    setScreen('Восемь знакомых ответов', 'crossword');
    panel.classList.add('library-crossword');
    const counter = element('p', undefined, 'library-counter');
    const form = element('form', undefined, 'library-answer-form');
    const question = element('label', undefined, 'library-question');
    question.htmlFor = 'library-answer';
    const direction = element('p', undefined, 'library-note');
    direction.id = 'library-direction';
    const input = element('input', undefined, 'library-answer');
    input.id = 'library-answer';
    input.type = 'text';
    input.lang = 'ru';
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.autocapitalize = 'characters';
    input.spellcheck = false;
    input.enterKeyHint = 'done';
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('aria-describedby', 'library-direction library-feedback');
    const feedback = element('p', undefined, 'library-feedback');
    feedback.id = 'library-feedback';
    feedback.setAttribute('role', 'status');
    const romance = element('p', undefined, 'library-romance');
    romance.setAttribute('role', 'status');
    const check = button('Проверить ответ', submitAnswer, true);
    const hint = button('Подсказать одну букву', giveHint);
    const formActions = element('div', undefined, 'library-actions');
    formActions.append(check, hint);
    form.append(question, direction, input, feedback, formActions, romance);
    form.addEventListener('submit', event => { event.preventDefault(); submitAnswer(); });
    input.addEventListener('input', event => {
      if (!event.isComposing) writeInput();
    });
    input.addEventListener('compositionend', writeInput);

    const ready = element('section', undefined, 'library-ready');
    ready.append(element('p', 'Все восемь ответов найдены. Пора перевернуть страницу.'),
      button('Открыть собранную страницу', showComplete, true));

    const scroll = element('div', undefined, 'library-grid-scroll');
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', 'Сетка кроссворда. Для выбора с клавиатуры также доступны вопросы под сеткой.');
    const grid = element('div', undefined, 'library-grid');
    grid.style.setProperty('--library-columns', layout.columns);
    const cellButtons = new Map();
    const cellLetters = new Map();
    const wordButtons = new Map();
    const questions = element('div', undefined, 'library-questions');
    questions.setAttribute('role', 'group');
    questions.setAttribute('aria-label', 'Вопросы кроссворда');
    let error = false;

    function selectedWord() {
      return words.find(word => word.id === progress.selected);
    }

    function pattern(word) {
      const letters = word.keys.map(key => letterAt(key));
      return letters.some(Boolean) ? letters.map(letter => letter || '·').join('') : '';
    }

    function chooseWord(word, focusInput = true) {
      progress.selected = word.id;
      error = false;
      input.value = pattern(word);
      feedback.textContent = '';
      input.removeAttribute('aria-invalid');
      saveProgress();
      update();
      if (focusInput) {
        input.focus();
        input.select();
        form.scrollIntoView({block: 'start', behavior: 'auto'});
      }
    }

    function update() {
      const selected = selectedWord();
      const solved = isSolved(selected);
      counter.textContent = 'Ответы · ' + (isCompleted() ? words.length : progress.solved.length) + '/' + words.length;
      question.textContent = selected.id + '. ' + selected.question;
      direction.textContent = (selected.direction === 'across' ? 'По горизонтали' : 'По вертикали') +
        ' · ' + selected.answer.length + ' букв';
      input.readOnly = solved;
      input.maxLength = selected.answer.length + 12;
      check.disabled = solved;
      hint.disabled = solved || selected.keys.every(isLocked);
      ready.hidden = !allSolved();
      for (const [key, control] of cellButtons) {
        const cell = cells.get(key);
        const active = selected.keys.includes(key);
        const known = cell.words.some(isSolved) || isLocked(key);
        const value = letterAt(key);
        control.classList.toggle('is-selected', active);
        control.classList.toggle('is-correct', known);
        control.classList.toggle('is-draft', !!value && !known);
        control.classList.toggle('is-error', error && active && !known);
        control.tabIndex = key === selected.keys[0] ? 0 : -1;
        control.setAttribute('aria-label', 'Строка ' + (cell.row + 1) + ', столбец ' + (cell.col + 1) +
          '. Вопрос ' + cell.words.map(word => word.id).join(' и ') + '. ' + (value || 'Пусто'));
        cellLetters.get(key).textContent = value;
      }
      for (const word of words) {
        const control = wordButtons.get(word.id);
        control.setAttribute('aria-pressed', String(word.id === selected.id));
        control.classList.toggle('is-correct', isSolved(word));
        control.querySelector('.library-word-state').textContent = isSolved(word) ? 'Разгадано' :
          (word.direction === 'across' ? 'По горизонтали' : 'По вертикали') + ' · ' + word.answer.length;
      }
    }

    function writeInput() {
      const word = selectedWord();
      if (isSolved(word)) return;
      const text = input.value.trim().toLocaleUpperCase('ru-RU');
      // Locked intersections always keep their confirmed letter.
      if (/^[А-ЯЁ· ]*$/.test(text) && text.length <= word.answer.length) {
        word.keys.forEach((key, index) => {
          if (isLocked(key)) return;
          const letter = text[index] || '';
          if (/^[А-ЯЁ]$/.test(letter)) progress.letters[key] = letter;
          else delete progress.letters[key];
        });
        saveProgress();
      }
      error = false;
      input.removeAttribute('aria-invalid');
      feedback.textContent = '';
      update();
    }

    function submitAnswer() {
      const word = selectedWord();
      if (isSolved(word)) return;
      const answer = input.value.trim().toLocaleUpperCase('ru-RU');
      if (answer !== word.answer) {
        error = true;
        input.setAttribute('aria-invalid', 'true');
        feedback.textContent = /^[А-ЯЁ]+$/.test(answer) ?
          'Пока не сходится. Вспомни ещё раз — буквы на пересечениях помогут.' :
          'Введи ответ кириллицей. Регистр не важен.';
        update();
        return;
      }
      word.keys.forEach((key, index) => { progress.letters[key] = word.answer[index]; });
      progress.solved.push(word.id);
      input.value = word.answer;
      error = false;
      input.removeAttribute('aria-invalid');
      feedback.textContent = 'Верно. Ещё одно знакомое слово на своём месте.';
      if (word.id === 8 && !progress.loveSeen) {
        progress.loveSeen = true;
        romance.textContent = 'Некоторые ответы я знаю сердцем ❤️';
        const loveCells = word.keys.map(key => cellButtons.get(key));
        loveCells.forEach(control => control.classList.add('is-love'));
        loveTimer = setTimeout(() => loveCells.forEach(control => control.classList.remove('is-love')), 2400);
      }
      saveProgress();
      update();
      input.blur();
    }

    function giveHint() {
      const word = selectedWord();
      if (isSolved(word)) return;
      const available = word.keys.filter(key => !isLocked(key));
      const key = available.find(key => letterAt(key) !== cells.get(key).answer) ?? available[0];
      if (!key) return;
      const letter = cells.get(key).answer;
      progress.hints.push(key);
      progress.letters[key] = letter;
      input.value = pattern(word);
      error = false;
      input.removeAttribute('aria-invalid');
      if (input.value === word.answer) {
        submitAnswer();
        return;
      }
      feedback.textContent = 'Открыта буква «' + letter + '» на позиции ' + (word.keys.indexOf(key) + 1) + '.';
      saveProgress();
      update();
    }

    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.columns; col++) {
        const key = row + ',' + col;
        const cell = cells.get(key);
        if (!cell) {
          grid.append(element('span', undefined, 'library-blank'));
          continue;
        }
        const control = button('', () => {
          const current = cell.words.findIndex(word => word.id === progress.selected);
          chooseWord(cell.words[(current + 1) % cell.words.length]);
        });
        control.className = 'library-cell';
        control.dataset.cell = key;
        control.classList.toggle('is-crossing', cell.words.length > 1);
        const starts = cell.words.filter(word => word.keys[0] === key);
        if (starts.length) control.append(element('small', starts.map(word => word.id).join('/')));
        const letter = element('span');
        control.append(letter);
        cellLetters.set(key, letter);
        cellButtons.set(key, control);
        control.addEventListener('keydown', event => {
          const movement = {ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1]}[event.key];
          if (!movement) return;
          event.preventDefault();
          let row = cell.row + movement[0], col = cell.col + movement[1];
          while (row >= 0 && col >= 0 && row < layout.rows && col < layout.columns) {
            const next = cellButtons.get(row + ',' + col);
            if (next) { next.focus(); break; }
            row += movement[0];
            col += movement[1];
          }
        });
        grid.append(control);
      }
    }
    scroll.append(grid);
    for (const word of words) {
      const control = button('', () => chooseWord(word));
      control.className = 'library-word';
      control.dataset.word = word.id;
      control.append(element('span', word.id + '. ' + word.question), element('small', '', 'library-word-state'));
      wordButtons.set(word.id, control);
      questions.append(control);
    }
    const navigation = element('div', undefined, 'library-actions');
    navigation.append(button('Вернуться в библиотеку', showLibrary), backToMap());
    body.append(counter, form, ready, element('p', 'Введи ответ целиком. Точки обозначают пустые клетки. Выбери вопрос ниже или коснись слова в сетке. На пересечении повторное касание меняет направление. На узком экране сетку можно прокрутить вбок.', 'library-note'),
      scroll, questions, navigation);
    chooseWord(selectedWord(), false);
  }

  return {
    // Every entrance goes through the illustrated room, including archive visits.
    open: showLibrary,
    clearView() {
      clearTimeout(loveTimer);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
      panel.style.removeProperty('--library-view-height');
      panel.style.removeProperty('--library-view-top');
      panel.classList.remove('library-panel', 'library-crossword');
    },
    reset() {
      clearTimeout(loveTimer);
      progress = freshProgress();
      try { localStorage.removeItem(storageKey); }
      catch { /* The page is already reset in memory. */ }
    }
  };
}

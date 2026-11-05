'use strict';

function createLettersMission({panel, body, title, kicker, closeButton, element, button, isCompleted, archive}) {
  const storageKey = 'lovequest.chapter04.letters.v1';
  const mysteryPhoto = 'assets/mission-001/letter-mystery.jpg';
  const revealedPhoto = 'assets/mission-001/letter-revealed.jpg';
  const caption = '24 июля 2025 года. Санкт-Петербург. Письмо, которое потерялось по дороге, но не потеряло своего смысла';
  const questions = [
    {
      title: 'Где и когда было написано это письмо?',
      options: [
        '25 июля 2025 года, Санкт-Петербург (Царское Село)',
        '24 июля 2025 года, Санкт-Петербург (Царское Село)',
        '24 июня 2025 года, Санкт-Петербург (Царское Село)',
        '24 июля 2025 года, Калининград'
      ],
      correct: 1,
      hint: 'Присмотрись к печатным деталям открытки и вспомни, в какой день поездки было время написать письмо.',
      reply: 'Да, у письма снова есть место и день. Как тепло вспомнить эту поездку.'
    },
    {
      title: 'Когда мы впервые поцеловались?',
      options: ['12 июля 2025 года', '14 июня 2025 года', '12 июня 2025 года', '10 июня 2025 года'],
      correct: 2,
      hint: 'Вспомни день целиком. Что было перед поцелуем и чем он отличался от соседних дней?',
      reply: 'Да, тот самый день. Есть мгновения, к которым хочется возвращаться.'
    },
    {
      title: 'Кто из моего окружения первым познакомился с тобой?',
      options: ['Соня', 'Влад', 'Папа Марка', 'Сёстры Марка'],
      correct: 0,
      hint: 'Вспомни самое раннее знакомство. Где вы были и по какому поводу собрались?',
      reply: 'Именно так. Все три воспоминания на месте. Теперь можно прочитать письмо.'
    }
  ];

  let answered = readProgress();
  let started = answered > 0;
  let zoomReturn = null;

  function readProgress() {
    try {
      const count = JSON.parse(localStorage.getItem(storageKey));
      if (Number.isInteger(count) && count >= 0 && count <= questions.length) return count;
    } catch { /* The current tab can still hold progress in memory. */ }
    return 0;
  }

  function saveProgress() {
    try { localStorage.setItem(storageKey, JSON.stringify(answered)); }
    catch { /* Keep the in-memory state when storage is unavailable. */ }
  }

  function clearView() {
    zoomReturn = null;
    panel.classList.remove('letters-panel', 'letters-zoom');
    closeButton.setAttribute('aria-label', 'Закрыть окно');
  }

  function setScreen(heading, label = 'Дом воспоминаний · Дело 001') {
    panel.classList.add('letters-panel');
    title.textContent = heading;
    title.tabIndex = -1;
    kicker.textContent = label;
    body.replaceChildren();
    panel.scrollTop = 0;
    if (panel.open) title.focus({preventScroll: true});
  }

  function photo(revealed, onLoad) {
    const img = element('img', undefined, 'letter-photo');
    img.alt = revealed ? 'Открытка с рукописным посланием и сердечками' : 'Открытое письмо с закрытой рукописью';
    img.width = 1183;
    img.height = 887;
    if (onLoad) img.addEventListener('load', onLoad, {once: true});
    img.addEventListener('error', () => {
      const message = element('p', 'Фотография не загрузилась. Вернись на карту и попробуй открыть письмо снова.', 'letter-feedback');
      message.setAttribute('role', 'status');
      img.after(message);
    }, {once: true});
    img.src = revealed ? revealedPhoto : mysteryPhoto;
    return img;
  }

  function openZoom(revealed, restore) {
    if (revealed && answered !== questions.length) return;
    zoomReturn = restore;
    panel.classList.add('letters-zoom');
    closeButton.setAttribute('aria-label', 'Закрыть просмотр письма');
    setScreen('Открытка крупным планом');
    const viewport = element('div', undefined, 'letter-viewport');
    viewport.tabIndex = 0;
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-label', 'Просмотр фотографии');
    viewport.append(photo(revealed));
    const zoom = button('Увеличить', () => {
      const expanded = viewport.classList.toggle('is-expanded');
      zoom.textContent = expanded ? 'Показать целиком' : 'Увеличить';
      if (!expanded) viewport.scrollTo(0, 0);
    });
    body.append(zoom, viewport, button('Вернуться к письму', closeZoom));
  }

  function closeZoom() {
    if (!zoomReturn) return false;
    const restore = zoomReturn;
    zoomReturn = null;
    panel.classList.remove('letters-zoom');
    closeButton.setAttribute('aria-label', 'Закрыть окно');
    restore();
    body.querySelector('.letter-open-photo')?.focus({preventScroll: true});
    return true;
  }

  function photoButton(label, revealed, restore) {
    const control = button(label, () => openZoom(revealed, restore));
    control.classList.add('letter-open-photo');
    return control;
  }

  function backToMap() {
    return button('Вернуться на карту', () => panel.close());
  }

  function showIntro() {
    setScreen('Дело о потерянных письмах');
    const actions = element('div', undefined, 'letter-actions');
    actions.append(photoButton('Рассмотреть открытку', false, showIntro), button('Начать расследование письма', () => {
      started = true;
      showQuestion();
    }, true));
    body.append(element('p', 'В доме нашлось письмо, которое так и не дошло до адресата. Но его история ещё помнит несколько важных деталей'), photo(false), actions, backToMap());
  }

  function showQuestion() {
    const index = answered;
    const question = questions[index];
    setScreen(question.title, `Вопрос ${index + 1} из ${questions.length}`);
    const options = element('div', undefined, 'letter-options');
    const feedback = element('p', '', 'letter-feedback');
    feedback.setAttribute('role', 'status');
    question.options.forEach((option, choice) => options.append(button(option, () => {
      if (answered !== index) return;
      if (choice !== question.correct) {
        feedback.textContent = 'Почти. Попробуй вспомнить ещё одну деталь и выбери снова.';
        return;
      }
      answered++;
      saveProgress();
      showReply(question, index);
    })));
    const hint = element('details', undefined, 'letter-hint');
    hint.append(element('summary', 'Подсказка'), element('p', question.hint));
    body.append(options, feedback, hint);
    if (index === 0) body.append(photoButton('Рассмотреть открытку', false, showQuestion));
    body.append(backToMap());
  }

  function showReply(question, index) {
    setScreen(question.title, `Вопрос ${index + 1} из ${questions.length}`);
    const ready = answered === questions.length;
    body.append(element('p', question.reply, 'letter-reply'), button(ready ? 'Открыть письмо' : 'Следующий вопрос', ready ? showReveal : showQuestion, true), backToMap());
  }

  function showReveal() {
    if (answered !== questions.length) return;
    setScreen(isCompleted() ? 'Письмо из архива' : 'Письмо нашлось');
    const figure = element('figure', undefined, 'letter-figure');
    const actions = element('div', undefined, 'letter-actions');
    actions.append(photoButton('Увеличить фото', true, showReveal));
    let saveButton;
    if (!isCompleted()) {
      saveButton = button('Сохранить письмо в архиве', () => {
        if (answered !== questions.length || isCompleted()) return;
        if (!archive()) showReveal();
      }, true);
      saveButton.disabled = true;
      actions.append(saveButton);
    }
    figure.append(photo(true, () => { if (saveButton) saveButton.disabled = false; }), element('figcaption', caption));
    body.append(figure, actions, backToMap());
  }

  return {
    open() {
      if (answered === questions.length) showReveal();
      else if (started) showQuestion();
      else showIntro();
    },
    closeZoom,
    clearView,
    reset() {
      answered = 0;
      started = false;
      saveProgress();
    }
  };
}

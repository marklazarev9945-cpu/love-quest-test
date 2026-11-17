'use strict';

function createFinale({panel, body, title, kicker, element, button, fragments, isUnlocked}) {
  const storageKey = 'lovequest.chapter04.finale.v1';
  const letters = [
    {
      id: 'home', numeral: 'I', title: 'Вечер для нашей истории',
      paragraphs: [
        'Катёнок, приглашаю тебя на уютное домашнее свидание 29 ноября. Закажем что-нибудь вкусное, устроимся рядом и продолжим собирать наш настоящий фотоальбом. Будем выбирать фотографии, вспоминать поездки, первые свидания и решать, какие моменты обязательно должны остаться на его страницах.',
        'Только ты, я, вкусная еда и целый вечер для нас двоих ❤️'
      ]
    },
    {
      id: 'city', numeral: 'II', title: 'Свидание, которое я для нас придумал',
      paragraphs: [
        'Катёнок, приглашаю тебя на свидание в городе 29 ноября! Давай красиво оденемся, отправимся в Палату науки, погуляем по Белграду, а потом сходим в ресторан. Хочу, чтобы у нас был целый день для новых впечатлений, разговоров и вкусной еды.',
        'А все организационные хлопоты я с удовольствием возьму на себя ❤️'
      ]
    },
    {
      id: 'trip', numeral: 'III', title: 'Маленькое путешествие для нас двоих',
      paragraphs: [
        'Катёнок, а что, если устроить маленькое путешествие 29 ноября? Возьмём машину, включим любимую музыку и отправимся исследовать Сербию. Хочу провести с тобой целый день где-нибудь, где мы ещё не были.',
        'А направление выберешь ты: поедем отдыхать в термах на Fruške или отправимся в соседний Свилайнац, чтобы увидеть динозавров в Музее естественной истории.',
        'Какое бы направление ты ни выбрала, главная радость для меня — быть рядом с тобой ❤️'
      ]
    }
  ];
  const destinations = {thermal: 'Термы и отдых', paleontology: 'Палеонтологический музей'};
  const notifications = createFinaleNotifications();
  let progress = readProgress();
  let canSave = true;
  let activeDelivery = null;
  let deliveryView = null;
  let motionTimer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function freshProgress() {
    return {screen: 'phrase', read: [], openLetter: null, draft: {option: null, suboption: null},
      choice: null, delivery: null, endingSeen: false};
  }

  function readProgress() {
    const next = freshProgress();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || typeof saved !== 'object') return next;
      next.read = letters.filter(letter => Array.isArray(saved.read) && saved.read.includes(letter.id)).map(letter => letter.id);
      if (letters.some(letter => letter.id === saved.draft?.option)) {
        next.draft = {
          option: saved.draft.option,
          suboption: saved.draft.option === 'trip' && Object.hasOwn(destinations, saved.draft.suboption) ?
            saved.draft.suboption : null
        };
      }
      if (saved.screen === 'office') next.screen = 'office';
      if (saved.screen === 'letter' && letters.some(letter => letter.id === saved.openLetter)) {
        next.screen = 'letter';
        next.openLetter = saved.openLetter;
      }
      if (next.read.length === letters.length && ['choice', 'confirm'].includes(saved.screen)) {
        next.screen = saved.screen === 'confirm' && isFinaleChoice(next.draft) ? 'confirm' : 'choice';
      }
      if (next.read.length === letters.length && isFinaleSubmission(saved.choice)) {
        const {option, suboption, confirmedAt, submissionId} = saved.choice;
        next.choice = {option, suboption, confirmedAt, submissionId};
        next.delivery = ['pending', 'sent', 'failed'].includes(saved.delivery) ? saved.delivery : 'pending';
        // v0.1 went straight to the meeting after confirmation.
        next.endingSeen = saved.endingSeen !== false;
        next.screen = next.endingSeen ? 'ending' : 'sent';
      }
    } catch { /* The finale can also be played in memory. */ }
    return next;
  }

  function save() {
    const stored = readProgress();
    if (stored.choice && stored.choice.submissionId !== progress.choice?.submissionId) return;
    if (stored.delivery === 'sent') progress.delivery = 'sent';
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
      canSave = true;
    } catch {
      canSave = false;
    }
  }

  function screen(name, heading) {
    clearTimeout(motionTimer);
    deliveryView = null;
    progress.screen = name;
    save();
    panel.classList.add('finale-panel');
    title.textContent = heading;
    title.tabIndex = -1;
    kicker.textContent = 'LOVE QUEST · Последнее дело';
    body.replaceChildren();
    panel.scrollTop = 0;
    if (panel.open) title.focus({preventScroll: true});
  }

  function backToMap(label = 'Вернуться на карту') {
    return button(label, () => panel.close());
  }

  function actions(...controls) {
    const group = element('div', undefined, 'finale-actions');
    group.append(...controls);
    body.append(group);
  }

  function afterMotion(view, delay, finish) {
    clearTimeout(motionTimer);
    motionTimer = setTimeout(() => {
      if (view.isConnected && panel.open) finish();
    }, delay);
  }

  function makeEnvelope(numeral) {
    const mail = element('div', undefined, 'finale-mail');
    mail.setAttribute('aria-hidden', 'true');
    mail.append(
      element('span', undefined, 'finale-mail-back'),
      element('span', undefined, 'finale-mail-flap'),
      element('span', numeral, 'finale-mail-slip'),
      element('span', undefined, 'finale-mail-pocket'),
      element('span', '♥', 'finale-mail-seal')
    );
    return mail;
  }

  function showPhrase() {
    screen('phrase', 'Послание собрано');
    const phrase = element('p', undefined, 'finale-phrase');
    fragments.forEach((word, index) => {
      if (index) phrase.append(' ');
      const slip = element('span', word);
      slip.style.setProperty('--slip-delay', index * 105 + 'ms');
      phrase.append(slip);
    });
    body.append(phrase);
    actions(button('Открыть последнее дело', () => showOffice(), true), backToMap());
  }

  function showOffice(focusId) {
    screen('office', 'Последняя комната');
    const scene = element('div', undefined, 'finale-office');
    const picture = element('img');
    picture.src = 'assets/finale/office.svg';
    picture.alt = 'Тёплый кабинет с лампой, семейными рисунками и тремя конвертами на столе';
    picture.width = 640;
    picture.height = 420;
    const desk = element('div', undefined, 'finale-desk');
    let focusTarget;
    for (const letter of letters) {
      const read = progress.read.includes(letter.id);
      const envelope = button(letter.numeral, () => showLetter(letter.id, true));
      envelope.className = 'finale-envelope' + (read ? ' is-read' : '');
      envelope.setAttribute('aria-label', letter.numeral + '. ' + letter.title + (read ? '. Перечитать' : '. Открыть письмо'));
      if (letter.id === focusId) focusTarget = envelope;
      desk.append(envelope);
    }
    scene.append(picture, desk);
    if (!progress.choice) {
      body.append(element('p', 'Все шесть дел раскрыты. И теперь понятно, что свидание вовсе не пропало — я просто приготовил для тебя кое-что особенное. Перед тобой три письма. Прочитай каждое и выбери, какое приключение ждёт нас следующим.'));
    }
    body.append(scene);
    if (progress.choice) {
      actions(button('Вернуться к финалу', showResult, true), backToMap());
    } else {
      const allRead = progress.read.length === letters.length;
      body.append(element('p', allRead ?
        'Теперь ты знаешь все три варианта. Выбирай тот, который хочется больше всего. А остальные мы обязательно сможем осуществить в другой раз.' :
        'Прочитано писем: ' + progress.read.length + ' из 3.', 'finale-note'));
      const choose = button('Выбрать свидание', showChoice, true);
      choose.disabled = !allRead;
      actions(choose, backToMap());
    }
    focusTarget?.focus({preventScroll: true});
  }

  function showLetter(id, animate = false) {
    const letter = letters.find(item => item.id === id);
    if (!letter) return showOffice();
    progress.openLetter = id;
    screen('letter', letter.title);
    const stack = element('div', undefined, 'finale-letter-stack' + (animate ? ' is-opening' : ''));
    const stage = element('div', undefined, 'finale-letter-stage');
    stage.append(makeEnvelope(letter.numeral));
    const paper = element('article', undefined, 'finale-letter');
    for (const paragraph of letter.paragraphs) paper.append(element('p', paragraph));
    stack.append(stage, paper);
    body.append(stack);
    actions(button(progress.read.includes(id) ? 'К письмам' : 'Письмо прочитано', () => {
      if (stack.classList.contains('is-closing')) return;
      if (!progress.read.includes(id)) progress.read.push(id);
      progress.screen = 'office';
      progress.openLetter = null;
      save();
      if (reducedMotion.matches) return showOffice(id);
      stack.classList.remove('is-opening');
      stack.classList.add('is-closing');
      title.focus({preventScroll: true});
      panel.scrollTop = 0;
      afterMotion(stack, 470, () => showOffice(id));
    }, true), backToMap());
  }

  function choiceCard(selection) {
    const card = element('div', undefined, 'finale-choice-card');
    card.append(element('strong', letters.find(letter => letter.id === selection.option).title));
    if (selection.suboption) card.append(element('span', destinations[selection.suboption]));
    return card;
  }

  function showChoice() {
    if (progress.choice) return showResult();
    if (progress.read.length !== letters.length) return showOffice();
    screen('choice', 'Выбери свидание');
    const options = element('fieldset', undefined, 'finale-options');
    options.append(element('legend', 'Приглашение'));
    const directions = element('fieldset', undefined, 'finale-options');
    directions.append(element('legend', 'Направление путешествия'));
    const next = button('Я выбираю это приключение', showConfirmation, true);

    function syncChoice() {
      directions.hidden = progress.draft.option !== 'trip';
      directions.disabled = directions.hidden;
      next.disabled = !isFinaleChoice(progress.draft);
      save();
    }

    function radio(name, value, label, checked, change) {
      const row = element('label', undefined, 'finale-radio');
      const input = element('input');
      input.type = 'radio';
      input.name = name;
      input.value = value;
      input.checked = checked;
      input.addEventListener('change', () => {
        change();
        syncChoice();
      });
      row.append(input, element('span', label));
      return row;
    }

    for (const letter of letters) {
      options.append(radio('finale-option', letter.id, letter.numeral + '. ' + letter.title,
        progress.draft.option === letter.id, () => {
          progress.draft.option = letter.id;
          if (letter.id !== 'trip') {
            progress.draft.suboption = null;
            directions.querySelectorAll('input').forEach(input => { input.checked = false; });
          }
        }));
    }
    for (const [id, label] of Object.entries(destinations)) {
      directions.append(radio('finale-destination', id, label, progress.draft.suboption === id,
        () => { progress.draft.suboption = id; }));
    }
    syncChoice();
    body.append(options, directions);
    actions(next, button('К письмам', () => showOffice()));
  }

  function showConfirmation() {
    if (progress.choice) return showResult();
    if (!isFinaleChoice(progress.draft)) return showChoice();
    screen('confirm', 'Ну что, Катёнок, отправим твой выбор организатору этого расследования?');
    body.append(choiceCard(progress.draft));
    const confirm = button('Отправить мой выбор ❤️', async () => {
      confirm.disabled = true;
      // Where available, serialize confirmations from two tabs of the same game.
      const commit = () => {
        if (!confirm.isConnected || !panel.open || !isUnlocked() ||
            progress.screen !== 'confirm' || !isFinaleChoice(progress.draft)) return;
        adoptConfirmedChoice();
        if (progress.choice) return showResult();
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        const submissionId = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
        progress.choice = {...progress.draft, confirmedAt: new Date().toISOString(), submissionId};
        progress.delivery = 'pending';
        progress.endingSeen = false;
        showDispatch();
        void deliver();
      };
      if (navigator.locks) {
        try { await navigator.locks.request(storageKey, commit); }
        catch { if (confirm.isConnected) commit(); }
      } else commit();
    }, true);
    actions(confirm, button('Ещё подумать', showChoice));
  }

  function adoptConfirmedChoice() {
    if (progress.choice) return;
    const saved = readProgress();
    if (saved.choice) progress = saved;
  }

  function updateDelivery() {
    if (!deliveryView?.text.isConnected) return;
    const sending = activeDelivery === progress.choice?.submissionId;
    const messages = {
      pending: sending ? 'Отправляем ответ…' : 'Подтверждение доставки ещё не получено.',
      sent: 'Ответ доставлен.',
      failed: 'Ответ сохранён. Доставить его пока не удалось.'
    };
    deliveryView.text.textContent = notifications.enabled ? messages[progress.delivery] : 'Выбор сохранён в этом браузере.';
    if (!canSave) deliveryView.text.textContent = 'Браузер не разрешил сохранить выбор. Он доступен в этой вкладке.';
    deliveryView.retry.hidden = !notifications.enabled || !canSave || sending || progress.delivery === 'sent';
  }

  async function deliver() {
    const choice = progress.choice;
    if (!notifications.enabled || !canSave || !choice || progress.delivery === 'sent' || activeDelivery) return;
    activeDelivery = choice.submissionId;
    progress.delivery = 'pending';
    save();
    if (progress.delivery === 'sent') {
      activeDelivery = null;
      updateDelivery();
      return;
    }
    updateDelivery();
    const outcome = await notifications.send(choice);
    if (activeDelivery === choice.submissionId) activeDelivery = null;
    if (progress.choice?.submissionId !== choice.submissionId || !outcome) return;
    progress.delivery = outcome;
    save();
    updateDelivery();
  }

  function showDispatch() {
    if (reducedMotion.matches) return showSent();
    // Persist the destination, so reopening never repeats the dispatch.
    screen('sent', 'Запечатываем письмо');
    const stage = element('div', undefined, 'finale-dispatch');
    stage.append(makeEnvelope(letters.find(letter => letter.id === progress.choice.option).numeral));
    body.append(stage);
    actions(button('К приглашению', showSent, true), backToMap());
    afterMotion(stage, 1120, showSent);
  }

  function showSent() {
    screen('sent', 'Твой выбор сделан ❤️');
    const stage = element('div', undefined, 'finale-sent-envelope');
    stage.append(makeEnvelope(letters.find(letter => letter.id === progress.choice.option).numeral));
    body.append(stage, choiceCard(progress.choice));
    showDelivery();
    actions(button('Открыть последнюю дверь', () => showEnding(true), true),
      button('Перечитать письма', () => showOffice()), backToMap());
  }

  function showResult() {
    if (progress.endingSeen) showEnding(false);
    else showSent();
  }

  function showDelivery() {
    const status = element('p', undefined, 'finale-note');
    status.setAttribute('role', 'status');
    const retry = button('Повторить отправку', () => void deliver());
    deliveryView = {text: status, retry};
    body.append(status, retry);
    updateDelivery();
  }

  function showEnding(animate) {
    if (!progress.choice) return showChoice();
    progress.endingSeen = true;
    screen('ending', 'Четыре месяца как муж и жена ❤️');
    const scene = element('div', undefined, 'finale-ending-scene' + (animate ? ' is-animated' : ''));
    scene.innerHTML = FINALE_ENDING_ART;
    const greeting = element('div', undefined, 'finale-greeting');
    greeting.append(element('p', 'Спасибо тебе за эти четыре месяца. И за каждый день, который мы проживаем вместе.'), element('p', 'Люблю тебя бесконечно. Твой муж ❤️'));
    const choice = choiceCard(progress.choice);
    choice.prepend(element('span', 'Твой выбор', 'eyebrow'));
    body.append(scene, greeting, choice);
    showDelivery();
    actions(backToMap('Вернуться к воспоминаниям'),
      button('Посмотреть ещё раз', () => showEnding(true), true),
      button('Перечитать письма', () => showOffice()));
  }

  return {
    open() {
      if (!isUnlocked()) return;
      adoptConfirmedChoice();
      if (progress.choice) return showResult();
      if (progress.screen === 'office') return showOffice();
      if (progress.screen === 'letter') return showLetter(progress.openLetter);
      if (progress.screen === 'choice') return showChoice();
      if (progress.screen === 'confirm') return showConfirmation();
      showPhrase();
    },
    clearView() {
      clearTimeout(motionTimer);
      deliveryView = null;
      panel.classList.remove('finale-panel');
    },
    reset() {
      clearTimeout(motionTimer);
      notifications.cancel();
      activeDelivery = null;
      progress = freshProgress();
      try { localStorage.removeItem(storageKey); }
      catch { /* Keep the reset in memory when storage is unavailable. */ }
    }
  };
}

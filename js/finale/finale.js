'use strict';

function createFinale({panel, body, title, kicker, element, button, fragments, isUnlocked}) {
  const storageKey = 'lovequest.chapter04.finale.v1';
  const letters = [
    {
      id: 'home', numeral: 'I', title: 'Вечер, который останется на страницах',
      text: 'Заказываем что-нибудь очень вкусное, устраиваемся поудобнее и наконец собираем наш фотоальбом. Вспоминаем поездки, смешные моменты, первые свидания и всё, что привело нас к сегодняшнему дню.'
    },
    {
      id: 'city', numeral: 'II', title: 'Свидание вне привычного маршрута',
      text: 'Наряжаемся, выбираемся из дома и идём туда, где ещё не были вместе. Идём гулять по центру, посещаем музей и вечером идём в ресторан.'
    },
    {
      id: 'trip', numeral: 'III', title: 'Туда, где нас ещё не было',
      text: 'Берём машину, включаем любимую музыку и отправляемся в маленькое путешествие. Едем за новым досугом, гуляем в городе и вкусно ужинаем. А вот место ты выберешь сама из двух.'
    }
  ];
  const destinations = {thermal: 'Термы и отдых', paleontology: 'Палеонтологический музей'};
  const notifications = createFinaleNotifications();
  let progress = readProgress();
  let canSave = true;
  let activeDelivery = null;
  let deliveryView = null;

  function freshProgress() {
    return {screen: 'phrase', read: [], openLetter: null, draft: {option: null, suboption: null},
      choice: null, delivery: null};
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
        next.screen = 'ending';
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
      body.append(element('p', 'Расследование завершено. Но у этого дела оказалось сразу три продолжения. Перед тобой три письма. Открой каждое — и выбери, какую историю мы напишем следующей.'));
    }
    body.append(scene);
    if (progress.choice) {
      actions(button('Вернуться к финалу', () => showEnding(false), true), backToMap());
    } else {
      const allRead = progress.read.length === letters.length;
      body.append(element('p', allRead ?
        'Все приглашения прочитаны. Осталось выбрать только одно. Хотя, между нами, остальные никуда не исчезнут.' :
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
    const paper = element('article', undefined, 'finale-letter' + (animate ? ' finale-unfold' : ''));
    paper.append(element('p', letter.text));
    body.append(paper);
    actions(button(progress.read.includes(id) ? 'К письмам' : 'Письмо прочитано', () => {
      if (!progress.read.includes(id)) progress.read.push(id);
      showOffice(id);
    }, true), backToMap());
  }

  function choiceCard(selection) {
    const card = element('div', undefined, 'finale-choice-card');
    card.append(element('strong', letters.find(letter => letter.id === selection.option).title));
    if (selection.suboption) card.append(element('span', destinations[selection.suboption]));
    return card;
  }

  function showChoice() {
    if (progress.choice) return showEnding(false);
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
    if (progress.choice) return showEnding(false);
    if (!isFinaleChoice(progress.draft)) return showChoice();
    screen('confirm', 'Отправить ответ организатору расследования?');
    body.append(choiceCard(progress.draft));
    const confirm = button('Отправить приглашение', async () => {
      confirm.disabled = true;
      // Where available, serialize confirmations from two tabs of the same game.
      const commit = () => {
        if (!confirm.isConnected || !panel.open || !isUnlocked() ||
            progress.screen !== 'confirm' || !isFinaleChoice(progress.draft)) return;
        adoptConfirmedChoice();
        if (progress.choice) return showEnding(false);
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        const submissionId = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
        progress.choice = {...progress.draft, confirmedAt: new Date().toISOString(), submissionId};
        progress.delivery = 'pending';
        showEnding(true);
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

  function showEnding(animate) {
    if (!progress.choice) return showChoice();
    screen('ending', 'Четыре месяца как муж и жена ❤️');
    const scene = element('div', undefined, 'finale-ending-scene' + (animate ? ' is-animated' : ''));
    scene.innerHTML = FINALE_ENDING_ART;
    const greeting = element('div', undefined, 'finale-greeting');
    greeting.append(element('p', 'Спасибо за наши четыре месяца.'), element('p', 'Я люблю тебя. Твой муж ❤️'));
    const choice = choiceCard(progress.choice);
    choice.prepend(element('span', 'Твой выбор', 'eyebrow'));
    const status = element('p', undefined, 'finale-note');
    status.setAttribute('role', 'status');
    const retry = button('Повторить отправку', () => void deliver());
    deliveryView = {text: status, retry};
    body.append(scene, greeting, choice, status, retry);
    updateDelivery();
    actions(backToMap('Вернуться к воспоминаниям'),
      button('Посмотреть ещё раз', () => showEnding(true), true),
      button('Перечитать письма', () => showOffice()));
  }

  return {
    open() {
      if (!isUnlocked()) return;
      adoptConfirmedChoice();
      if (progress.choice) return showEnding(false);
      if (progress.screen === 'office') return showOffice();
      if (progress.screen === 'letter') return showLetter(progress.openLetter);
      if (progress.screen === 'choice') return showChoice();
      if (progress.screen === 'confirm') return showConfirmation();
      showPhrase();
    },
    clearView() {
      deliveryView = null;
      panel.classList.remove('finale-panel');
    },
    reset() {
      notifications.cancel();
      activeDelivery = null;
      progress = freshProgress();
      try { localStorage.removeItem(storageKey); }
      catch { /* Keep the reset in memory when storage is unavailable. */ }
    }
  };
}

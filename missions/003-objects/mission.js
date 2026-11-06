'use strict';

function createObjectsMission({panel, body, title, kicker, element, button, isCompleted, archive}) {
  const storageKey = 'lovequest.chapter04.objects.v1';
  // Coordinates are in the same 440 × 420 space as office.svg.
  const objects = [
    {
      id: 'ring', x: 235, y: 266, name: 'Кольцо с бриллиантом',
      story: 'Некоторые обещания помещаются в маленькой коробочке. Но значат гораздо больше.',
      art: '<rect x="12" y="5" width="40" height="33" rx="7" fill="#795567" stroke="#61434f" stroke-width="2"/><rect x="16" y="9" width="32" height="25" rx="5" fill="#a87582"/><path d="M12 35h40v8q0 7-6 7H18q-6 0-6-7z" fill="#a17180" stroke="#61434f" stroke-width="2"/><path d="M16 37h32" stroke="#d2a1a4" stroke-width="2"/><circle cx="32" cy="30" r="8" fill="none" stroke="#f9d080" stroke-width="4"/><path d="m24 22 4-7h8l4 7-8 7z" fill="#dcf3ed" stroke="#617f7a" stroke-width="1.5"/><path d="M24 22h16m-12-7 4 14 4-14" fill="none" stroke="#93bcb5"/>'
    },
    {
      id: 'book', x: 347, y: 121, name: 'Книга, подаренная Катей',
      story: 'Есть подарки, которые хочется перечитывать. Особенно когда они от любимого человека.',
      art: '<g transform="rotate(9 32 27)"><rect x="15" y="6" width="33" height="43" rx="3" fill="#596f69" stroke="#40574f" stroke-width="2"/><path d="M20 9h25v35H20z" fill="#768d83"/><path d="M20 44h27v4H20q-3-2 0-4" fill="#eee0b7"/><path d="M20 9v34m6-31h15v27H26z" fill="none" stroke="#d6be8c"/><path d="M28 26q-2-5 3-5l3 3q4-6 7-2 2 4-7 9z" fill="#d9b199"/><path d="M38 46v7l3-2 3 2v-7" fill="#b97968"/></g>'
    },
    {
      id: 'cuffs', x: 322, y: 298, name: 'Игрушечные наручники',
      story: 'У каждой пары есть свои секретные шутки. Эта улика — явно не для протокола 😉',
      art: '<path d="m24 25 5-4 5 5-4 5m2-5 5-2 4 6-4 4" fill="none" stroke="#605e73" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="15" cy="19" rx="10" ry="11" fill="none" stroke="#615e77" stroke-width="6"/><ellipse cx="48" cy="34" rx="10" ry="11" fill="none" stroke="#615e77" stroke-width="6"/><ellipse cx="15" cy="19" rx="10" ry="11" fill="none" stroke="#ad9cbd" stroke-width="3.5"/><ellipse cx="48" cy="34" rx="10" ry="11" fill="none" stroke="#ad9cbd" stroke-width="3.5"/><path d="m20 22 7 4-3 6-7-4m25-5-7 3 3 6 7-3" fill="#c9b7d1" stroke="#615e77" stroke-width="1.5"/>'
    },
    {
      id: 'car', x: 83, y: 240, name: 'Игрушечная машинка',
      story: 'Сколько дорог уже позади. И сколько ещё приключений впереди — вместе.',
      art: '<path d="M5 38v-9l9-4 9-11h18l10 11 8 5v8z" fill="#b96f5e" stroke="#855649" stroke-width="2"/><path d="m20 25 6-8h6v8zm15 0v-8h5l8 8z" fill="#d0e4df"/><path d="M7 31h49" stroke="#e2a78e" stroke-width="2"/><path d="M55 32h4" stroke="#f7dfa0" stroke-width="3"/><circle cx="16" cy="39" r="7" fill="#504b4b"/><circle cx="48" cy="39" r="7" fill="#504b4b"/><circle cx="16" cy="39" r="3" fill="#e4c8a8"/><circle cx="48" cy="39" r="3" fill="#e4c8a8"/>'
    },
    {
      id: 'album', x: 112, y: 345, name: 'Фотоальбом, сделанный своими руками',
      story: 'Самые ценные страницы — те, на которых хранится наша история.',
      art: '<g transform="rotate(-12 32 27)"><rect x="8" y="9" width="49" height="38" rx="4" fill="#b58262" stroke="#805e48" stroke-width="2"/><path d="M12 12h42v30H12z" fill="#e1b692"/><path d="M13 15v24m-4-21h8m-8 14h8m-8 6h8" stroke="#875f48" stroke-width="2" stroke-linecap="round"/><path d="m23 17 21-3 3 20-21 3z" fill="#fff0d6" stroke="#b08768"/><path d="m26 30 6-7 5 4 4-3 3 7-17 3z" fill="#8ca68d"/><path d="m22 17 8-2m10 20 8-2" stroke="#d1957e" stroke-width="3" stroke-linecap="round"/><path d="m45 13 9 11m0-11-9 11" stroke="#b77c66" stroke-width="2"/></g>'
    }
  ];
  const intro = 'В этом кабинете спрятаны предметы, которые постороннему покажутся обычными. Но ты знаешь, почему они важны. Найди все пять улик.';
  let found = readFound();
  let hintTimer;
  let hintedButton;

  function readFound() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved)) {
        return new Set(objects.filter(object => saved.includes(object.id)).map(object => object.id));
      }
    } catch { /* Play continues in memory when browser storage is unavailable. */ }
    return new Set();
  }

  function remember(id) {
    found.add(id);
    try { localStorage.setItem(storageKey, JSON.stringify([...found])); }
    catch { /* Keep the discoveries in memory for this tab. */ }
  }

  function clearHint() {
    clearTimeout(hintTimer);
    hintedButton?.classList.remove('is-hinted');
    hintedButton = null;
  }

  function clearView() {
    clearHint();
    panel.classList.remove('objects-panel');
  }

  function open() {
    const completed = isCompleted();
    panel.classList.add('objects-panel');
    title.textContent = completed ? 'Улики из архива' : 'Пять вещей. Пять историй.';
    title.tabIndex = -1;
    kicker.textContent = 'Детективное бюро · Дело 003';

    const scene = element('div', undefined, 'objects-scene');
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', 'Детективный кабинет');
    const illustration = element('img', undefined, 'objects-office');
    illustration.src = 'assets/mission-003/office.svg';
    illustration.alt = '';
    illustration.width = 440;
    illustration.height = 420;
    scene.append(illustration);

    const story = element('section', undefined, 'objects-story');
    story.hidden = true;
    const storyTitle = element('h3');
    storyTitle.tabIndex = -1;
    const storyText = element('p');
    let storyOrigin;
    const backToSearch = button('Вернуться к сцене', () => {
      story.hidden = true;
      storyOrigin.focus();
    });
    story.append(storyTitle, storyText, backToSearch);

    const finish = element('section', undefined, 'objects-finish');
    finish.append(
      element('h3', 'Все пять улик найдены'),
      element('p', 'Теперь эти истории можно сохранить в архиве дела.'),
      button('Сохранить улики в архиве', () => {
        if (found.size === objects.length && !isCompleted()) archive();
      }, true)
    );

    const count = element('h3');
    const checklist = element('ul', undefined, 'objects-checklist');
    const status = element('p', undefined, 'sr-only');
    status.setAttribute('role', 'status');
    const controls = [];
    const rows = [];

    function update() {
      const total = completed ? objects.length : found.size;
      count.textContent = `Находки · ${total}/${objects.length}`;
      objects.forEach((object, index) => {
        const known = completed || found.has(object.id);
        controls[index].classList.toggle('is-found', known);
        controls[index].setAttribute('aria-label', known ? `${object.name}. Читать историю` : `Рассмотреть предмет ${index + 1}`);
        rows[index].classList.toggle('is-found', known);
        rows[index].textContent = known ? object.name : `Улика ${index + 1} ещё не найдена`;
      });
      finish.hidden = completed || total !== objects.length;
    }

    function inspect(object, control) {
      if (!completed && !found.has(object.id)) {
        remember(object.id);
        update();
        status.textContent = `Найдена улика. ${found.size} из ${objects.length}.`;
      }
      if (hintedButton === control) {
        clearHint();
        hintText.textContent = '';
      }
      storyOrigin = control;
      storyTitle.textContent = object.name;
      storyText.textContent = object.story;
      story.hidden = false;
      storyTitle.focus();
    }

    objects.forEach((object, index) => {
      const control = button('', () => inspect(object, control));
      control.className = 'objects-clue';
      control.style.left = `${object.x * 100 / 440}%`;
      control.style.top = `${object.y * 100 / 420}%`;
      control.dataset.object = object.id;
      control.innerHTML = `<svg viewBox="0 0 64 54" aria-hidden="true" focusable="false">${object.art}</svg>`;
      controls.push(control);
      scene.append(control);
      const row = element('li');
      rows.push(row);
      checklist.append(row);
    });

    const hintText = element('p', undefined, 'objects-hint-text');
    hintText.setAttribute('role', 'status');
    const hint = button('Нужна помощь?', () => {
      clearHint();
      const next = objects.findIndex(object => !found.has(object.id));
      if (next === -1) {
        hintText.textContent = 'Все улики найдены. Сохрани их в архиве.';
        return;
      }
      hintedButton = controls[next];
      hintedButton.classList.add('is-hinted');
      hintText.textContent = `Предмет ${next + 1} на сцене подсвечен на несколько секунд.`;
      const target = hintedButton.getBoundingClientRect();
      if (target.top < kicker.parentElement.getBoundingClientRect().bottom ||
          target.bottom > panel.getBoundingClientRect().bottom) {
        hintedButton.scrollIntoView({block: 'center', behavior: 'auto'});
      }
      hintTimer = setTimeout(() => {
        clearHint();
        hintText.textContent = '';
      }, 2500);
    });
    const actions = element('div', undefined, 'objects-actions');
    if (!completed) actions.append(hint);
    actions.append(button('Вернуться на карту', () => panel.close()));
    body.append(
      element('p', completed ? 'Все пять историй на месте. Нажми на любой предмет, чтобы перечитать его историю.' : intro),
      scene, actions, hintText, story, finish, count, checklist, status
    );
    update();
  }

  return {
    open,
    clearView,
    reset() {
      found.clear();
      try { localStorage.removeItem(storageKey); }
      catch { /* The discoveries are already reset in memory. */ }
    }
  };
}

'use strict';

function createObjectsMission({panel, body, title, kicker, element, button, isCompleted, archive}) {
  const storageKey = 'lovequest.chapter04.objects.v1';
  // Coordinates are in the same 440 × 420 space as office.svg.
  const objects = [
    {
      id: 'ring', x: 246, y: 247, name: 'Кольцо с бриллиантом',
      story: 'Маленькая коробочка, одно кольцо и вопрос, к которому я так долго готовился.',
      art: '<rect x="12" y="5" width="40" height="33" rx="7" fill="#795567" stroke="#61434f" stroke-width="2"/><rect x="16" y="9" width="32" height="25" rx="5" fill="#a87582"/><path d="M12 35h40v8q0 7-6 7H18q-6 0-6-7z" fill="#a17180" stroke="#61434f" stroke-width="2"/><path d="M16 37h32" stroke="#d2a1a4" stroke-width="2"/><circle cx="32" cy="30" r="8" fill="none" stroke="#f9d080" stroke-width="4"/><path d="m24 22 4-7h8l4 7-8 7z" fill="#dcf3ed" stroke="#617f7a" stroke-width="1.5"/><path d="M24 22h16m-12-7 4 14 4-14" fill="none" stroke="#93bcb5"/>'
    },
    {
      id: 'book', x: 346, y: 126, name: 'Книга, подаренная Катей',
      story: 'Эта книга особенная не только из-за того, что написано внутри. Она особенная, потому что её подарила мне ты.',
      art: '<path d="M12 48V10h11v38m1 0V6h13v42m2 0V13h11v35" fill="#aa977d" stroke="#725d51" stroke-width="2"/><path d="M25 8h11v38H25z" fill="#788876"/><path d="m27 23 3 4 4-4-4-3Z" fill="#edc6a2"/><path d="M14 15h7m-7 28h7m20-24h7m-7 22h7" stroke="#d8c7a3"/><path d="M8 49h47" stroke="#b88e70" stroke-width="4"/>'
    },
    {
      id: 'cuffs', x: 326, y: 293, name: 'Игрушечные наручники',
      story: 'Некоторые подробности нашей истории лучше оставить за закрытой дверью детективного бюро. Но мы-то с тобой всё прекрасно помним 😉',
      art: '<path d="m24 25 5-4 5 5-4 5m2-5 5-2 4 6-4 4" fill="none" stroke="#605e73" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="15" cy="19" rx="10" ry="11" fill="none" stroke="#615e77" stroke-width="6"/><ellipse cx="48" cy="34" rx="10" ry="11" fill="none" stroke="#615e77" stroke-width="6"/><ellipse cx="15" cy="19" rx="10" ry="11" fill="none" stroke="#ad9cbd" stroke-width="3.5"/><ellipse cx="48" cy="34" rx="10" ry="11" fill="none" stroke="#ad9cbd" stroke-width="3.5"/><path d="m20 22 7 4-3 6-7-4m25-5-7 3 3 6 7-3" fill="#c9b7d1" stroke="#615e77" stroke-width="1.5"/>'
    },
    {
      id: 'car', x: 85, y: 258, name: 'Игрушечная машинка',
      story: 'У нас уже столько совместных дорог и приключений. И я очень хочу, чтобы впереди их было ещё больше. Главное — с тобой рядом.',
      art: '<path d="M5 38v-9l9-4 9-11h18l10 11 8 5v8z" fill="#b96f5e" stroke="#855649" stroke-width="2"/><path d="m20 25 6-8h6v8zm15 0v-8h5l8 8z" fill="#d0e4df"/><path d="M7 31h49" stroke="#e2a78e" stroke-width="2"/><path d="M55 32h4" stroke="#f7dfa0" stroke-width="3"/><circle cx="16" cy="39" r="7" fill="#504b4b"/><circle cx="48" cy="39" r="7" fill="#504b4b"/><circle cx="16" cy="39" r="3" fill="#e4c8a8"/><circle cx="48" cy="39" r="3" fill="#e4c8a8"/>'
    },
    {
      id: 'album', x: 109, y: 350, name: 'Фотоальбом, сделанный своими руками',
      story: 'Самые ценные страницы — те, на которых хранится наша история.',
      art: '<g transform="rotate(-12 32 27)"><rect x="8" y="9" width="49" height="38" rx="4" fill="#b58262" stroke="#805e48" stroke-width="2"/><path d="M12 12h42v30H12z" fill="#e1b692"/><path d="M13 15v24m-4-21h8m-8 14h8m-8 6h8" stroke="#875f48" stroke-width="2" stroke-linecap="round"/><path d="m23 17 21-3 3 20-21 3z" fill="#fff0d6" stroke="#b08768"/><path d="m26 30 6-7 5 4 4-3 3 7-17 3z" fill="#8ca68d"/><path d="m22 17 8-2m10 20 8-2" stroke="#d1957e" stroke-width="3" stroke-linecap="round"/><path d="m45 13 9 11m0-11-9 11" stroke="#b77c66" stroke-width="2"/></g><path d="M3 45q22 4 58-5l2 8-58 6Z" fill="#9cac8c"/>'
    }
  ];
  const hidingPlaces = {
    ring: {
      label: 'Открыть шкатулку',
      area: 'Осмотри письменный стол возле лампы.',
      cover: '<ellipse cx="32" cy="42" rx="23" ry="5" fill="#815b4430"/><path d="M13 23h38v18H13z" fill="#976778" stroke="#684b58" stroke-width="2"/><path d="m10 23 6-10h32l6 10-3 6H13Z" fill="#ac7d89" stroke="#684b58" stroke-width="2"/><path d="M29 28h7v6h-7z" fill="#ead19e"/>'
    },
    book: {label: 'Осмотреть корешок со знаком', area: 'Посмотри на корешки на средней полке книжного шкафа.'},
    cuffs: {
      label: 'Отодвинуть бумаги',
      area: 'Осмотри бумаги с правого края письменного стола.',
      revealed: '<path d="m44 12 16-5 7 25-11 4Z" fill="#faeed2" stroke="#ae9879"/>',
      cover: '<path d="M12 31q-9 8 1 12m38-15q9 4 3 13" fill="none" stroke="#71677e" stroke-width="4"/><path d="m8 18 38-8 13 28-43 8Z" fill="#d4b692" stroke="#987758"/><path d="m9 13 32-5 14 27-34 7Z" fill="#faeed2" stroke="#ae9879"/><path d="m19 18 20-4m-16 11 20-4m-17 10 14-3" stroke="#baa989"/>'
    },
    car: {
      label: 'Заглянуть за край тумбы',
      area: 'Загляни за край низкой тумбы у окна.',
      cover: '<path d="m18 28 5-8h17l9 9 8 4v5H19Z" fill="#b96f5e" stroke="#855649" stroke-width="2"/><path d="m28 22 10 0 5 7H24Z" fill="#c8ddd3"/><circle cx="47" cy="38" r="5" fill="#504b4b"/><path d="M2 19h33v26H2Z" fill="#bc987b" stroke="#9a775d"/><path d="M4 22h29" stroke="#e1bb96" stroke-width="3"/>'
    },
    album: {
      label: 'Открыть сумку',
      area: 'Осмотри сумку на кресле перед столом.',
      revealed: '<path d="M6 35v16h52V35l-8 8H14Z" fill="#a27f69" stroke="#775b4f" stroke-width="2"/><path d="M27 43h10v5H27z" fill="#d9c18d"/>',
      cover: '<path d="m24 24 22-10 6 17-25 7z" fill="#d9b18d" stroke="#906b54"/><path d="M10 26q24-8 44 0l4 22H7Z" fill="#a27f69" stroke="#775b4f" stroke-width="2"/><path d="M22 27v-5q10-10 19 0v5m-27 8q19 7 37 0" fill="none" stroke="#dac09b" stroke-width="2"/><rect x="29" y="34" width="7" height="6" rx="1" fill="#e4cb91"/>'
    }
  };
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
    let hintIndex = -1;
    const controls = [];
    const opened = new Set(completed ? objects.map(object => object.id) : found);
    const rows = [];

    function update() {
      const total = completed ? objects.length : found.size;
      count.textContent = `Находки · ${total}/${objects.length}`;
      objects.forEach((object, index) => {
        const known = completed || found.has(object.id);
        controls[index].classList.toggle('is-found', known);
        if (known) controls[index].setAttribute('aria-label', `${object.name}. Читать историю`);
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
      if (hintIndex === objects.indexOf(object)) {
        hintIndex = -1;
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
      const place = hidingPlaces[object.id];
      const control = button('', () => {
        if (place.cover && !opened.has(object.id)) {
          opened.add(object.id);
          draw();
          control.classList.add('is-uncovered');
          clearHint();
          hintText.textContent = '';
          status.textContent = 'Тайник открыт. Можно рассмотреть находку.';
          return;
        }
        inspect(object, control);
      });
      control.className = 'objects-clue';
      control.style.left = `${object.x * 100 / 440}%`;
      control.style.top = `${object.y * 100 / 420}%`;
      control.dataset.object = object.id;
      function draw() {
        const covered = place.cover && !opened.has(object.id);
        control.dataset.covered = String(Boolean(covered));
        control.setAttribute('aria-label', covered || !place.cover ? place.label : 'Рассмотреть открывшийся предмет');
        control.innerHTML = `<svg viewBox="0 0 64 54" aria-hidden="true" focusable="false">${covered ? place.cover : object.art + (place.revealed || '')}</svg>`;
      }
      draw();
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
      if (hintIndex !== next) {
        hintIndex = next;
        hintText.textContent = hidingPlaces[objects[next].id].area;
        return;
      }
      hintedButton = controls[next];
      hintedButton.classList.add('is-hinted');
      hintText.textContent = 'Подсвечено место, которое можно осмотреть.';
      hintText.scrollIntoView({block: 'nearest'});
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

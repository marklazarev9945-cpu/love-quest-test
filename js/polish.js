'use strict';

const polishPets = {
  cat: {
    label: 'Погладить Микаэллу',
    art: '<ellipse cx="35" cy="48" rx="29" ry="4" fill="#7a846829"/><path class="pet-tail" d="M43 39q24 9 21-9" stroke="#939c97" stroke-width="7" stroke-linecap="round" fill="none"/><ellipse cx="36" cy="35" rx="17" ry="13" fill="#aeb9b4"/><path d="M13 23q-4-12 7-11l6 6m9 0q8-9 13-3l-2 10" fill="#8d9b98"/><ellipse cx="29" cy="28" rx="18" ry="15" fill="#cad2cb"/><ellipse cx="29" cy="35" rx="11" ry="7" fill="#e5e7dc"/><g class="pet-eyes"><ellipse cx="21" cy="27" rx="4" ry="3.5" fill="#a7ab63"/><ellipse cx="37" cy="27" rx="4" ry="3.5" fill="#a7ab63"/><path d="M21 25v4m16-4v4" stroke="#47584b" stroke-width="2" stroke-linecap="round"/></g><path d="m26 33 3 2 3-2m-19 0-7-2m37 2 8-2" stroke="#8c786f" stroke-linecap="round" fill="none"/>'
  },
  dog: {
    label: 'Поздороваться с таксой',
    art: '<ellipse cx="37" cy="47" rx="32" ry="4" fill="#7a846829"/><path class="pet-tail" d="M56 32q14-3 12-14 5 5 1 13l-10 7" fill="#9a5d43"/><path d="m27 36-3 8h8l4-8m12-1 2 9h7l-2-12" fill="#87503a"/><path d="M15 28q10-8 25-4 11-3 19 2l2 10q-12 6-29 1l-10 2Z" fill="#ba794f"/><g class="pet-snout"><path d="M17 19q12-3 15 10l-8 9-12-4-9-4 2-5 9-1Z" fill="#c98c60"/><path d="M20 20q13-2 10 12l-4 7-7-5q-2-8 1-14Z" fill="#8c533b"/><path d="M22 24v8m4-7-1 9" stroke="#ac6d4c" fill="none"/><circle cx="6" cy="28" r="3" fill="#523a31"/><circle cx="16" cy="25" r="1.6" fill="#49392d"/></g>'
  }
};

function polishPet(kind) {
  const pet = polishPets[kind];
  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'polish-pet polish-' + kind;
  control.setAttribute('aria-label', pet.label);
  control.innerHTML = '<svg viewBox="0 0 76 52" aria-hidden="true">' + pet.art + '</svg><span aria-hidden="true">♥</span>';
  let reaction;
  control.addEventListener('click', () => {
    clearTimeout(reaction);
    control.classList.remove('is-reacting');
    void control.offsetWidth;
    control.classList.add('is-reacting');
    reaction = setTimeout(() => control.classList.remove('is-reacting'), 850);
  });
  return control;
}

function polishInterior({body, element, button}, kind, launch) {
  const isLetter = kind === 'letters';
  const room = element('div', undefined, 'polish-room polish-room-' + kind);
  const art = element('img');
  art.src = 'assets/polish/' + kind + '.svg';
  art.alt = '';
  art.width = 640;
  art.height = 400;
  const target = button(isLetter ? 'Открыть письмо' : 'Фотоаппарат', launch);
  target.className = 'polish-room-target';
  target.innerHTML = (isLetter ?
    '<svg viewBox="0 0 96 62" aria-hidden="true"><rect x="3" y="4" width="90" height="54" rx="5" fill="#fff2d4" stroke="#aa8364" stroke-width="2"/><path d="m4 7 44 31L92 7M4 56l30-27m58 27L62 29" fill="none" stroke="#c39c73" stroke-width="2"/><circle cx="48" cy="37" r="8" fill="#af7469"/></svg>' :
    '<svg viewBox="0 0 96 62" aria-hidden="true"><path d="M11 17h17l7-9h25l8 9h17q6 0 6 6v28q0 6-6 6H11q-6 0-6-6V23q0-6 6-6Z" fill="#615b54" stroke="#493f36" stroke-width="2"/><circle cx="48" cy="36" r="16" fill="#b2b8a8"/><circle cx="48" cy="36" r="11" fill="#566e6b"/><circle cx="45" cy="32" r="4" fill="#b7d0c7"/><rect x="72" y="23" width="12" height="6" rx="2" fill="#e6c89f"/></svg>') +
    '<span>' + target.textContent + '</span>';
  room.append(art, target);
  if (isLetter) room.append(polishPet('cat'));
  body.append(room);
}

for (const kind of ['cat', 'dog']) {
  document.querySelector('.town-pets')?.append(polishPet(kind));
}

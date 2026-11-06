'use strict';
(() => {
  const STORAGE_KEY = 'lovequest.chapter04.shell.v1';
  const SCHEMA_VERSION = 1;
  function devModeAllowed(url) {
    const local = url.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const testPages = url.protocol === 'https:' && url.hostname === 'marklazarev9945-cpu.github.io' &&
      (url.pathname === '/love-quest-test' || url.pathname.startsWith('/love-quest-test/'));
    return (local || testPages) && new URLSearchParams(url.search).get('dev') === '1';
  }
  const DEV_ENABLED = devModeAllowed(location);
  const MISSIONS = Object.freeze([
    {id:'001',locationName:'Дом воспоминаний',title:'Дело о потерянных письмах',clueFragment:'ТЫ',type:'pending',entryPoint:null,column:1,row:1,description:'В доме пахнет чаем, а на подоконнике лежит стопка писем. Одно из них помнит больше, чем кажется. Внимательно присмотрись к знакомым мелочам.'},
    {id:'002',locationName:'Фотостудия',title:'Восстановить утраченное',clueFragment:'НАШЛА',type:'pending',entryPoint:null,column:2,row:1,description:'Свет из большого окна ложится на стол фотографа. Здесь история рассыпалась на кусочки, но каждый из них всё ещё хранит частицу одного важного дня.'},
    {id:'003',locationName:'Детективное бюро',title:'Пять семейных секретов',clueFragment:'НЕ',type:'pending',entryPoint:null,column:2,row:2,description:'У детектива не бывает случайных вещей. На полках этого бюро спрятались пять семейных историй — очень личных и местами подозрительно забавных.'},
    {id:'004',locationName:'Библиотека',title:'Библиотека секретов',clueFragment:'ПРОПАЖУ,',type:'pending',entryPoint:null,column:1,row:2,description:'Между книжных страниц остались слова, понятные только своим. Собери их вместе: иногда верное имя оказывается важнее самого сложного вопроса.'},
    {id:'005',locationName:'Секретный архив',title:'Архив путешествий',clueFragment:'А',type:'pending',entryPoint:null,column:1,row:3,description:'В архиве хранятся дороги, по которым вы уже прошли. У снимков нет подписей, зато есть воспоминания. Они помогут вернуть каждому мгновению своё место.'},
    {id:'006',locationName:'Игровой парк',title:'LOVE DASH',clueFragment:'ПРИГЛАШЕНИЕ',type:'runner',entryPoint:null,column:2,row:3,description:'В конце аллеи слышится тихий шелест листвы. Здесь расследованию понадобится немного ловкости, а за последним поворотом будет ждать ещё один след.'}
  ].map(Object.freeze));
  const CASE_NOTES = [
    ['Некоторые письма находят дорогу домой.','Всё начинается там, где однажды потерялись важные слова. Загляни в дом и попробуй восстановить их историю.'],
    ['У каждого снимка есть своя тайна.','В Фотостудии тебя ждёт головоломка из двенадцати фрагментов. Собери их и вспомни один особенный день.'],
    ['Пять вещей. Пять историй.','Кто-то собрал здесь предметы, которые для постороннего ничего не значат. Но только не для тебя.'],
    ['Между строк скрывается больше, чем кажется.','Восемь ответов, знакомые слова и одна история, которую не найти ни в одной обычной книге.'],
    ['Каждая дорога куда-то нас привела.','Самые важные воспоминания не всегда хранятся по порядку. Пора расставить их по местам.'],
    ['До разгадки осталось совсем немного.','Все следы ведут к последнему испытанию. Возможно, именно там станет понятно, кто всё это устроил.']
  ];

  const $ = selector => document.querySelector(selector);
  const intro = $('#intro'), app = $('#app'), panel = $('#panel');
  const panelBody = $('#panel-body'), panelTitle = $('#panel-title');
  const town = $('.town'), actor = $('#town-katya'), routes = $('#town-routes');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const JOURNEY_MS = 3000;
  let storageAvailable = true, storageReset = false, returnFocus = null;
  let journey = null, townWidth = 0, townHeight = 0;

  // Model: only a contiguous prefix of known missions can be completed.
  function freshState() {
    return {schemaVersion:SCHEMA_VERSION,introSeen:false,completedMissionIds:[]};
  }
  function normalizeState(value) {
    if (!value || typeof value !== 'object' || value.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(value.completedMissionIds)) {
      storageReset = true;
      return freshState();
    }
    const known = new Set(value.completedMissionIds.slice(0, MISSIONS.length));
    const completedMissionIds = [];
    for (const mission of MISSIONS) {
      if (!known.has(mission.id)) break;
      completedMissionIds.push(mission.id);
    }
    return {schemaVersion:SCHEMA_VERSION,introSeen:value.introSeen === true || completedMissionIds.length > 0,completedMissionIds};
  }
  function loadState() {
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); }
    catch { storageAvailable = false; return freshState(); }
    if (raw === null) return freshState();
    try { return normalizeState(JSON.parse(raw)); }
    catch { storageReset = true; return freshState(); }
  }
  let state = loadState();
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    renderSaveNote();
  }
  const nextMission = () => MISSIONS[state.completedMissionIds.length] || null;
  const statusOf = mission => state.completedMissionIds.includes(mission.id) ? 'completed' :
    nextMission()?.id === mission.id ? 'current' : 'locked';

  // Shared by mission archive actions and the developer tools.
  function completeMission(missionId) {
    if (nextMission()?.id !== missionId) return false;
    state.completedMissionIds.push(missionId);
    saveState();
    render({walkFrom:missionId,foundId:missionId});
    announce('Дело ' + missionId + ' отмечено завершённым. Найден новый фрагмент.');
    return true;
  }

  // Local vector illustrations: no external assets, fonts or requests.
  function buildingArt(id) {
    const windowArt = (x,y,w=22,h=27) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#a8c2bf" stroke="#fff5db" stroke-width="4"/><path d="M${x+w/2} ${y}v${h}" stroke="#fff5db" stroke-width="2"/>`;
    const door = (x,y,color='#8c9c82') => `<path d="M${x} 131V${y+11}a12 12 0 0 1 24 0v${131-y-11}Z" fill="${color}"/><circle cx="${x+18}" cy="119" r="1.5" fill="#fff1c9"/>`;
    const ground = '<ellipse cx="116" cy="145" rx="87" ry="11" fill="#849375" opacity=".2"/><path d="M25 132q85-13 170 0v11q-85 17-170 0Z" fill="#e3dbc4"/><path d="M28 143q82 14 164 0" fill="none" stroke="#c2bca1" stroke-width="2"/>';
    let art = '';
    if (id === '001') art = `<path d="M42 69h136v65H42Z" fill="#e9cfa8"/><path d="m29 70 81-49 81 49Z" fill="#b87967"/><path d="m40 67 70-40 70 40" fill="none" stroke="#d29b7a" stroke-width="4"/><rect x="151" y="28" width="15" height="24" rx="2" fill="#b87967"/>${windowArt(55,84)}${windowArt(142,84)}${door(98,93)}<path d="M34 134h152" stroke="#b49c78" stroke-width="5" stroke-linecap="round"/><rect x="24" y="105" width="17" height="14" rx="3" fill="#9ba88b"/><path d="M32 120v17m-5-27 5 4 5-4" stroke="#f7e9cc" stroke-width="2" fill="none"/><g fill="#b58777"><circle cx="59" cy="123" r="4"/><circle cx="70" cy="126" r="4"/><circle cx="151" cy="125" r="4"/></g>`;
    if (id === '002') art = `<rect x="42" y="50" width="136" height="85" rx="4" fill="#c9bcc5"/><path d="M34 52h152l-15-20H49Z" fill="#9a8592"/><rect x="55" y="68" width="61" height="55" rx="14" fill="#a8c2bf" stroke="#f8edda" stroke-width="5"/><path d="M85 69v54M56 95h59" stroke="#f8edda" stroke-width="3"/>${door(133,93,'#8e7f8a')}<rect x="126" y="58" width="37" height="25" rx="4" fill="#fff3da"/><rect x="133" y="66" width="23" height="13" rx="3" fill="#9a8592"/><circle cx="145" cy="72" r="5" fill="#c7cec1"/><path d="M139 66v-4h10v4" stroke="#9a8592" stroke-width="3"/><path d="M39 136h143" stroke="#a99b94" stroke-width="4" stroke-linecap="round"/><path d="M25 130v-14m-8 5h16" stroke="#8a9d7b" stroke-width="3"/><ellipse cx="25" cy="110" rx="10" ry="14" fill="#a9b68f"/>`;
    if (id === '003') art = `<rect x="48" y="52" width="124" height="83" rx="3" fill="#bbc9b5"/><path d="M37 53h146l-20-24H57Z" fill="#778d7e"/>${windowArt(60,74,28,30)}${windowArt(132,74,28,30)}${door(98,91,'#778d7e')}<rect x="85" y="45" width="50" height="19" rx="3" fill="#f9edcf"/><circle cx="107" cy="53" r="5" fill="none" stroke="#778d7e" stroke-width="2.5"/><path d="m111 57 5 5" stroke="#778d7e" stroke-width="3"/><path d="M39 136h142" stroke="#a8af95" stroke-width="4" stroke-linecap="round"/><path d="M182 108V78h17" stroke="#8a967c" stroke-width="3"/><rect x="181" y="81" width="22" height="19" rx="3" fill="#f6e6bf"/><path d="m186 86 6 5 6-5" fill="none" stroke="#ad9d7c" stroke-width="2"/>`;
    if (id === '004') art = `<rect x="38" y="62" width="144" height="73" fill="#e4d1a5"/><path d="m29 64 81-39 81 39Z" fill="#9b9f89"/><path d="M49 76v52m30-52v52m62-52v52m30-52v52" stroke="#fff0ce" stroke-width="10"/>${door(98,95,'#92987f')}<path d="M29 136h162m-153-7h144" stroke="#b2aa8d" stroke-width="5" stroke-linecap="round"/><path d="M93 49q9-5 17 0 8-5 17 0v14q-9-5-17 0-8-5-17 0Z" fill="#fff3d7"/><path d="M110 49v14" stroke="#a9a184" stroke-width="2"/><rect x="59" y="83" width="10" height="27" fill="#aca98b"/><rect x="151" y="83" width="10" height="27" fill="#aca98b"/>`;
    if (id === '005') art = `<rect x="40" y="52" width="140" height="82" rx="3" fill="#d1b496"/><path d="M32 53h156l-19-21H51Z" fill="#a58472"/>${windowArt(53,68)}${windowArt(145,68)}${door(98,94,'#958874')}<rect x="83" y="58" width="54" height="19" rx="3" fill="#f7ecd0"/><text x="110" y="71" text-anchor="middle" fill="#8e7e69" font-size="9" font-family="sans-serif" letter-spacing="1">АРХИВ</text><rect x="52" y="109" width="29" height="25" rx="2" fill="#bda17f"/><path d="M55 117h23m-23 8h23" stroke="#f3dfbb" stroke-width="2"/><path d="M35 136h151" stroke="#ad9579" stroke-width="4" stroke-linecap="round"/><rect x="146" y="111" width="24" height="22" rx="2" fill="#b59a79"/><path d="M149 118h18m-18 7h18" stroke="#efdbb6" stroke-width="2"/>`;
    if (id === '006') art = `<path d="M29 138q81-47 162 0Z" fill="#b5c29b"/><path d="M99 142q10-21 22-42" stroke="#eadbbd" stroke-width="17" fill="none"/><path d="M71 133V70a39 39 0 0 1 78 0v63" stroke="#859d7c" stroke-width="9" fill="none"/><path d="M65 68h90" stroke="#a7b48e" stroke-width="7" stroke-linecap="round"/><rect x="73" y="61" width="74" height="23" rx="5" fill="#fcf0d1"/><text x="110" y="76" text-anchor="middle" fill="#6c866b" font-size="10" font-weight="bold" font-family="sans-serif">LOVE DASH</text><path d="M36 131V91m146 40V93" stroke="#998c6a" stroke-width="5"/><ellipse cx="36" cy="80" rx="22" ry="29" fill="#9caf85"/><ellipse cx="182" cy="81" rx="22" ry="29" fill="#a4b58b"/><ellipse cx="28" cy="70" rx="10" ry="16" fill="#b9c69c"/><path d="M156 119h30m-28 7h26m-24 0v9m20-9v9" stroke="#a18b6c" stroke-width="4" stroke-linecap="round"/>`;
    const sideWall = {
      '001':'M178 69 188 63v65l-10 7Z', '002':'M178 51l10-7v84l-10 7Z',
      '003':'M172 53l10-7v81l-10 8Z', '004':'M182 63l9-6v72l-9 6Z', '005':'M180 53l9-7v81l-9 7Z'
    }[id];
    const roofDetail = {
      '001':'M49 58h122M65 48h90M83 38h54', '002':'M47 43h126M53 36h114',
      '003':'M52 44h116M61 35h98', '004':'M58 54h104M78 44h64', '005':'M45 44h130M55 36h109'
    }[id];
    const depth = sideWall ? `<path d="${sideWall}" fill="#8e8975" opacity=".65"/>` : '';
    const detail = roofDetail ? `<path d="${roofDetail}" stroke="#fff1d0" stroke-width="1.2" opacity=".27" fill="none"/>` : '';
    const steps = id === '006' ? '<path d="M94 147h33" stroke="#cabf9e" stroke-width="3" stroke-linecap="round"/>' : '<path d="M94 136h32v5H94Zm-4 5h40v5H90Zm-4 5h48v5H86Z" fill="#d9cbae"/><path d="M94 140h32m-36 5h40m-44 5h48" stroke="#b9ac90" stroke-width="1.5"/>';
    const extras = id === '001' ? '<rect x="51" y="112" width="32" height="6" rx="2" fill="#b18e75"/><path d="M56 111v-8m10 8v-5m10 5v-8" stroke="#8ca180" stroke-width="2"/><g fill="#c99787"><circle cx="56" cy="103" r="3"/><circle cx="66" cy="106" r="3"/><circle cx="76" cy="103" r="3"/></g>' : id === '002' ? '<path d="M53 84h66l-5 9H58Z" fill="#f7e9cf"/><path d="M65 84v8m17-8v8m17-8v8" stroke="#b4939b" stroke-width="5"/>' : id === '004' ? '<path d="M17 126h23m-21 5h19m-17 0v6m14-6v6" stroke="#a99475" stroke-width="3" stroke-linecap="round"/>' : '';
    const smoke = id === '001' ? '<g class="chimney-smoke"><ellipse class="smoke-puff puff-one" cx="158" cy="25" rx="4" ry="3" fill="#a5a798"/><ellipse class="smoke-puff puff-two" cx="158" cy="25" rx="4" ry="3" fill="#a5a798"/></g>' : '';
    return `<svg class="building" viewBox="0 0 220 160" aria-hidden="true" focusable="false">${ground}${depth}${art}${detail}${steps}${extras}${smoke}</svg>`;
  }
  function roundedRoute(points) {
    let d = `M${points[0].x} ${points[0].y}`;
    for (let i=1;i<points.length-1;i++) {
      const a=points[i-1],b=points[i],c=points[i+1];
      const ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y);
      const r=Math.min(12,ab/2,bc/2);
      d+=` L${b.x+(a.x-b.x)*r/ab} ${b.y+(a.y-b.y)*r/ab} Q${b.x} ${b.y} ${b.x+(c.x-b.x)*r/bc} ${b.y+(c.y-b.y)*r/bc}`;
    }
    const end=points[points.length-1];
    return d+` L${end.x} ${end.y}`;
  }
  function routePath(d,className) {
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',d); path.setAttribute('class',className);
    routes.append(path);
    return path;
  }
  function remainingJourney() {
    if (!journey) return null;
    const {animation,points,distances,totalDistance,limbs}=journey;
    const progress=Math.min(1,Math.max(0,Number(animation.currentTime || 0)/JOURNEY_MS));
    const travelled=progress*totalDistance;
    let index=0;
    while (index<points.length-2 && distances[index+1]<travelled) index++;
    const a=points[index],b=points[index+1];
    const segment=distances[index+1]-distances[index];
    const t=segment ? (travelled-distances[index])/segment : 0;
    const remaining=[{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},...points.slice(index+1)];
    journey=null; animation.cancel();
    limbs.forEach(limb=>limb.cancel());
    return remaining;
  }
  function actorTransform(point) { return `translate(${point.x}px, ${point.y}px)`; }
  function startJourney(points,destination) {
    // Distance offsets give translation and gait the same speed, including a
    // continued journey when another developer action arrives mid-transition.
    const distances=[0];
    for (let i=1;i<points.length;i++) distances.push(distances[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
    const totalDistance=distances[distances.length-1];
    if (totalDistance<.5) {
      actor.style.transform=actorTransform(destination);
      return;
    }
    const speed=totalDistance/(JOURNEY_MS/1000);
    const spriteHeight=actor.querySelector('.katya-sprite').getBoundingClientRect().height;
    // A cycle is two alternating steps. Very fast routes use a longer stride;
    // short routes keep their naturally slower cadence rather than rushing.
    const strideLength=Math.max(spriteHeight,speed/1.6);
    const phaseAt=distance=>{
      const envelope=Math.min(1,distance/(strideLength*.25),(totalDistance-distance)/(strideLength*.25));
      return Math.sin(2*Math.PI*distance/strideLength)*Math.max(0,envelope);
    };
    const timing={duration:JOURNEY_MS,easing:'linear',fill:'forwards'};
    actor.style.transform=actorTransform(points[0]);
    actor.classList.add('is-walking'); actor.dataset.state='walking';
    const animation=actor.animate(points.map((point,i)=>({transform:actorTransform(point),offset:distances[i]/totalDistance})),timing);
    const limbs=[['.leg-left',8],['.leg-right',-8],['.arm-left',-5],['.arm-right',5]].map(([selector,amplitude])=>
      actor.querySelector(selector).animate(distances.map(distance=>({transform:`rotate(${phaseAt(distance)*amplitude}deg)`,offset:distance/totalDistance})),timing));
    journey={animation,points,distances,totalDistance,limbs};
    Promise.all([animation,...limbs].map(item=>item.ready)).then(()=>{
      if (journey?.animation!==animation || animation.startTime===null) return;
      limbs.forEach(limb=>{ limb.startTime=animation.startTime; });
    }).catch(()=>{});
    animation.finished.then(()=>{
      if (journey?.animation!==animation) return;
      actor.style.transform=actorTransform(destination);
      journey=null; animation.cancel(); limbs.forEach(limb=>limb.cancel());
      actor.classList.remove('is-walking'); actor.classList.add('is-happy'); actor.dataset.state='celebrating';
    }).catch(()=>{}); // Undo, reset, resize and reduced motion cancel every part.
  }
  function layoutTown(walkFrom = null) {
    if (app.hidden) return;
    const carry=remainingJourney(),box=town.getBoundingClientRect();
    townWidth=box.width; townHeight=box.height;
    if (!townWidth || !townHeight) return;
    // Measurements keep streets and character paths aligned at every breakpoint.
    const originX=box.left+town.clientLeft,originY=box.top+town.clientTop;
    const stops=MISSIONS.map(mission => {
      const art=$(`[data-mission="${mission.id}"] .building`).getBoundingClientRect();
      return {x:art.left-originX+art.width/2,y:art.bottom-originY+14,entryY:art.top-originY+art.height*154/160};
    });
    routes.setAttribute('viewBox',`0 0 ${town.clientWidth} ${town.clientHeight}`);
    routes.replaceChildren();
    const left=12,right=town.clientWidth-12;
    const paths=[];
    for (let i=0;i<stops.length-1;i++) {
      const a=stops[i],b=stops[i+1];
      const side=i===1?right:left;
      const points=i===1 || i===3?[a,{x:side,y:a.y},{x:side,y:b.y},b]:[a,b];
      const d=roundedRoute(points);
      routePath(d,'street-edge'); routePath(d,'street-fill');
      paths.push(routePath(d,'street-track'));
    }
    stops.forEach(stop => routePath(`M${stop.x} ${stop.entryY} L${stop.x} ${stop.y}`,'entry-path'));
    const destination=stops[Math.min(state.completedMissionIds.length,5)];
    actor.hidden=false;
    actor.classList.remove('is-walking','is-happy');
    actor.dataset.state='standing';
    const routeIndex=MISSIONS.findIndex(mission=>mission.id===walkFrom);
    if (!walkFrom || routeIndex<0 || !nextMission() || motionPreference.matches || !actor.animate) {
      actor.style.transform=actorTransform(destination);
      if (walkFrom) { actor.classList.add('is-happy'); actor.dataset.state='celebrating'; }
      return;
    }
    const path=paths[routeIndex],length=path.getTotalLength(),samples=[];
    for (let i=0;i<=64;i++) {
      const p=path.getPointAtLength(length*i/64);
      samples.push({x:p.x,y:p.y});
    }
    const points=carry?[...carry,...samples.slice(1)]:samples;
    startJourney(points,destination);
  }
  function showFindNotice(missionId) {
    const mission=MISSIONS.find(item=>item.id===missionId),notice=$('#find-notice');
    if (!mission || statusOf(mission)!=='completed') return;
    notice.replaceChildren(element('span','Найден фрагмент '+Number(mission.id),'find-label'),element('span',mission.clueFragment,'clue-token'));
    notice.hidden=false;
    $('.location.current')?.classList.add('just-unlocked');
  }
  function announce(text) { $('#announcement').textContent = text; }
  function renderSaveNote() {
    $('#save-note').textContent = !storageAvailable ? 'Браузер не разрешил сохранение. Пока страница открыта, находки останутся с тобой.' :
      storageReset ? 'Старое сохранение не удалось прочитать. Расследование начато с чистого листа.' : 'Твои находки сохраняются в этом браузере.';
  }
  function render({walkFrom=null,foundId=null} = {}) {
    $('#find-notice').hidden=true;
    $('#find-notice').replaceChildren();
    const count = state.completedMissionIds.length;
    $('#progress-count').textContent = count;
    $('#progress-markers').innerHTML = MISSIONS.map((mission,index) => `<li class="${index < count ? 'found' : index === count ? 'active' : ''}"><span class="sr-only">Фрагмент ${index+1}: ${index < count ? 'найден' : 'не найден'}</span></li>`).join('');
    $('#progress-caption').textContent = count === 6 ? 'Все фрагменты на своих местах.' : count ? 'История складывается, шаг за шагом.' : 'Первый след уже ждёт.';
    $('#mission-map').innerHTML = MISSIONS.map(mission => {
      const status = statusOf(mission);
      const label = status === 'completed' ? '✓ Дело раскрыто' : status === 'current' ? 'Твоё текущее дело' : 'Закрыто · после ' + String(Number(mission.id)-1).padStart(3,'0');
      return `<button type="button" class="location ${status}" data-mission="${mission.id}" style="grid-column:${mission.column};grid-row:${mission.row}" aria-label="${mission.locationName}. Дело ${mission.id}. ${label}"${status === 'current' ? ' aria-current="step"' : ''}><span class="location-number">${mission.id}</span>${buildingArt(mission.id)}<span class="location-name">${mission.locationName}</span><span class="location-status">${label}</span></button>`;
    }).join('');
    const next = nextMission();
    $('#case-note-title').textContent = next ? CASE_NOTES[count][0] : 'Все фрагменты на своих местах.';
    $('#next-step').textContent = next ? CASE_NOTES[count][1] : 'Шесть фрагментов найдены. Пора открыть журнал и прочитать послание целиком.';
    $('#current-case').textContent = next ? 'Открыть текущее дело →' : 'Прочитать послание →';
    if (DEV_ENABLED) renderDevTools();
    renderSaveNote();
    layoutTown(walkFrom);
    if (foundId) showFindNotice(foundId);
  }
  function showMap(focus = true) {
    const wasHidden=app.hidden;
    intro.hidden = true;
    app.hidden = false;
    $('.skip-link').hidden = false;
    if (wasHidden) layoutTown();
    if (focus) $('#map-title').focus({preventScroll:true});
  }
  function showIntro() {
    remainingJourney();
    if (panel.open) panel.close();
    app.hidden = true;
    intro.hidden = false;
    $('.skip-link').hidden = true;
    $('#begin').textContent = state.introSeen ? 'Вернуться к расследованию ↗' : 'Начать расследование ↗';
    $('#begin').focus({preventScroll:true});
    window.scrollTo(0,0);
  }

  function element(tag,text,className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function panelButton(text,callback,primary = false) {
    const button = element('button',text,'button ' + (primary ? 'primary' : 'subtle'));
    button.type = 'button';
    button.addEventListener('click',callback);
    return button;
  }
  const missionUI = {
    panel, body: panelBody, title: panelTitle, kicker: $('#panel-kicker'),
    closeButton: $('#close-panel'), element, button: panelButton
  };
  function archiveMission(missionId) {
    if (!completeMission(missionId)) return false;
    returnFocus = $('#mission-map [aria-current="step"]');
    panel.close();
    $('.town').scrollIntoView({block:'start',behavior:'auto'});
    return true;
  }
  const letters = createLettersMission({
    ...missionUI,
    isCompleted: () => state.completedMissionIds.includes('001'),
    archive: () => archiveMission('001')
  });
  const photo = createPhotoMission({
    ...missionUI,
    isCompleted: () => state.completedMissionIds.includes('002'),
    archive: () => archiveMission('002')
  });
  const objects = createObjectsMission({
    ...missionUI,
    isCompleted: () => state.completedMissionIds.includes('003'),
    archive: () => archiveMission('003')
  });
  function openPanel(kind,missionId) {
    letters.clearView();
    photo.clearView();
    objects.clearView();
    panelBody.replaceChildren();
    $('#panel-kicker').textContent = 'LOVE QUEST · Дело №04';
    if (kind === 'letters') {
      if (statusOf(MISSIONS[0]) === 'locked') return;
      letters.open();
    } else if (kind === 'photo') {
      if (statusOf(MISSIONS[1]) === 'locked') return;
      photo.open();
    } else if (kind === 'objects') {
      if (statusOf(MISSIONS[2]) === 'locked') return;
      objects.open();
    } else if (kind === 'case') {
      const mission = MISSIONS.find(item => item.id === missionId);
      if (!mission) return;
      const status = statusOf(mission);
      $('#panel-kicker').textContent = 'Карточка дела · ' + mission.id;
      panelTitle.textContent = mission.locationName;
      if (mission.id === '002' && status !== 'locked') {
        $('#panel-kicker').textContent = 'Фотостудия · Дело 002';
        panelTitle.textContent = mission.title;
      }
      const art = element('div',undefined,'case-art');
      art.innerHTML = buildingArt(mission.id);
      panelBody.append(art,element('span',status === 'completed' ? 'Дело раскрыто' : status === 'locked' ? 'Пока закрыто' : 'Текущее дело','panel-state'));
      if (panelTitle.textContent !== mission.title) panelBody.append(element('h3',mission.title));
      if (status === 'locked') {
        const previous = MISSIONS[Number(mission.id)-2];
        panelBody.append(element('p','Эта дверь откроется после дела ' + previous.id + ' — «' + previous.locationName + '». Сначала найди предыдущий фрагмент: у этой истории свой порядок.'));
      } else {
        if (mission.id === '002' && status === 'current') {
          panelBody.append(element('p','Один важный снимок рассыпался на двенадцать частей. Собери его — и воспоминание снова станет целым'));
        } else if (mission.id !== '002') {
          panelBody.append(element('p',mission.description));
        }
        if (status === 'completed') {
          const fragment=element('div',undefined,'fragment-display');
          fragment.append(element('p','Найденный фрагмент','fragment-label'),element('span',mission.clueFragment,'clue-word clue-token'));
          panelBody.append(fragment);
        } else if (mission.id !== '001' && mission.id !== '002' && mission.id !== '003') {
          panelBody.append(element('div',mission.type === 'runner' ? 'Дело готовится. Парк ещё не принимает участников этого расследования. Его история появится здесь чуть позже.' : 'Дело готовится. Мы бережно собираем эту историю. Пока можно осмотреть городок и заглянуть в журнал.','pending-note'));
        }
        if (mission.id === '001') {
          panelBody.append(panelButton(status === 'completed' ? 'Открыть письмо' : 'Войти в Дом воспоминаний',() => openPanel('letters'),true));
        } else if (mission.id === '002') {
          panelBody.append(panelButton(status === 'completed' ? 'Открыть снимок из архива' : 'Восстановить фотографию',() => openPanel('photo'),true));
        } else if (mission.id === '003') {
          panelBody.append(panelButton(status === 'completed' ? 'Открыть улики из архива' : 'Войти в Детективное бюро',() => openPanel('objects'),true));
        }
      }
      panelBody.append(panelButton('Вернуться на карту',() => panel.close()));
    } else if (kind === 'journal') {
      panelTitle.textContent = 'Журнал дела';
      panelBody.append(element('p','Свидание исчезло без адреса и времени. Каждое раскрытое дело оставит здесь слово. Из шести находок сложится одно послание.'));
      const list = element('ol',undefined,'clue-list');
      MISSIONS.forEach((mission,index) => {
        const found = statusOf(mission) === 'completed';
        const slot = element('li',undefined,'clue-slot' + (found ? ' found' : ''));
        const copy = element('div',undefined,'clue-copy');
        copy.append(element('small','Фрагмент ' + (index+1)),element('span',found ? mission.clueFragment : 'Не найден',found ? 'clue-word clue-token' : 'clue-missing'));
        slot.append(element('span',String(index+1).padStart(2,'0'),'clue-number'),copy);
        list.append(slot);
      });
      panelBody.append(list);
      if (state.completedMissionIds.length === 6) panelBody.append(panelButton('Открыть послание',() => openPanel('final'),true));
      else panelBody.append(element('p','Остальные слова пока под печатью. Полное послание откроется, когда будут найдены все шесть фрагментов.','quiet'));
    } else if (kind === 'final') {
      if (state.completedMissionIds.length !== 6) return openPanel('journal');
      const words = MISSIONS.map(mission => mission.clueFragment).join(' ').toLocaleLowerCase('ru-RU');
      panelTitle.textContent = words.charAt(0).toLocaleUpperCase('ru-RU') + words.slice(1);
      panelBody.append(element('div','6 / 6','final-seal'),element('p','Все слова сошлись. Это расследование привело к новой истории — и у неё будет своё продолжение.'),element('div','Продолжение готовится. Финальная глава появится здесь позже. Твои находки сохранены.','pending-note'),panelButton('Вернуться в городок',() => panel.close(),true));
    } else if (kind === 'help') {
      panelTitle.textContent = 'Маленькая подсказка';
      panelBody.append(element('p','Иди за Катей на карте: она стоит у текущего дела. Нажми на здание, чтобы прочитать его карточку. Следующая дверь откроется после предыдущей находки.'),element('p','Слова послания хранятся в журнале. Заглядывай туда, когда захочется собрать мысли вместе.'),element('div','Первое дело ждёт в Доме воспоминаний. Открой его карточку и войди в дом, чтобы начать расследование.','pending-note'));
    } else {
      panelTitle.textContent = 'Дело особой важности';
      panelBody.append(element('p','Катя, в этом городке знакомые места умеют хранить секреты. Здесь не нужно торопиться: замечай детали, собирай слова и доверяй своим воспоминаниям.'));
      const actions = element('div',undefined,'menu-actions');
      actions.append(panelButton('Карта расследования',() => { panel.close(); showMap(); }),panelButton('Подсказка',() => openPanel('help')),panelButton('Пересмотреть вступление',showIntro));
      panelBody.append(actions,element('p','Находки сохраняются только в этом браузере.','quiet'));
    }
    if (!panel.open) {
      returnFocus = document.activeElement;
      panel.showModal();
    }
    panel.scrollTop = 0;
    if (kind === 'letters' || kind === 'photo' || kind === 'objects') panelTitle.focus({preventScroll:true});
    else $('#close-panel').focus({preventScroll:true});
  }
  function renderDevTools() {
    const tools = $('#dev-tools');
    tools.hidden = false;
    tools.replaceChildren(element('p','Dev mode · тестовый прогресс сохраняется'));
    const actions = element('div',undefined,'dev-actions');
    const complete = panelButton('Завершить текущее дело',() => {
      if (!DEV_ENABLED) return;
      const mission = nextMission();
      if (mission && completeMission(mission.id) && !nextMission()) openPanel('final');
    });
    complete.disabled = !nextMission();
    const undo = panelButton('Откатить последнее',() => {
      if (!DEV_ENABLED || !state.completedMissionIds.length) return;
      const undone = state.completedMissionIds.pop();
      if (undone === '001') letters.reset();
      if (undone === '002') photo.reset();
      if (undone === '003') objects.reset();
      if (panel.open) panel.close();
      saveState(); render(); announce('Последнее завершение отменено.');
    });
    undo.disabled = !state.completedMissionIds.length;
    actions.append(complete,undo,panelButton('Сбросить весь прогресс',() => {
      if (!DEV_ENABLED || !window.confirm('Сбросить все находки и начать расследование заново в этом браузере?')) return;
      state = freshState(); storageReset = false;
      letters.reset();
      photo.reset();
      objects.reset();
      saveState(); render(); showIntro(); announce('Прогресс сброшен.');
    }),panelButton('Показать вступление',showIntro));
    tools.append(actions,element('p','Для обычного режима убери ?dev=1 из адреса. Тестовые находки останутся; перед передачей игроку сбрось прогресс.','dev-warning'));
  }

  $('#begin').addEventListener('click',() => {
    state.introSeen = true;
    saveState();
    showMap();
  });
  $('#mission-map').addEventListener('click',event => {
    const button = event.target.closest('[data-mission]');
    if (button) openPanel('case',button.dataset.mission);
  });
  document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click',() => openPanel(button.dataset.panel)));
  $('#current-case').addEventListener('click',() => nextMission() ? openPanel('case',nextMission().id) : openPanel('final'));
  $('#nav-map').addEventListener('click',() => {
    if (panel.open) panel.close();
    showMap();
    $('#map-title').scrollIntoView({block:'start',behavior:'auto'});
  });
  function dismissPanel() {
    if (!letters.closeZoom() && !photo.closePreview()) panel.close();
  }
  $('#close-panel').addEventListener('click',dismissPanel);
  panel.addEventListener('click',event => { if (event.target === panel) dismissPanel(); });
  panel.addEventListener('cancel',event => {
    if (letters.closeZoom() || photo.closePreview()) event.preventDefault();
  });
  panel.addEventListener('close',() => {
    letters.clearView();
    photo.clearView();
    objects.clearView();
    panelBody.replaceChildren();
    panelTitle.textContent = '';
    if (!app.hidden) {
      const target = returnFocus?.isConnected ? returnFocus : $('#current-case');
      target.focus({preventScroll:true});
    }
  });
  $('#find-notice').addEventListener('animationend',event=>{
    if (event.target!==$('#find-notice')) return;
    $('#find-notice').hidden=true;
    $('#find-notice').replaceChildren();
  });
  if (typeof ResizeObserver!=='undefined') {
    const observer=new ResizeObserver(()=>{
      const box=town.getBoundingClientRect();
      if (!app.hidden && (Math.abs(box.width-townWidth)>.5 || Math.abs(box.height-townHeight)>.5)) layoutTown();
    });
    observer.observe(town);
  } else window.addEventListener('resize',()=>layoutTown());
  motionPreference.addEventListener?.('change',()=>layoutTown());
  render();
  if (state.introSeen) showMap(false);
  else intro.hidden = false;
})();

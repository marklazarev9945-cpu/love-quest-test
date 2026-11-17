'use strict';
(() => {
  const CONFIG = Object.freeze({goal:100,speed:.48,maxSpeedMultiplier:1.30,spawnEvery:.43,chainChance:.64,chainMin:2,chainMax:4,chainSpacing:.19,obstacleChance:.17,invulnerable:1.25,ringRetry:2.2,maxDelta:.05,contactZ:.89,effectDuration:.38});
  // Test-only: change to true locally to start at 99 hearts; NEVER enable in a published build.
  const LOCAL_TEST_99_HEARTS = false;
  const DEBUG_MOTION = false; // Development only; false in published build.
  const PARK = Object.freeze({spacing: .155, ahead: .32});
  const canvas=document.querySelector('#canvas'),ctx=canvas.getContext('2d');
  const art = createDashArt(ctx);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stage=document.querySelector('#stage'),overlay=document.querySelector('#overlay');
  const title=document.querySelector('#title'),message=document.querySelector('#message'),action=document.querySelector('#action');
  const heartsUI=document.querySelector('#hearts'),livesUI=document.querySelector('#lives'),pauseButton=document.querySelector('#pause');
  let width=1,height=1,dpr=1,frameId=null,lastTime=null,swipeStart=null;
  const newState=()=>({mode:'start',lane:1,hearts:LOCAL_TEST_99_HEARTS?99:0,lives:3,objects:[],spawnClock:0,travel:0,invulnerable:0,ringClock:0,ringActive:false,ringCollected:false,serial:0,visualLane:1,effects:[],hitFlash:0,runClock:0});
  let state=newState();

  // Same-origin shell bridge. Standalone play never establishes a session.
  const questChannel = 'lovequest.love-dash';
  const questOrigin = location.protocol === 'file:' ? 'null' : location.origin;
  let questSession = null;

  function postQuest(type, fields) {
    if (!questSession || window.parent === window) return;
    window.parent.postMessage({
      channel: questChannel, version: 1, type, session: questSession, ...fields
    }, questOrigin === 'null' ? '*' : questOrigin);
  }

  function notifyQuestState() {
    postQuest('state', {mode: state.mode});
  }

  function notifyQuestVictory() {
    if (state.mode !== 'won' || state.hearts < CONFIG.goal || !state.ringCollected) return;
    postQuest('won', {hearts: state.hearts, ringCollected: true});
  }

  if (window.parent !== window) {
    window.addEventListener('message', event => {
      if (event.source !== window.parent || event.origin !== questOrigin) return;
      const data = event.data;
      if (!data || typeof data !== 'object' || Array.isArray(data) ||
          Object.keys(data).sort().join(',') !== 'channel,session,type,version' ||
          data.channel !== questChannel || data.version !== 1 ||
          typeof data.session !== 'string' || !/^[a-f0-9]{32}$/.test(data.session)) return;
      if (data.type === 'init') {
        if (questSession && data.session !== questSession) return;
        questSession = data.session;
        postQuest('ready', {mode: state.mode});
        return;
      }
      if (data.session !== questSession) return;
      if (data.type === 'pause' && state.mode === 'playing') setMode('paused');
      else if (data.type === 'resume' && state.mode === 'paused') resume();
    });
  }
  // Visual-only state. Gameplay coordinates, input, spawn and collisions are unchanged.
  const WORLDS=[{name:'Бутовский парк',sky:'#b9e4fa',ground:'#a5c985',road:'#d9cbb0',edge:'#fff2d4'},{name:'Первое путешествие',sky:'#c6dce8',ground:'#91b6b8',road:'#c7b9ad',edge:'#f9e7d7'},{name:'Предложение',sky:'#a6ddf6',ground:'#e9d5a5',road:'#e1c9a7',edge:'#fff3d7'},{name:'Дом',sky:'#f4d9ba',ground:'#d7b9a2',road:'#d5b7a2',edge:'#fff1df'}];
  const WORLD_FADE=1.15, LABEL_TIME=2.8;
  let worldIndex=0,previousWorld=0,worldFade=WORLD_FADE,labelAge=LABEL_TIME;
  // Shared world-space longitudinal coordinates: game object z = travel - spawnTravel.
  // Park landmarks use the exact same travel and projection as collectible objects.
  const parkLandmarks=[];
  const parkPlaces = [
    ['tree','bush'], ['lamp','tree'], ['bush','bench'], ['visitors','tree'],
    ['tree','bush'], ['bin','sign'], ['bush','tree'], ['bench','visitors'],
    ['tree','lamp'], ['sign','bush'], ['tree','tree'], ['bush','bench']
  ];
  const sceneryOffset = {tree: .57, bush: .59, bench: .56, lamp: .30, sign: .39, bin: .30, visitors: .52};
  let nextParkDistance, parkSerial;
  function resetPark() {
    parkLandmarks.length = 0;
    nextParkDistance = -1.48;
    parkSerial = 0;
    fillPark();
  }

  function fillPark() {
    while (nextParkDistance < state.travel + PARK.ahead) {
      const serial = parkSerial++;
      const group = parkPlaces[serial % parkPlaces.length];
      for (const side of [-1, 1]) {
        const index = (side === 1 ? 1 : 0) ^ (Math.floor(serial / parkPlaces.length) % 2);
        const kind = group[index];
        const variant = (serial * 3 + (side === 1 ? 2 : 0) + Math.floor(serial / 3)) % 7;
        parkLandmarks.push({
          distance: nextParkDistance + (side===1 ? .029+(serial%3)*.025 : 0), side, kind, variant,
          lateral: side * (sceneryOffset[kind] + (variant % 4) * .04)
        });
      }
      nextParkDistance += PARK.spacing + (serial % 5) * .027;
    }
  }
  resetPark();
  function resize(){const box=canvas.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);render();}
  function hud(){heartsUI.textContent=`♥ ${Math.min(state.hearts,CONFIG.goal)}/${CONFIG.goal}`;livesUI.textContent='●'.repeat(state.lives)+'○'.repeat(3-state.lives);pauseButton.textContent=state.mode==='paused'?'Продолжить':'Пауза';}
  function show(heading,body,button){title.textContent=heading;message.textContent=body;action.textContent=button;overlay.classList.remove('hidden');}
  function hide(){overlay.classList.add('hidden');}
  function setMode(mode){state.mode=mode;lastTime=null;hud();if(mode==='playing')hide();else if(mode==='start')show('LOVE DASH','Впереди последняя улика! Собери 100 сердечек, избегай препятствий и найди кольцо в конце пути.','Играть');else if(mode==='paused')show('Пауза','Игра остановлена. Продолжим?','Продолжить');else if(mode==='recover')show('Сердечки на месте ♥','Жизни закончились, но собранные сердечки сохраняются.','Продолжить');else if(mode==='won')show('Последняя улика найдена!','Ты собрала кольцо! ♥','Сыграть ещё раз');notifyQuestState();}
  function restart(){state=newState();resetPark();worldIndex=0;previousWorld=0;worldFade=WORLD_FADE;labelAge=0;setMode('playing');}
  function resume(){if(state.mode==='recover'){state.lives=3;state.invulnerable=CONFIG.invulnerable;state.objects=state.objects.filter(o=>o.kind!=='obstacle');}setMode('playing');}
  function actionClick(){if(state.mode==='start'||state.mode==='won')restart();else if(state.mode==='recover'||state.mode==='paused')resume();}
  function move(direction){if(state.mode!=='playing')return;state.lane=Math.max(0,Math.min(2,state.lane+direction));}
  function add(kind,lane,z=0){state.objects.push({id:++state.serial,kind,lane,z,handled:false});if(kind==='ring')state.ringActive=true;}
  function spawn(){
    if(state.hearts>=CONFIG.goal&&!state.ringActive&&state.ringClock<=0){add('ring',Math.floor(Math.random()*3));return;}
    const lane=Math.floor(Math.random()*3);
    if(Math.random()<CONFIG.obstacleChance){add('obstacle',lane);return;}
    const count=Math.random()<CONFIG.chainChance ? CONFIG.chainMin+Math.floor(Math.random()*(CONFIG.chainMax-CONFIG.chainMin+1)) : 1;
    for(let i=0;i<count;i++)add('heart',lane,-i*CONFIG.chainSpacing);
  }
  function speed(){return CONFIG.speed*(1+(CONFIG.maxSpeedMultiplier-1)*Math.min(state.hearts,CONFIG.goal)/CONFIG.goal);}
  function contactEffect(kind,lane){
    state.effects.push({kind,lane,age:0});
    if(state.effects.length>16)state.effects.shift();
    if(kind==='hit')state.hitFlash=.3;
  }
  function update(dt){
    const nextWorld=0; // v0.3A.2: keep Butovsky Park for the entire run, including ring phase.
    if(nextWorld!==worldIndex){previousWorld=worldIndex;worldIndex=nextWorld;worldFade=0;labelAge=0;}
    worldFade=Math.min(WORLD_FADE,worldFade+dt);labelAge+=dt;
    const velocity=speed();state.travel+=dt*velocity;state.runClock+=dt;
    fillPark();
    // Remove only after the entire illustrated object has passed below Canvas.
    // Because items are inserted in distance order (two per station), front removal is safe.
    while(parkLandmarks.length && decorationFullyBelow(parkLandmarks[0], state.travel-parkLandmarks[0].distance)) parkLandmarks.shift();
    state.visualLane+=(state.lane-state.visualLane)*Math.min(1,dt*15);
    state.invulnerable=Math.max(0,state.invulnerable-dt);
    state.hitFlash=Math.max(0,state.hitFlash-dt);
    for(const e of state.effects)e.age+=dt;
    state.effects=state.effects.filter(e=>e.age<CONFIG.effectDuration);
    state.spawnClock+=dt;
    if(state.hearts>=CONFIG.goal&&!state.ringActive)state.ringClock-=dt;
    while(state.spawnClock>=CONFIG.spawnEvery){state.spawnClock-=CONFIG.spawnEvery;spawn();}
    for(const o of state.objects){
      const oldZ=o.z;o.z+=dt*velocity;
      if(o.handled||oldZ>CONFIG.contactZ||o.z<CONFIG.contactZ)continue;
      o.handled=true;
      if(o.lane===state.lane){
        if(o.kind==='heart'){state.hearts++;contactEffect('heart',o.lane);}
        else if(o.kind==='ring'){state.ringCollected=true;setMode('won');notifyQuestVictory();break;}
        else if(state.invulnerable<=0){state.lives--;state.invulnerable=CONFIG.invulnerable;contactEffect('hit',o.lane);if(state.lives===0){setMode('recover');break;}}
      }
      if(o.kind==='ring'){state.ringActive=false;state.ringClock=CONFIG.ringRetry;}
    }
    state.objects=state.objects.filter(o=>!o.handled&&o.z<1.12);
    hud();
  }
  // All ground anchors use one road section at their projected depth.
  const horizonRatio = .21;
  const bottomRatio = 1.04;
  function roadSection(y) {
    const horizon = height * horizonRatio;
    const roadWidth = width * (.18 + .66 * (y-horizon) / (height*bottomRatio-horizon));
    return {y, left: (width-roadWidth)/2, right: (width+roadWidth)/2, laneWidth: roadWidth/3};
  }

  function roadBoundary(boundary, section) { return section.left + boundary * section.laneWidth; }

  function projectDepth(z) {
    const depth = Math.max(0, z);
    const horizon = height * horizonRatio;
    const section = roadSection(horizon + (height-horizon)*depth*depth);
    const contact = roadSection(horizon + (height-horizon)*CONFIG.contactZ**2);
    const contactScale = Math.max(.001, Math.min(1, width/390, contact.laneWidth/62, (contact.y-7)/79));
    return {...section, scale: contactScale * section.laneWidth/contact.laneWidth};
  }

  const sceneryBounds = {
    tree: [58, 159, 8], bush: [39, 33, 7], bench: [35, 39, 6],
    lamp: [25, 116, 5], sign: [26, 57, 6], bin: [17,31,6], visitors: [35,45,5]
  };

  function parkPlacement(item,z) {
    const projection = projectDepth(z);
    const {y,scale} = projection;
    const aspect = Math.min(1.12, width/height*.45+.69);
    // Once the anchor leaves the field, bound the scale so even tall trees can clear the screen on short viewports.
    const size = Math.min(scale, 1.35) * aspect * (.87 + item.variant%4*.075);
    const x = roadBoundary((item.side < 0 ? 0 : 3) + item.lateral, projection);
    const [halfWidth,top,bottom] = sceneryBounds[item.kind];
    return {x,y,scale:size, left:x-halfWidth*size, right:x+halfWidth*size, top:y-top*size, bottom:y+bottom*size};
  }

  function decorationFullyBelow(item,z) {
    return z>=0 && parkPlacement(item,z).top>height+8;
  }

  function drawParkMotion() {
    const top = projectDepth(0), bottom = roadSection(height*bottomRatio);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.lineTo(top.left,0); ctx.lineTo(top.left,top.y); ctx.lineTo(bottom.left,bottom.y); ctx.lineTo(0,bottom.y); ctx.closePath();
    ctx.moveTo(width,0); ctx.lineTo(top.right,0); ctx.lineTo(top.right,top.y); ctx.lineTo(bottom.right,bottom.y); ctx.lineTo(width,bottom.y); ctx.closePath();
    ctx.clip();
    const opacity = ctx.globalAlpha;
    // Distances are ordered at insertion, so reversing draws far to near.
    for (let i=parkLandmarks.length-1; i>=0; i--) {
      const item = parkLandmarks[i], z = state.travel-item.distance;
      if (z<0) continue;
      const place = parkPlacement(item,z);
      if (place.top>height || place.right<=0 || place.left>=width) continue;
      ctx.globalAlpha = opacity * Math.min(1,z/.18);
      art.scenery(item,place,reducedMotion.matches ? 0 : state.runClock);
    }
    ctx.restore();
  }

  function drawParkBackdrop() {
    const top = projectDepth(0);
    const sky = ctx.createLinearGradient(0,0,0,top.y*1.2);
    sky.addColorStop(0,'#c4dbd0');
    sky.addColorStop(1,'#fff0c7');
    ctx.fillStyle=sky;
    ctx.fillRect(0,0,width,height);
    art.ellipse(width*.76,top.y*.36,Math.min(22,width*.06),Math.min(22,width*.06),'#fff2bd');
    art.ellipse(width*.3,top.y*.33,width*.16,top.y*.08,'#fff8df88');
    art.ellipse(width*.55,top.y*.15,width*.10,top.y*.045,'#fff8df7f');
    art.skyline(width,top.y);
    for (let i=0;i<14;i++) {
      const x=width*(i+.1)/13, y=top.y*(.94+Math.sin(i*1.3)*.10);
      art.ellipse(x,y,width*(.055+(i%3)*.013),top.y*(.18+.055*(i%4)),i%2?'#91a78a':'#a6b794');
    }
    const grass=ctx.createLinearGradient(0,top.y,0,height);
    grass.addColorStop(0,'#c1cc97');
    grass.addColorStop(.55,'#aabd83');
    grass.addColorStop(1,'#859e6b');
    ctx.fillStyle=grass;
    ctx.fillRect(0,top.y,width,height-top.y);
    if (!reducedMotion.matches) drawParkAir(top.y);
  }

  function drawParkAir(horizon) {
    const clock=state.runClock;
    const flight=(clock+2)%15;
    if (flight<6) {
      const x=width*(.12+flight*.10), y=horizon*(.35+flight*.027);
      ctx.save();
      ctx.globalAlpha=Math.min(1,flight*2,(6-flight)*2)*.55;
      for (let i=0;i<2;i++) {
        const wing=2+Math.sin(clock*7+i)*2;
        art.line([[x+i*13,y+i*5],[x+4+i*13,y-wing+i*5],[x+8+i*13,y+i*5]],'#5d7163',1.25);
      }
      ctx.restore();
    }
  }

  function drawGroundDetail() {
    // A fixed scatter repeated over longitudinal distance, so texture and
    // landmarks advance at exactly the same rate as the game objects.
    const period=1.36, phase=state.travel%period;
    for (let i=0;i<88;i++) {
      const distance=(i*.13793+i%4*.013)%period;
      const z=(phase-distance+period)%period;
      if (z>1.02) continue;
      const p=projectDepth(z);
      const across=((i*37)%89+.5)/89;
      const roadside=i%5===0;
      const side=i%2===0?-1:1;
      const x=roadside ? (side<0?p.left:p.right)+side*p.laneWidth*(.14+across*.68) :
        p.left + (p.right-p.left)*across;
      const s=p.scale*(.65+(i%5)*.27);
      ctx.globalAlpha=Math.min(1,z/.22);
      art.ellipse(x,p.y,s*(roadside?3.1:1.6),s*(roadside?1.5:.8),
        roadside ? (i%3?'#66825180':'#eadb9cc0') : (i%3?'#aa8d613e':'#fff1c77e'));
    }
    // Grass tufts and small flower groups move with their verge, like the road texture.
    for (let i=0;i<38;i++) {
      const z=(phase-(i*.1013%period)+period)%period;
      if (z>1.018) continue;
      const p=projectDepth(z), side=i%2===0?-1:1;
      const offset=.32+((i*19)%37)*.016;
      const x=side<0?p.left*(1-offset):p.right+(width-p.right)*offset;
      const s=p.scale*(.65+(i%3)*.24);
      ctx.globalAlpha=Math.min(1,z/.19);
      art.ellipse(x,p.y,5*s,1.4*s,'#6b84545c');
      art.line([[x-3*s,p.y],[x-4.5*s,p.y-4*s],[x-2*s,p.y-2*s]],'#637e527d',Math.max(.5,s));
      art.line([[x,p.y],[x+3*s,p.y-5*s],[x+4*s,p.y-7*s]],'#6584538c',Math.max(.5,s));
      if (i%3===0) {
        art.ellipse(x+4*s,p.y-7*s,1.5*s,1.4*s,'#eee2ad');
        art.ellipse(x-4.5*s,p.y-4*s,1.3*s,1.3*s,'#d6b57e');
      }
    }
    ctx.globalAlpha=1;
    if (!reducedMotion.matches) {
      const clock=state.runClock, drift=(clock+3)%9;
      if (drift<4) {
        const z=.22+.09*drift, p=projectDepth(z);
        const x=p.left-p.laneWidth*(.31+.1*Math.sin(clock*2));
        ctx.save();
        ctx.globalAlpha=Math.min(drift,4-drift,1)*.75;
        art.ellipse(x,p.y-11,1.9,1.2,'#cc9e64');
        const wing=1.1+Math.abs(Math.sin(clock*8))*1.5;
        art.ellipse(x+2,p.y-13,wing,1.9,'#c9a77e');
        art.ellipse(x-11,p.y+drift*8,2.5,1.4,'#d3ab72');
        ctx.restore();
      }
    }
  }
  function polygon(points,fill){ctx.fillStyle=fill;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
  function rounded(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function building(x,y,w,h,fill){rounded(x,y,w,h,3,fill);ctx.fillStyle='#f9e9c9';for(let i=0;i<3;i++)for(let j=0;j<2;j++)ctx.fillRect(x+w*(.15+j*.48),y+13+i*h*.23,w*.19,h*.13);polygon([[x-4,y],[x+w/2,y-15],[x+w+4,y]],'#8e8c91');}
  function worldBackdrop(index){
    if(index===0){drawParkBackdrop();return;}
    const w=WORLDS[index],horizon=height*horizonRatio;
    const sky=ctx.createLinearGradient(0,0,0,height);sky.addColorStop(0,w.sky);sky.addColorStop(1,index===3?'#f6e8d4':'#e5f1e4');ctx.fillStyle=sky;ctx.fillRect(0,0,width,height);
    // Legacy inactive environments remain disabled in update().
    if(index===1){
      ctx.fillStyle='#a2c5c9';ctx.fillRect(0,horizon,width,height);
      ctx.fillStyle='#8cb7c5';ctx.fillRect(0,height*.67,width,height*.33);
      building(width*.015,height*.24,width*.21,height*.35,'#ddc8b3');building(width*.77,height*.22,width*.22,height*.38,'#d4bda7');
      ctx.strokeStyle='#e6d5bc';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,height*.69);ctx.quadraticCurveTo(width*.15,height*.59,width*.3,height*.69);ctx.moveTo(width*.7,height*.69);ctx.quadraticCurveTo(width*.86,height*.59,width,height*.69);ctx.stroke();
      for(const x of [width*.06,width*.94]){ctx.strokeStyle='#665e60';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,height*.63);ctx.lineTo(x,height*.40);ctx.stroke();ctx.fillStyle='#f6e6b6';ctx.beginPath();ctx.arc(x,height*.4,6,0,Math.PI*2);ctx.fill();}
    }else if(index===2){
      ctx.fillStyle='#8ed3ed';ctx.fillRect(0,horizon,width,height);
      ctx.fillStyle='#4da9cb';ctx.fillRect(0,height*.37,width,height*.42);
      polygon([[0,height*.63],[width*.3,height*.56],[width*.48,height*.75],[width*.65,height*.57],[width,height*.64],[width,height],[0,height]],'#f2dfac');
      polygon([[0,height*.84],[width*.23,height*.75],[width*.4,height],[0,height]],'#dcc88f');polygon([[width*.7,height],[width*.85,height*.76],[width,height*.82],[width,height]],'#e1c88d');
      ctx.strokeStyle='#91a76b';ctx.lineWidth=2;for(let i=0;i<12;i++){const x=width*(i+.4)/12,y=height*(.81+(i%3)*.055);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y-14);ctx.moveTo(x,y);ctx.lineTo(x+4,y-12);ctx.stroke();}
      ctx.fillStyle='#fff9e7';ctx.beginPath();ctx.arc(width*.82,height*.14,Math.min(24,width*.045),0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle='#ebd8c3';ctx.fillRect(0,horizon,width,height);
      ctx.fillStyle='#cba98e';ctx.fillRect(0,height*.73,width,height*.27);
      for(const x of [width*.06,width*.78]){rounded(x,height*.22,width*.17,height*.29,7,'#f7f0df');rounded(x+5,height*.25,width*.17-10,height*.22,3,'#a8d7df');ctx.strokeStyle='#eee4d3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+width*.085,height*.25);ctx.lineTo(x+width*.085,height*.47);ctx.stroke();}
      for(const x of [width*.12,width*.89]){rounded(x-11,height*.72,22,19,4,'#ba806a');ctx.fillStyle='#68966c';for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x+(i-1)*8,height*.69-i%2*9,8,14,(i-1)*.3,0,Math.PI*2);ctx.fill();}}
      rounded(width*.01,height*.84,width*.19,12,4,'#b68e75');rounded(width*.8,height*.84,width*.19,12,4,'#b68e75');
    }
  }
  function drawWorld(index){
    worldBackdrop(index);
    const w=WORLDS[index],top=projectDepth(0),bottom=roadSection(height*bottomRatio);
    const surface=ctx.createLinearGradient(0,top.y,0,bottom.y);
    surface.addColorStop(0,index===0?'#e8dcb0':w.road);
    surface.addColorStop(.68,index===0?'#dcc69e':w.road);
    surface.addColorStop(1,index===0?'#d2b98e':w.road);
    polygon([[top.left,top.y],[top.right,top.y],[bottom.right,bottom.y],[bottom.left,bottom.y]],surface);
    if(index===0) drawGroundDetail();
    // Static subtle lane separators and edges, shared by all four locations.
    for(let boundary=0;boundary<=3;boundary++){
      ctx.strokeStyle=boundary===0||boundary===3?'#fff3d46e':'#8e75572e';ctx.lineWidth=boundary===0||boundary===3?3:2;
      ctx.beginPath();ctx.moveTo(roadBoundary(boundary,top),top.y);ctx.lineTo(roadBoundary(boundary,bottom),bottom.y);ctx.stroke();
    }
  }
  function drawLocationLabel(){
    if(labelAge>=LABEL_TIME)return;
    const fadeIn=Math.min(1,labelAge/.35),fadeOut=Math.min(1,(LABEL_TIME-labelAge)/.65),alpha=Math.min(fadeIn,fadeOut);
    ctx.save();ctx.globalAlpha=alpha;
    const label=WORLDS[worldIndex].name;ctx.font=`700 ${Math.max(14,Math.min(19,width*.043))}px system-ui`;
    const textWidth=ctx.measureText(label).width,boxWidth=Math.min(width-24,textWidth+32),x=(width-boxWidth)/2,y=Math.max(3,height*horizonRatio*.43-13);
    rounded(x,y,boxWidth,38,18,'rgba(255,250,239,.92)');ctx.fillStyle='#654d4a';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,width/2,y+19,boxWidth-18);ctx.restore();
  }
  const propSize = 11 + CONFIG.contactZ * 38;
  const heartEffectTime = .29;
  const hitEffectTime = .25;

  function drawContactEffects(contact, reactionX) {
    let counterPulse = 0;
    const reduced = reducedMotion.matches;
    for (const effect of state.effects) {
      const heart = effect.kind === 'heart';
      const t = effect.age / (heart ? heartEffectTime : hitEffectTime);
      if (t>=1) continue;
      if (heart) counterPulse = Math.max(counterPulse, Math.sin(Math.PI*t));
      if (heart) {
        const pickupX = roadBoundary(effect.lane+.5,contact);
        art.contactEffect(pickupX,contact.y,contact.scale,t,true,reduced);
      } else {
        art.contactEffect(reactionX,contact.y+8*contact.scale,contact.scale,t,false,reduced);
      }
    }
    heartsUI.style.transform = reduced || counterPulse===0 ? '' : `scale(${1+counterPulse*.09})`;
  }

  function render(){
    ctx.clearRect(0,0,width,height);
    if(worldFade<WORLD_FADE&&previousWorld!==worldIndex){drawWorld(previousWorld);ctx.save();ctx.globalAlpha=worldFade/WORLD_FADE;drawWorld(worldIndex);ctx.restore();}
    else drawWorld(worldIndex);
    // Scenery and props are sorted around Katya's contact line.
    if (worldIndex===0) drawParkMotion();
    drawLocationLabel();

    const contact = projectDepth(CONFIG.contactZ);
    const x = roadBoundary(state.visualLane+.5, contact);
    const time = state.runClock;
    function drawObject(o) {
      if (o.handled || o.z<0 || o.z>1.08) return;
      const proj = projectDepth(o.z);
      const px = roadBoundary(o.lane+.5,proj);
      const size = propSize*proj.scale;
      const phase = reducedMotion.matches ? 0 : time*5 + o.id;
      if (o.kind==='heart') art.heart(px,proj.y,size,phase);
      else if (o.kind==='obstacle') art.obstacle(px,proj.y,size,o.id%3);
      else art.ring(px,proj.y,size,phase,.6+.4*Math.min(1,o.z/.16));
    }
    const visible = state.objects.filter(o=>!o.handled && o.z>=0 && o.z<=1.08).sort((a,b)=>a.z-b.z);
    // Hearts stay behind Katya even when their projected shapes overlap her.
    for (const o of visible) if (o.kind==='heart' || o.z<CONFIG.contactZ-.08) drawObject(o);

    const recentHeart = state.effects.find(e=>e.kind==='heart' && e.age<heartEffectTime);
    const hit = state.effects.find(e=>e.kind==='hit' && e.age<hitEffectTime);
    if (recentHeart) art.pickupGlow(x,contact.y,contact.scale,1-recentHeart.age/heartEffectTime);
    const reaction = hit ? 'hit' : recentHeart ? 'heart' : '';
    const stride = state.mode==='start' || state.mode==='won' ? 0 : state.travel*31;
    art.katya(x,contact.y+7*contact.scale,contact.scale,stride,state.lane-state.visualLane, reaction,
      state.mode==='won', hit && !reducedMotion.matches ? 1-hit.age/hitEffectTime : 0);

    for (const o of visible) if (o.kind!=='heart' && o.z>=CONFIG.contactZ-.08) drawObject(o);
    drawContactEffects(contact,x);
    if (state.mode==='won') {
      art.ring(x,contact.y-53*contact.scale,30*contact.scale,0,.9);
    }
    if(DEBUG_MOTION){
      const item=parkLandmarks.find(o=>state.travel-o.distance>=0);
      const heartObject=state.objects.find(o=>o.kind==='heart');
      ctx.save();ctx.fillStyle='rgba(31,40,34,.8)';ctx.fillRect(8,height-76,Math.min(width-16,310),68);
      ctx.fillStyle='#fff';ctx.font='12px monospace';ctx.textAlign='left';
      ctx.fillText(`worldSpeed: ${speed().toFixed(3)} / worldDistance: ${state.travel.toFixed(2)}`,14,height-55);
      ctx.fillText(`heart z: ${heartObject?.z.toFixed(2)??'-'} / park z: ${item?(state.travel-item.distance).toFixed(2):'-'}`,14,height-36);
      ctx.fillText(`park objects: ${parkLandmarks.length}`,14,height-17);ctx.restore();
    }
  }
  let drawnMode;
  function frame(time) {
    frameId=requestAnimationFrame(frame);
    const dt=lastTime===null ? 0 : Math.min(CONFIG.maxDelta,Math.max(0,(time-lastTime)/1000));
    lastTime=time;
    if (state.mode==='playing' && dt>0) update(dt);
    if (state.mode==='playing' || drawnMode!==state.mode) {
      render();
      drawnMode=state.mode;
    }
  }
  action.addEventListener('click',actionClick);document.querySelector('#left').addEventListener('click',()=>move(-1));document.querySelector('#right').addEventListener('click',()=>move(1));pauseButton.addEventListener('click',()=>{if(state.mode==='playing')setMode('paused');else if(state.mode==='paused')resume();});document.querySelector('#restart').addEventListener('click',restart);
  window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight',' ','Escape'].includes(e.key))e.preventDefault();if(e.repeat)return;if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='Escape'||e.key===' '){if(state.mode==='playing')setMode('paused');else if(state.mode==='paused')resume();}});
  stage.addEventListener('pointerdown',e=>{if(e.target!==canvas)return;swipeStart={x:e.clientX,y:e.clientY,id:e.pointerId};});stage.addEventListener('pointerup',e=>{if(!swipeStart||e.pointerId!==swipeStart.id)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;swipeStart=null;if(Math.abs(dx)>28&&Math.abs(dx)>Math.abs(dy)*1.2)move(dx>0?1:-1);});stage.addEventListener('pointercancel',()=>swipeStart=null);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='playing')setMode('paused');lastTime=null;});window.addEventListener('blur',()=>{if(state.mode==='playing')setMode('paused');lastTime=null;});window.addEventListener('resize',resize);resize();setMode('start');frameId=requestAnimationFrame(frame);
})();

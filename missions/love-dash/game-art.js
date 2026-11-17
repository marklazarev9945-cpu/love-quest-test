'use strict';

// Shapes and palette from index.html (.katya-sprite), in its original 40 × 80 viewBox.
function createDashArt(ctx) {
  const pose = {
    "leg-left": [["path", "m14 55-1 17", "none", "#809bae", 7.0, "round"], ["path", "M10 73h7", "none", "#eee4d3", 4.0, "round"]],
    "leg-right": [["path", "m25 55 1 17", "none", "#91a9b8", 7.0, "round"], ["path", "M23 73h7", "none", "#eee4d3", 4.0, "round"]],
    "arm-left": [["path", "m9 37-4 17", "none", "#927362", 6.0, "round"], ["circle", 5.0, 56.0, 3.0, "#edc7a1", null, 1.0, "round"]],
    "arm-right": [["path", "m31 37 4 12", "none", "#927362", 6.0, "round"], ["circle", 35.0, 51.0, 3.0, "#edc7a1", null, 1.0, "round"], ["path", "m35 48-2-5", "none", "#61745d", 2.0, "round"], ["circle", 31.0, 39.0, 5.0, "#dce6d1", "#61745d", 2.0, "round"]],
    "katya-face": [["ellipse", 20.0, 21.0, 10.0, 12.0, "#edc7a1", null, 1.0, "round"], ["path", "M9 22Q6 3 20 3q15 0 12 21l-5-12-6-4-10 13Z", "url(#katya-hair)", null, 1.0, "round"], ["path", "M13 11q-6 13-2 34m17-33q6 12 1 33", "none", "#d1b992", 2.0, "round"], ["path", "M15 22h.1m10 0h.1", "none", "#635746", 2.0, "round"], ["path", "M16 28q4 4 8 0", "#fff8e6", "#bc8d76", 0.7, "round"]],
    "body": [["path", "M7 22Q5 3 20 3q15 0 14 21l2 30H5Z", "url(#katya-hair)", null, 1.0, "round"], ["path", "M10 33q10-8 20 0l3 24q-13 6-26 0Z", "#85695a", null, 1.0, "round"], ["path", "M12 32q8 14 16 0", "none", "#a58975", 4.0, "round"], ["path", "M15 42v7m10-7v7M13 52q7 4 14 0", "none", "#b49b85", 1.0, "round"]],
  };
  for (const shapes of Object.values(pose)) {
    for (const shape of shapes) if (shape[0] === 'path') shape[1] = new Path2D(shape[1]);
  }
  const [hair, ...hoodie] = pose.body;
  const katyaHair = ctx.createLinearGradient(5, 5, 36, 54);
  katyaHair.addColorStop(0, '#837259');
  katyaHair.addColorStop(.5, '#ad9673');
  katyaHair.addColorStop(1, '#c6ae86');

  function ellipse(x, y, rx, ry, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function path(d, fill, stroke, weight = 1) {
    if (fill !== 'none') {
      ctx.fillStyle = fill === 'url(#katya-hair)' ? katyaHair : fill;
      if (d) ctx.fill(d);
      else ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = weight;
      if (d) ctx.stroke(d);
      else ctx.stroke();
    }
  }

  function shapes(list) {
    for (const [kind, ...data] of list) {
      if (kind === 'path') {
        const [d, fill, stroke, weight, cap] = data;
        ctx.lineCap = cap;
        path(d, fill, stroke, weight);
      } else {
        const [x, y, r] = data;
        const [ry, fill, stroke, weight] = kind === 'circle' ? [r, ...data.slice(3)] : data.slice(3);
        ctx.beginPath();
        ctx.ellipse(x, y, r, ry, 0, 0, Math.PI * 2);
        path(null, fill, stroke, weight);
      }
    }
  }

  function limb(name, x, y, angle, lift = 0) {
    ctx.save();
    ctx.translate(x, y - lift);
    ctx.rotate(angle);
    ctx.translate(-x, -y);
    shapes(pose[name]);
    ctx.restore();
  }

  function katya(x, y, scale, stride, changingLane, reaction, won, recoil) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ellipse(0, 1, 14, 3.7, '#5c53422d');
    const step = Math.sin(stride);
    ctx.translate(0, -1 - Math.abs(step) * 1.8 - (reaction === 'heart' ? 1 : 0));
    ctx.rotate(changingLane * .08 - recoil * .05);
    ctx.translate(-20, -76);
    if (reaction === 'hit') ctx.globalAlpha = .81 + .16 * (1-recoil);
    shapes([hair]);
    limb('leg-left', 14, 55, step * .35, Math.max(0, -step) * 5);
    limb('leg-right', 25, 55, -step * .35, Math.max(0, step) * 5);
    shapes(hoodie);
    limb('arm-left', 9, 37, won ? .95 : -step * .24);
    limb('arm-right', 31, 37, won ? -.54 : step * .24);
    limb('katya-face', 20, 27, step * .035);
    ctx.restore();
  }

  function line(points, ink, weight) {
    ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ink;
    ctx.lineWidth = weight;
    ctx.stroke();
  }

  function shape(points, ink) {
    ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();
    ctx.fillStyle = ink;
    ctx.fill();
  }

  function rect(x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
    ctx.fillStyle=fill;
    ctx.fill();
  }

  function tree(variant, sway) {
    const tall = variant % 3;
    const crownY = [-83, -106, -68][tall];
    const tones = [
      ['#597650','#79945c','#a5b775'], ['#4f755f','#70977a','#acc19a'],
      ['#6d8050','#8f9f5d','#bdbe79']
    ][tall];
    ellipse(7, 0, 36, 6, '#53633d36');
    shape([[-8,0],[-4,-69],[-7,crownY+6],[5,crownY+6],[8,-39],[11,0]], '#876d52');
    line([[-4,-7],[-1,-46],[-12,-73]], '#b28c64', 2.5);
    line([[3,-39],[18,-67],[21,crownY+5]], '#80694b', 4);
    ctx.save();
    ctx.translate(0,crownY);
    ctx.rotate(sway);
    const form = tall===1 ? [[-19,0,20,24],[5,-16,23,32],[22,5,21,26]] :
      tall===2 ? [[-23,6,25,21],[2,-12,32,29],[28,8,25,21]] :
      [[-22,0,21,26],[6,-13,28,30],[27,3,19,24]];
    for (const [x,y,rx,ry] of form) {
      ellipse(x,y+5,rx,ry,tones[0]);
      ellipse(x-3,y-2,rx*.93,ry*.89,tones[1]);
      ellipse(x-7,y-9,rx*.66,ry*.53,tones[2]);
      ellipse(x+6,y-5,2.8,1.2,'#e7d79885');
    }
    ctx.restore();
  }

  function bush(variant) {
    ellipse(0,0,36,6,'#52683d3a');
    ellipse(-17,-11,18,13,'#6d8957');
    ellipse(8,-13,24,16,'#7e9b63');
    ellipse(4,-19,15,8,'#abb77a');
    for(let i=0;i<5;i++){
      const x=-21+i*10,y=-8-(i*13+variant)%12;
      ellipse(x,y,2.4,2.1,i%2?'#f8e5b1':'#d4b484');
    }
  }

  function bench() {
    ellipse(0,0,34,5,'#52683d40');
    line([[-23,-32],[-21,-5],[-27,0]],'#55675a',4);
    line([[23,-32],[21,-5],[27,0]],'#55675a',4);
    rect(-31,-34,62,7,2,'#a67959');
    rect(-31,-24,62,6,2,'#bb936c');
    rect(-32,-13,64,6,2,'#8f694c');
    line([[-28,-31],[27,-31]],'#d4ad7f',1.2);
  }

  function lamp() {
    ellipse(5,0,22,4.2,'#596d4b31');
    line([[0,0],[0,-85]],'#546658',4.5);
    line([[-7,-1],[7,-1]],'#677366',4);
    ellipse(0,-94,18,19,'#ffecc647');
    shape([[-9,-99],[0,-108],[9,-99],[6,-85],[-6,-85]],'#5e6f60');
    shape([[-5,-98],[5,-98],[4,-88],[-4,-88]],'#f7dc9c');
    line([[0,-98],[0,-87]],'#b59364',1.2);
  }

  function sign(side) {
    ellipse(3,0,20,4,'#596d4b31');
    line([[0,-2],[0,-54]],'#8b7151',4);
    shape([[-17*side,-52],[11*side,-52],[22*side,-45],[11*side,-38],[-17*side,-38]],'#b89265');
    line([[-10*side,-45],[11*side,-45]],'#f5e5bc',1.5);
    rect(-19,-35,31,9,2,'#828f70');
  }

  function bin() {
    ellipse(4,0,16,4,'#596d4b31');
    shape([[-11,-26],[11,-26],[8,0],[-8,0]],'#627464');
    for(const x of [-5,0,5]) line([[x,-21],[x*.8,-4]],'#9ca28a',1.2);
    rect(-13,-28,26,5,2,'#4b6053');
  }

  function person(x, color, phase) {
    ellipse(x,0,9,2.4,'#58694c45');
    const step=Math.sin(phase)*3;
    line([[x-3,-15],[x-4+step,-1]],'#595e55',3.5);
    line([[x+3,-15],[x+4-step,-1]],'#6a6b5d',3.5);
    shape([[x-7,-11],[x-5,-29],[x+5,-29],[x+8,-12]],color);
    ellipse(x,-34,6,7,'#dfb68c');
    ellipse(x-1,-38,6,4,'#786451');
  }

  function visitors(variant, clock) {
    const phase=clock*7+variant;
    person(-12,'#ac8269',phase);
    if(variant%2===0) person(10,'#778e77',phase+1.2);
    else {
      line([[-7,-17],[5,-10],[17,-8]],'#837153',1.2);
      ellipse(19,-7,9,4.5,'#a46b49');
      ellipse(12,-10,4,5,'#986043');
      line([[16,-6],[15,-2],[26,-2],[26,-7],[31,-10]],'#a46b49',2.3);
    }
  }

  function scenery(item, placement, clock) {
    const {x,y,scale}=placement;
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(scale,scale);
    const {kind,variant,side}=item;
    if(kind==='tree') tree(variant,Math.sin(clock*1.05+variant)*.035);
    else if(kind==='lamp') lamp();
    else if(kind==='bench') bench();
    else if(kind==='sign') sign(side);
    else if(kind==='bin') bin();
    else if(kind==='visitors') visitors(variant,clock);
    else bush(variant);
    ctx.restore();
  }

  const heartShape = new Path2D('M0 13C-8 7-18-2-14-10C-10-19-2-16 0-10C4-17 13-18 16-9C20 0 9 9 0 13Z');
  function heart(x,y,size,phase) {
    ctx.save();
    ctx.translate(x,y);
    const s=size/30*(1+.045*Math.sin(phase));
    ctx.scale(s,s);
    ellipse(1,10,13,3,'#81544939');
    path(heartShape,'#be4564','#fff1da',2);
    ellipse(-7,-9,3.3,1.9,'#ffe0df');
    ctx.restore();
  }

  const branches = [
    {
      trunk: [[-24,5],[-12,1],[1,3],[15,-3],[24,-6]],
      forks: [[[-10,1],[-14,-10],[-20,-15]],[[5,1],[14,8],[21,11]]]
    },
    {
      trunk: [[-24,7],[-13,4],[-4,-3],[10,-3],[22,-10]],
      forks: [[[-4,-3],[-8,-11],[-5,-16]],[[10,-3],[17,5],[23,6]]]
    },
    {
      trunk: [[-24,-4],[-13,-1],[1,7],[13,5],[23,0]],
      forks: [[[-13,-1],[-9,-10],[0,-14]],[[3,7],[9,-1],[11,-12]],[[12,5],[18,10]]]
    }
  ];

  function obstacle(x,y,size,variant) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(size/44,size/44);
    ellipse(2,11,25,4.8,'#604e3d40');
    const {trunk,forks} = branches[variant];
    for (const fork of forks) {
      line(fork,'#634a37',4.5);
      const [tipX,tipY] = fork[fork.length-1];
      ellipse(tipX,tipY,1.65,1.65,'#c59b70');
    }
    line(trunk,'#624735',9);
    line(trunk.map(([px,py])=>[px,py-1.3]),'#946c4b',4);
    const [tipX,tipY] = trunk[trunk.length-1];
    ellipse(tipX,tipY,2.5,3.2,'#d1a779');
    ctx.restore();
  }

  // Conservative lower outline including the stroke and the maximum pulse.
  function heartBottom(size) { return 14 * (size/30) * 1.045; }
  const katyaClearance = 76;

  function pickupGlow(x,y,scale,strength) {
    ellipse(x,y+6*scale,25*scale,8*scale,`rgba(251,225,169,${.38*strength})`);
  }

  function contactEffect(x,y,scale,t,heart,reduced) {
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(scale,scale);
    ctx.globalAlpha = 1-t;
    const spread = 1-(1-t)**2;
    if (heart) {
      ctx.font='bold 15px system-ui';
      ctx.fillStyle='#81425a';
      ctx.textAlign='center';
      ctx.fillText('+1',18,-10-(reduced?0:spread*8));
      if (!reduced) {
        for (let i=0;i<6;i++) {
          const angle = Math.PI*(.14+i*.144);
          ctx.save();
          ctx.translate(Math.cos(angle)*(4+22*spread),-Math.sin(angle)*(3+18*spread)-3);
          ctx.rotate((i-2.5)*.22);
          const size=.12-.04*t;
          ctx.scale(size,size);
          path(heartShape,i%2?'#bd6077':'#e5a497');
          ctx.restore();
        }
      }
    } else {
      ellipse(0,0,18+spread*7,6+spread*3,'#a9515839');
      if (!reduced) {
        for (let i=0;i<5;i++) {
          const angle=Math.PI*2*i/5;
          ellipse(Math.cos(angle)*(12+spread*15),Math.sin(angle)*(4+spread*8),2.3-t,1.5-t*.55,i%2?'#bc7f63':'#995b4c');
        }
      }
    }
    ctx.restore();
  }

  function skyline(width,horizon) {
    const towers = [
      [.839,.44,.044,'#acb2a1'], [.889,.52,.046,'#a6ae9e'], [.944,.39,.039,'#b2b2a1']
    ];
    const foot=horizon*1.02;
    towers.forEach(([left,height,span,fill],index)=>{
      const x=left*width,w=span*width,h=horizon*height,y=foot-h;
      rect(x,y,w,h,1,fill);
      rect(x+w*.08,y-h*.035,w*.82,h*.07,1,fill);
      const columns=index===2?2:3;
      for (let row=0;row<5;row++) {
        for (let col=0;col<columns;col++) {
          rect(x+w*(.13+.26*col),y+h*(.11+.157*row),w*.13,h*.065,.5,'#e3e2ce85');
        }
      }
    });
  }

  function ring(x,y,size,phase,visibility=1) {
    ctx.save();
    ctx.translate(x,y);
    const s=size/45;
    ctx.scale(s,s);
    ctx.globalAlpha=visibility;
    ellipse(0,-2,24+Math.sin(phase)*2,23,'#fff1aa63');
    ellipse(0,-2,20,19,'#fff1aa42');
    ctx.beginPath();
    ctx.ellipse(0,4,12,11,0,0,Math.PI*2);
    path(null,'none','#8c603b',5.5);
    path(null,'none','#f6ce70',3.8);
    shape([[-9,-12],[-5,-18],[5,-18],[9,-12],[0,-5]],'#526d65');
    shape([[-7,-12],[-4,-16],[4,-16],[7,-12],[0,-7]],'#daf1e8');
    line([[-2,-15],[0,-12],[-1,-9]],'#fffbe6',1.2);
    line([[14,-16],[19,-16]],'#fff6cc',1.5);
    line([[16.5,-19],[16.5,-13]],'#fff6cc',1.5);
    ctx.restore();
  }

  return {katya, katyaClearance, scenery, heart, heartBottom, obstacle, ring, pickupGlow, contactEffect, skyline, ellipse, line, shape, rect};
}

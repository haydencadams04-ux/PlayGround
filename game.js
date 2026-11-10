(() => {
  'use strict';
  const canvas = document.querySelector('#scene'), ctx = canvas.getContext('2d');
  const portrait = document.querySelector('#portrait'), pctx = portrait.getContext('2d');
  const minimap = document.querySelector('#minimap'), mctx = minimap.getContext('2d');
  const $ = (s) => document.querySelector(s);
  const rand = (a,b) => Math.random()*(b-a)+a;
  const pick = (a) => a[Math.floor(Math.random()*a.length)];
  const palettes = [
    {floor:'#37343a',floor2:'#3c383d',wall:'#534b49',side:'#373139',edge:'#776658',glow:'#d88b49',mist:'#88717b'},
    {floor:'#34383b',floor2:'#383e40',wall:'#4b5250',side:'#303638',edge:'#67746b',glow:'#8bd7c6',mist:'#638f8b'},
    {floor:'#3c3438',floor2:'#41373b',wall:'#55444a',side:'#382f38',edge:'#80616a',glow:'#d36e8f',mist:'#95657e'}
  ];
  const outfits = {Warden:{coat:'#687a78',trim:'#bc9161',hair:'#b08b65'},Ranger:{coat:'#75825a',trim:'#c58b54',hair:'#d0b38b'},Arcanist:{coat:'#66628a',trim:'#d8b772',hair:'#aaa1c1'}};
  let W=480,H=270,px=0,py=0,tick=0,selectedClass='Warden',heroName='Ash',gameState='title';
  let dungeon=[],size=41,player,enemies=[],relics=[],exitCell=null,palette=palettes[0],cameraShake=0,toastTimer=0,attackTimer=0,dodgeTimer=0,damageTimer=0,paused=false,moveKeys={},touch={},soundOn=true,audioCtx=null,lastTime=0,stars=[];

  function resize(){
    W=Math.max(300,Math.round(innerWidth/2.5)); H=Math.max(190,Math.round(innerHeight/2.5));
    canvas.width=W; canvas.height=H;
    ctx.imageSmoothingEnabled=false;
  }
  addEventListener('resize',resize); resize();
  function carve(x,y){if(x>=0&&y>=0&&x<size&&y<size)dungeon[y][x]=1;}
  function generate(){
    size=41; dungeon=Array.from({length:size},()=>Array(size).fill(0));
    const startX=Math.floor((size-2)/2),startY=Math.floor((size-2)/2);const stack=[[startX,startY]]; carve(startX,startY);
    while(stack.length){let [x,y]=stack[stack.length-1],opts=[];for(const [dx,dy] of [[2,0],[-2,0],[0,2],[0,-2]])if(x+dx>0&&y+dy>0&&x+dx<size-1&&y+dy<size-1&&!dungeon[y+dy][x+dx])opts.push([dx,dy]);if(!opts.length){stack.pop();continue}let [dx,dy]=pick(opts);carve(x+dx/2,y+dy/2);carve(x+dx,y+dy);stack.push([x+dx,y+dy]);}
    for(let i=0;i<64;i++){let x=2+Math.floor(Math.random()*(size-4)),y=2+Math.floor(Math.random()*(size-4));if(dungeon[y][x]&&Math.random()<.54){if(Math.random()<.5)carve(x+1,y);else carve(x,y+1)}}
    // Small chambers are cut into the wandering corridors.
    for(let i=0;i<13;i++){let x=3+Math.floor(Math.random()*(size-7)),y=3+Math.floor(Math.random()*(size-7));if(dungeon[y][x])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(Math.random()>.13)carve(x+dx,y+dy)}
    const start={x:startX,y:startY},dist=distances(start);let floors=[];for(let y=1;y<size-1;y++)for(let x=1;x<size-1;x++)if(dungeon[y][x])floors.push({x,y,d:dist[y][x]||0});
    const far=[...floors].sort((a,b)=>b.d-a.d);exitCell=far[0];
    player={x:startX+.5,y:startY+.5,hp:100,maxHp:100,faceX:1,faceY:0,speed:3.05,invuln:0,walk:0,relics:0,kills:0};
    const relicSpots=[];for(const f of far){if(f.d<12)break;if(relicSpots.every(r=>Math.hypot(f.x-r.x,f.y-r.y)>8))relicSpots.push(f);if(relicSpots.length===3)break}
    relics=relicSpots.map((c,i)=>({...c,got:false,phase:i*2.2}));
    const used=new Set([`${startX},${startY}`,`${exitCell.x},${exitCell.y}`,...relicSpots.map(r=>`${r.x},${r.y}`)]);
    enemies=[];for(let i=0;i<Math.min(11,Math.floor(floors.length/30));i++){let c=pick(floors.filter(f=>f.d>7&&!used.has(`${f.x},${f.y}`)));if(!c)continue;used.add(`${c.x},${c.y}`);enemies.push({x:c.x+.5,y:c.y+.5,hp:2,max:2,phase:rand(0,7),speed:rand(.45,.7),alert:false,hit:0})}
    palette=pick(palettes);stars=Array.from({length:35},()=>({x:rand(0,W),y:rand(0,H),a:rand(.1,.55),s:rand(.3,1)}));
  }
  function distances(start){let out=Array.from({length:size},()=>Array(size).fill(-1)),q=[start];out[start.y][start.x]=0;for(let i=0;i<q.length;i++){const c=q[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let x=c.x+dx,y=c.y+dy;if(x>=0&&y>=0&&x<size&&y<size&&dungeon[y][x]&&out[y][x]<0){out[y][x]=out[c.y][c.x]+1;q.push({x,y})}}}return out}
  function isFloor(x,y){return x>=0&&y>=0&&x<size&&y<size&&dungeon[Math.floor(y)]?.[Math.floor(x)]===1}
  function drawPortrait(){pctx.clearRect(0,0,96,120);let o=outfits[selectedClass];pctx.fillStyle='#342b2b';pctx.fillRect(10,82,76,38);pctx.fillStyle='#594334';pctx.fillRect(17,91,62,29);pctx.fillStyle='#211c21';pctx.fillRect(31,22,34,32);pctx.fillStyle=o.hair;pctx.fillRect(30,18,36,19);pctx.fillRect(28,26,6,16);pctx.fillRect(62,23,5,20);pctx.fillStyle='#d3ab82';pctx.fillRect(34,30,28,30);pctx.fillRect(30,37,5,10);pctx.fillRect(61,37,5,10);pctx.fillStyle='#30252a';pctx.fillRect(39,42,4,3);pctx.fillRect(54,42,4,3);pctx.fillStyle='#8c5549';pctx.fillRect(45,53,8,2);pctx.fillStyle=o.coat;pctx.fillRect(27,62,42,32);pctx.fillRect(20,66,12,25);pctx.fillRect(64,66,12,25);pctx.fillStyle=o.trim;pctx.fillRect(45,62,5,31);pctx.fillRect(30,74,35,3);pctx.fillStyle='#25232a';pctx.fillRect(31,92,14,20);pctx.fillRect(51,92,14,20);pctx.fillStyle='#8b765f';pctx.fillRect(27,110,21,5);pctx.fillRect(49,110,21,5);pctx.fillStyle='rgba(243,185,112,.25)';pctx.fillRect(0,0,96,4)}
  function setClass(c){selectedClass=c;document.querySelectorAll('.class-card').forEach(b=>b.classList.toggle('selected',b.dataset.class===c));drawPortrait()}
  document.querySelectorAll('.class-card').forEach(b=>b.addEventListener('click',()=>setClass(b.dataset.class)));
  $('#hero-name').addEventListener('input',e=>heroName=e.target.value.trim().slice(0,14)||'Ash');drawPortrait();

  function tileDiamond(x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-h/2);ctx.lineTo(x+w/2,y);ctx.lineTo(x,y+h/2);ctx.lineTo(x-w/2,y);ctx.closePath();ctx.fill()}
  function project(x,y,cx,cy,tw,th){return {x:cx+(x-y)*tw,y:cy+(x+y)*th}}
  function drawFloor(tx,ty,sx,sy,tw,th){
    let checker=(tx*13+ty*7)%7===0;tileDiamond(sx,sy,tw*2,th*2,checker?palette.floor2:palette.floor);
    if((tx*3+ty*5)%29===2){ctx.fillStyle='#66584d';ctx.fillRect(sx-2,sy-1,4,1);ctx.fillRect(sx+1,sy+1,2,1)}
    if((tx*11+ty*3)%53===9){ctx.fillStyle='#242228';ctx.fillRect(sx-4,sy,1,1);ctx.fillRect(sx+3,sy-2,2,1)}
  }
  function drawWall(sx,sy,tw,th,hash){
    const hh=16+((hash*13)%4);ctx.fillStyle=palette.side;ctx.beginPath();ctx.moveTo(sx-tw,sy);ctx.lineTo(sx,sy+th);ctx.lineTo(sx,sy+th+hh);ctx.lineTo(sx-tw,sy+hh);ctx.closePath();ctx.fill();
    ctx.fillStyle=hash%3===0?'#423a3c':'#494143';ctx.beginPath();ctx.moveTo(sx,sy+th);ctx.lineTo(sx+tw,sy);ctx.lineTo(sx+tw,sy+hh);ctx.lineTo(sx,sy+th+hh);ctx.closePath();ctx.fill();
    ctx.fillStyle=palette.wall;ctx.beginPath();ctx.moveTo(sx,sy-th);ctx.lineTo(sx+tw,sy);ctx.lineTo(sx,sy+th);ctx.lineTo(sx-tw,sy);ctx.closePath();ctx.fill();
    ctx.strokeStyle=palette.edge;ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(sx,sy-th+2);ctx.lineTo(sx+tw-2,sy+1);ctx.lineTo(sx,sy+th-2);ctx.stroke();ctx.globalAlpha=1;
    if(hash%9===1){ctx.fillStyle='#88734f';ctx.fillRect(sx-2,sy-hh+4,3,2)}
  }
  function drawTorch(x,y,phase){const p=project(x,y,camX,camY,tw,th),flick=Math.sin(tick*9+phase)*1.5;ctx.fillStyle='#30272a';ctx.fillRect(p.x-1,p.y-13,2,9);ctx.fillStyle='#de8e48';ctx.fillRect(p.x-2,p.y-18+flick,4,6);ctx.fillStyle='#ffe2a1';ctx.fillRect(p.x-1,p.y-17+flick,2,3);}
  let camX=0,camY=0,tw=11,th=5.5;
  function drawScene(dt){
    tick+=dt;ctx.fillStyle='#17151c';ctx.fillRect(0,0,W,H);
    if(!dungeon.length)return;
    tw=Math.max(8,Math.min(12,W/43));th=tw*.5;
    camX=W/2-(player.x-player.y)*tw;camY=H*.68-(player.x+player.y)*th;
    const px0=Math.floor(player.x),py0=Math.floor(player.y);
    // painter's order: floor, props and walls follow the same diagonal depth.
    for(let sum=px0+py0-22;sum<=px0+py0+22;sum++)for(let x=Math.max(0,px0-22);x<Math.min(size,px0+23);x++){let y=sum-x;if(y<Math.max(0,py0-22)||y>=Math.min(size,py0+23))continue;let p=project(x+.5,y+.5,camX,camY,tw,th);if(p.x< -tw*2||p.x>W+tw*2||p.y< -45||p.y>H+30)continue;
      if(dungeon[y][x]){drawFloor(x,y,p.x,p.y,tw,th);if((x*7+y*13)%47===2)drawTorch(x+.5,y+.5,(x+y)%8)}else if(dungeon[y]?.[x-1]||dungeon[y-1]?.[x])drawWall(p.x,p.y,tw,th,(x*31+y*73)%97);
    }
    drawObjects();drawHero();drawAtmosphere();
  }
  function drawObjects(){
    // Lanterns, the sealed gate, relics and wandering shades are tiny pixel-art billboards.
    for(const r of relics){if(r.got)continue;const p=project(r.x+.5,r.y+.5,camX,camY,tw,th),bob=Math.sin(tick*2.7+r.phase)*2;ctx.globalAlpha=.35;ctx.fillStyle=palette.glow;ctx.fillRect(p.x-5,p.y-2,10,3);ctx.globalAlpha=1;ctx.fillStyle='#75533c';ctx.fillRect(p.x-1,p.y-8+bob,2,7);ctx.fillStyle='#f0bd68';ctx.fillRect(p.x-3,p.y-14+bob,6,6);ctx.fillStyle='#fff0b5';ctx.fillRect(p.x-1,p.y-12+bob,2,3);}
    const ep=project(exitCell.x+.5,exitCell.y+.5,camX,camY,tw,th),pulse=.5+Math.sin(tick*2)*.18;ctx.globalAlpha=.2+pulse*.16;ctx.fillStyle=player.relics>=3?'#f4cf82':'#835c42';ctx.fillRect(ep.x-10,ep.y-15,20,20);ctx.globalAlpha=1;ctx.fillStyle='#42363a';ctx.fillRect(ep.x-7,ep.y-27,14,25);ctx.fillStyle='#806b57';ctx.fillRect(ep.x-9,ep.y-28,18,3);ctx.fillStyle=player.relics>=3?'#e7bd72':'#715444';ctx.fillRect(ep.x-4,ep.y-23,8,19);ctx.fillStyle='#d5b27b';ctx.fillRect(ep.x-1,ep.y-14,2,3);
    for(const e of enemies){if(e.hp<=0)continue;const p=project(e.x,e.y,camX,camY,tw,th),f=Math.sin(tick*5+e.phase);ctx.fillStyle='#211c21';ctx.fillRect(p.x-5,p.y-2,10,3);ctx.fillStyle=e.hit>0?'#ead9bd':'#34303a';ctx.fillRect(p.x-4,p.y-14+f,8,11);ctx.fillStyle=e.hit>0?'#ffdab0':'#554551';ctx.fillRect(p.x-3,p.y-19+f,6,7);ctx.fillStyle='#d18c6a';ctx.fillRect(p.x-2,p.y-16+f,1,1);ctx.fillRect(p.x+1,p.y-16+f,1,1);ctx.fillStyle='#665253';ctx.fillRect(p.x-5,p.y-8+f,2,6);ctx.fillRect(p.x+3,p.y-8+f,2,6);if(e.hp<e.max){ctx.fillStyle='#29232a';ctx.fillRect(p.x-5,p.y-23,10,2);ctx.fillStyle='#d27666';ctx.fillRect(p.x-5,p.y-23,Math.max(1,10*e.hp/e.max),2)}}
  }
  function drawHero(){
    const p=project(player.x,player.y,camX,camY,tw,th),o=outfits[selectedClass],moving=player.walk>0.1,step=moving?Math.sin(tick*13)*2:Math.sin(tick*2)*.35;
    ctx.fillStyle='#0c0b10';ctx.globalAlpha=.44;ctx.fillRect(p.x-7,p.y-2,14,3);ctx.globalAlpha=1;
    if(dodgeTimer>0){ctx.globalAlpha=.42;ctx.fillStyle='#e7c585';ctx.fillRect(p.x-9,p.y-24,18,23);ctx.globalAlpha=1}
    ctx.fillStyle='#28232a';ctx.fillRect(p.x-5,p.y-9+step,4,8);ctx.fillRect(p.x+1,p.y-9-step,4,8);ctx.fillStyle='#887058';ctx.fillRect(p.x-6,p.y-2+step,5,2);ctx.fillRect(p.x+1,p.y-2-step,5,2);
    ctx.fillStyle=o.coat;ctx.fillRect(p.x-7,p.y-22,14,14);ctx.fillRect(p.x-9,p.y-20+step,3,10);ctx.fillRect(p.x+6,p.y-20-step,3,10);ctx.fillStyle=o.trim;ctx.fillRect(p.x-1,p.y-22,3,13);ctx.fillRect(p.x-7,p.y-12,14,2);
    ctx.fillStyle='#34272a';ctx.fillRect(p.x-5,p.y-30,10,9);ctx.fillStyle=o.hair;ctx.fillRect(p.x-5,p.y-32,10,5);ctx.fillRect(p.x-6,p.y-29,2,5);ctx.fillRect(p.x+4,p.y-29,2,5);
    // A little carried lantern supplies the warm pool of light.
    const lx=p.x+player.faceX*7+5,ly=p.y-15+player.faceY*2;ctx.fillStyle='#5e4937';ctx.fillRect(lx-1,ly,3,4);ctx.fillStyle='#e4a957';ctx.fillRect(lx,ly-3,2,3);ctx.fillStyle='#fff0b6';ctx.fillRect(lx,ly-2,1,1);
    if(attackTimer>0){ctx.globalAlpha=Math.min(1,attackTimer*3);ctx.strokeStyle='#f1d293';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x+player.faceX*8,p.y-16,9, -1.5+tick*3,1.2+tick*3);ctx.stroke();ctx.globalAlpha=1}
    if(player.invuln>0&&Math.floor(tick*18)%2===0){ctx.fillStyle='#fff4d7';ctx.fillRect(p.x-7,p.y-32,14,30)}
  }
  function drawAtmosphere(){
    const p=project(player.x,player.y,camX,camY,tw,th),g=ctx.createRadialGradient(p.x,p.y-15,8,p.x,p.y-15,Math.min(W,H)*.47);g.addColorStop(0,'rgba(15,13,16,0)');g.addColorStop(.5,'rgba(15,13,16,.12)');g.addColorStop(1,'rgba(8,8,13,.75)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(p.x+5,p.y-21,2,p.x+5,p.y-21,Math.min(W,H)*.2);glow.addColorStop(0,'rgba(255,190,103,.13)');glow.addColorStop(1,'rgba(255,174,88,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    if(gameState==='title'){for(const s of stars){ctx.globalAlpha=s.a*(.65+.35*Math.sin(tick*s.s+s.x));ctx.fillStyle='#f2d5a5';ctx.fillRect(s.x,s.y,1,1)}ctx.globalAlpha=1}
  }
  function blocked(x,y){return !isFloor(x,y)}
  function movePlayer(dx,dy,dt){
    if(!dx&&!dy){player.walk=Math.max(0,player.walk-dt*4);return}
    const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;player.faceX=dx;player.faceY=dy;
    let speed=player.speed*(dodgeTimer>0?2.45:1);let nx=player.x+dx*speed*dt,ny=player.y+dy*speed*dt;
    if(!blocked(nx+Math.sign(dx)*.24,player.y)&&!blocked(nx,player.y))player.x=nx;
    if(!blocked(player.x,ny+Math.sign(dy)*.24)&&!blocked(player.x,ny))player.y=ny;
    player.walk=Math.min(1,player.walk+dt*5);
  }
  function attack(){if(gameState!=='play'||paused||attackTimer>.2)return;attackTimer=.4;playTone(240,.07,'square',.025);let hit=false;for(const e of enemies){if(e.hp<=0)continue;const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);if(d<1.6&&(dx*player.faceX+dy*player.faceY)>-.25){e.hp--;e.hit=.14;hit=true;if(e.hp<=0){player.kills++;if(Math.random()<.22)player.hp=Math.min(player.maxHp,player.hp+10)}}}if(hit){playTone(130,.1,'triangle',.04);hud();}}
  function dodge(){if(gameState==='play'&&!paused&&dodgeTimer<=0){dodgeTimer=.36;player.invuln=.42;playTone(360,.09,'triangle',.025)}}
  function takeDamage(){if(player.invuln>0)return;player.hp=Math.max(0,player.hp-13);player.invuln=.8;damageTimer=.18;cameraShake=3;$('#combat-flash').classList.add('hit');setTimeout(()=>$('#combat-flash').classList.remove('hit'),100);playTone(75,.13,'sawtooth',.04);hud();if(player.hp<=0)finish(false)}
  function showToast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');toastTimer=2.2}
  function hud(){
    $('#health-text').textContent=`${player.hp} / ${player.maxHp}`;$('#health-fill').style.width=`${100*player.hp/player.maxHp}%`;
    $('#relic-count').textContent=`${player.relics} / 3`;$('#objective-text').textContent=player.relics<3?'Seek the three ember relics.':'The sealed gate is open. Find your way out.';
  }
  function updateGame(dt){
    if(paused)return;
    if(attackTimer>0)attackTimer-=dt;if(dodgeTimer>0)dodgeTimer-=dt;if(player.invuln>0)player.invuln-=dt;if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('#toast').classList.remove('show')}
    let dx=(moveKeys.d||moveKeys.ArrowRight?1:0)-(moveKeys.a||moveKeys.ArrowLeft?1:0)+(touch.right?1:0)-(touch.left?1:0);
    let dy=(moveKeys.s||moveKeys.ArrowDown?1:0)-(moveKeys.w||moveKeys.ArrowUp?1:0)+(touch.down?1:0)-(touch.up?1:0);movePlayer(dx,dy,dt);
    for(const e of enemies){if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);const d=Math.hypot(player.x-e.x,player.y-e.y);if(d<7){e.alert=true;if(d>0.63){let ax=(player.x-e.x)/d,ay=(player.y-e.y)/d,ex=e.x+ax*e.speed*dt,ey=e.y+ay*e.speed*dt;if(isFloor(ex+ax*.2,e.y))e.x=ex;if(isFloor(e.x,ey+ay*.2))e.y=ey}else if(player.invuln<=0)takeDamage()}}
    for(const r of relics){if(!r.got&&Math.hypot(player.x-(r.x+.5),player.y-(r.y+.5))<.8){r.got=true;player.relics++;playTone(590,.18,'sine',.04);playTone(880,.23,'sine',.025);showToast(['A memory of fire returns.','The dark grows thinner.','The old seal is waking.'][player.relics-1]);hud();if(player.relics===3)showToast('The gate is unsealed. Find the way out.')}}
    if(Math.hypot(player.x-(exitCell.x+.5),player.y-(exitCell.y+.5))<1){if(player.relics>=3)finish(true);else if(Math.random()<dt*.55)showToast('Three relics are needed to open the gate.')}
    if(cameraShake>0)cameraShake=Math.max(0,cameraShake-dt*18);
  }
  function drawMap(){
    const n=19,cell=100/n,ox=Math.floor(player.x),oy=Math.floor(player.y);mctx.clearRect(0,0,100,100);mctx.fillStyle='#111217';mctx.fillRect(0,0,100,100);
    for(let my=0;my<n;my++)for(let mx=0;mx<n;mx++){let x=ox+mx-Math.floor(n/2),y=oy+my-Math.floor(n/2);if(x>=0&&y>=0&&x<size&&y<size&&dungeon[y][x]){mctx.fillStyle='#726b61';mctx.fillRect(mx*cell,my*cell,cell+.25,cell+.25)}}
    const dot=(x,y,color,r=1.6)=>{let mx=(x-ox+Math.floor(n/2)+.5)*cell,my=(y-oy+Math.floor(n/2)+.5)*cell;if(mx>=0&&my>=0&&mx<100&&my<100){mctx.fillStyle=color;mctx.fillRect(mx-r,my-r,r*2,r*2)}};
    relics.forEach(r=>{if(!r.got)dot(r.x+.5,r.y+.5,'#f1bd6b',1.5)});dot(exitCell.x+.5,exitCell.y+.5,player.relics>=3?'#a9d0a6':'#bb8e65',2);dot(player.x,player.y,'#fff0c1',2.1);
  }
  function startGame(){
    generate();paused=false;gameState='play';$('#title-screen').classList.add('leaving');setTimeout(()=>$('#title-screen').classList.add('hidden'),750);$('#game-ui').classList.remove('hidden');$('#start-hint').classList.remove('hidden');
    $('#hud-name').textContent=heroName.toUpperCase();$('#hud-class').textContent=`THE ${selectedClass.toUpperCase()} · LV. 01`;$('#avatar-mini').textContent=heroName[0].toUpperCase();hud();showToast('A lantern, three relics, and a way out.');
  }
  function finish(won){gameState='end';paused=true;$('#end-overlay').classList.remove('hidden');$('#end-eyebrow').textContent=won?'A LIGHT IN THE DARK':'THE GLOAM CLAIMS ANOTHER';$('#end-title').textContent=won?'THE VAULT REMEMBERS':'YOUR LANTERN FADES';$('#end-copy').textContent=won?`${heroName} carried the old ember back into the waking world.`:`${heroName} found ${player.relics} of three relics. The vault waits for another.`}
  function togglePause(){if(gameState!=='play')return;paused=!paused;$('#pause-overlay').classList.toggle('hidden',!paused)}
  function playTone(freq,duration,type='sine',volume=.03){if(!soundOn)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch(_){}}
  function draw(dt){
    ctx.save();if(cameraShake>0)ctx.translate(rand(-cameraShake,cameraShake),rand(-cameraShake,cameraShake));drawScene(dt);ctx.restore();
    if(gameState==='play'&&!$('#game-ui').classList.contains('hidden'))drawMap();
  }
  function frame(now){let dt=Math.min(.04,(now-lastTime)/1000||.016);lastTime=now;if(gameState==='play')updateGame(dt);draw(dt);requestAnimationFrame(frame)}
  $('#begin-button').addEventListener('click',startGame);
  $('#resume-button').addEventListener('click',togglePause);
  $('#restart-button').addEventListener('click',()=>location.reload());
  $('#end-button').addEventListener('click',()=>location.reload());
  $('#sound-button').addEventListener('click',()=>{soundOn=!soundOn;$('#sound-button').innerHTML=`♫ <span>SOUND ${soundOn?'ON':'OFF'}</span>`;if(soundOn)playTone(440,.06)});
  addEventListener('keydown',e=>{let k=e.key.toLowerCase();if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='escape'){togglePause();return}if(k==='m'&&gameState==='play'){$('.map-frame').classList.toggle('hidden');return}if(k===' '){attack();return}if(k==='shift'){dodge();return}moveKeys[k]=true;});
  addEventListener('keyup',e=>{moveKeys[e.key.toLowerCase()]=false});
  document.querySelectorAll('.dpad button').forEach(b=>{let dir=b.dataset.dir;b.addEventListener('pointerdown',e=>{e.preventDefault();touch[dir]=true;b.setPointerCapture(e.pointerId)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>touch[dir]=false))});
  $('#touch-attack').addEventListener('pointerdown',e=>{e.preventDefault();attack()});$('#touch-dodge').addEventListener('pointerdown',e=>{e.preventDefault();dodge()});
  generate();requestAnimationFrame(frame);
})();

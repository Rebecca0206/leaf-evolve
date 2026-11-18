// Leaf Evolve - UI, rendering, audio, crowd, save. leafactivity.com
(function(){
const D=window.LE_DATA, E=window.LE_ENGINE, SP=D.SPECIES, clamp=E.clamp;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const q=new URLSearchParams(location.search); const TS=Math.max(1,+q.get('ts')||1);
// ================= SAVE =================
const KEY='leafEvolve.v1';
const blank=()=>({v:1,line:null,animal:null,dna:0,coins:100,wins:0,losses:0,bouts:0,mode:'kids',muted:false,seen:{},beaten:{},path:[],bestStreak:0,streak:0});
let S=blank();
function load(){try{const j=JSON.parse(localStorage.getItem(KEY)||'null'); if(j&&j.v===1)S=Object.assign(blank(),j)}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
load();
const teen=()=>S.mode==='teen';
// ================= AUDIO (WebAudio, no files) =================
const AU={ctx:null,master:null,crowd:null,cg:null,nb:null,
 init(){ if(this.ctx)return; try{ const C=window.AudioContext||window.webkitAudioContext; this.ctx=new C(); this.master=this.ctx.createGain(); this.master.gain.value=S.muted?0:0.8; this.master.connect(this.ctx.destination);
   const n=this.ctx.sampleRate*2, b=this.ctx.createBuffer(1,n,this.ctx.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++)d[i]=Math.random()*2-1; this.nb=b;
   // crowd murmur loop
   const src=this.ctx.createBufferSource(); src.buffer=b; src.loop=true; const bp=this.ctx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=650; bp.Q.value=0.5;
   const lp=this.ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1800; this.cg=this.ctx.createGain(); this.cg.gain.value=0; src.connect(bp);bp.connect(lp);lp.connect(this.cg);this.cg.connect(this.master); src.start(); this.cbp=bp;
 }catch(e){} },
 mute(m){S.muted=m;save(); if(this.master)this.master.gain.value=m?0:0.8; $('#mute').textContent=m?'🔇':'🔊'},
 noise(dur,f,q,g,type='bandpass',att=0.005,fe){ if(!this.ctx||S.muted)return; const c=this.ctx,t=c.currentTime; const s=c.createBufferSource(); s.buffer=this.nb; s.playbackRate.value=0.7+Math.random()*0.6; const fl=c.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t); if(fe)fl.frequency.exponentialRampToValueAtTime(fe,t+dur); fl.Q.value=q; const gn=c.createGain(); gn.gain.setValueAtTime(0.0001,t); gn.gain.exponentialRampToValueAtTime(g,t+att); gn.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(fl);fl.connect(gn);gn.connect(this.master); s.start(t,Math.random(),dur+0.05); },
 tone(f0,f1,dur,g,type='sine',lpf){ if(!this.ctx||S.muted)return; const c=this.ctx,t=c.currentTime; const o=c.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur); const gn=c.createGain(); gn.gain.setValueAtTime(g,t); gn.gain.exponentialRampToValueAtTime(0.0001,t+dur); let n=o; if(lpf){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lpf;o.connect(fl);n=fl} n.connect(gn);gn.connect(this.master); o.start(t);o.stop(t+dur+0.02); },
 hit(big){ this.tone(big?95:140,big?38:60,big?0.28:0.16,big?0.9:0.6,'sine'); this.noise(big?0.22:0.12,big?900:1400,0.7,big?0.7:0.45,'lowpass',0.002); },
 whoosh(big){ this.noise(big?0.28:0.16,big?500:900,1.2,big?0.35:0.22,'bandpass',0.05,big?1800:2600) },
 parry(){ this.tone(1400,900,0.12,0.35,'triangle'); this.tone(2100,1500,0.1,0.2,'square',3000) },
 block(){ this.noise(0.1,300,0.8,0.5,'lowpass'); this.tone(110,70,0.1,0.4) },
 growl(mass){ const f=clamp(170-26*Math.log10(1+mass),60,170); this.tone(f*1.2,f*0.8,0.5,0.35,'sawtooth',420); this.tone(f*0.6,f*0.5,0.5,0.25,'sawtooth',300) },
 hiss(){ this.noise(0.5,5000,0.8,0.3,'highpass',0.08) },
 bell(){ [0,0.0].forEach(()=>{this.tone(660,650,1.2,0.35,'sine');this.tone(1320,1300,0.9,0.15,'sine')}) },
 cheer(l){ this.noise(0.5+l*1.1,900+l*500,0.6,0.25+0.5*l,'bandpass',0.12,1400+l*600) },
 ko(){ this.tone(120,40,0.6,0.7,'sine'); this.noise(0.5,400,0.6,0.5,'lowpass') },
 grab(){ this.noise(0.25,250,2,0.5,'bandpass'); this.tone(80,50,0.3,0.5,'sawtooth',200) },
 ui(){ this.tone(700,900,0.07,0.2,'triangle') },
 evolve(){ [0,0.12,0.24,0.38].forEach((d,i)=>setTimeout(()=>this.tone(440*Math.pow(1.26,i*1.5),440*Math.pow(1.26,i*1.5)*1.01,0.5,0.25,'triangle'),d*1000)) },
 crowdLevel(e){ if(!this.cg||S.muted)return; this.cg.gain.setTargetAtTime(0.05+0.3*e,this.ctx.currentTime,0.12); if(this.cbp)this.cbp.frequency.setTargetAtTime(600+500*e,this.ctx.currentTime,0.2) }
};
// ================= ASSETS =================
const IMG={};
function img(src){ if(IMG[src])return IMG[src]; const i=new Image(); i.src=src; IMG[src]=i; return i; }
const POSES=['idle','attack','bite','hit'];
function pose(id,p){ const a=SP[id].art; let i=img(`assets/a/${a}/${p}.webp`); if(!(i.complete&&i.naturalWidth)){ if(p!=='idle'){const alt=img(`assets/a/${a}/idle.webp`); return alt}} return i; }
function preload(ids){ ids.forEach(id=>POSES.forEach(p=>img(`assets/a/${SP[id].art}/${p}.webp`))) }
const ART=Object.keys(SP).map(k=>SP[k].art); preload(Object.keys(SP));
const BG=img('assets/colosseum.webp');
// ================= CROWD (animated spectators on tiers + balcony) =================
const SKINS=['#f0c8a0','#e0a878','#c68a5a','#9a6440','#6e4228'], TUNICS=['#c9b79a','#a8473a','#3f6a8a','#6a8a3f','#d8c068','#7a4a8a','#e8e0d0','#8a5a2a','#b86a3a','#4a5a4a'];
const atlases={};
function drawFigure(c,skin,tun,pose){ // 40x64 cell, soft painted look
  const hd=c.createRadialGradient(20,13,2,20,14,10); hd.addColorStop(0,skin); hd.addColorStop(1,shade(skin,-40));
  const body=c.createLinearGradient(0,26,0,64); body.addColorStop(0,shade(tun,15)); body.addColorStop(1,shade(tun,-55));
  c.lineCap='round';
  const arm=(x0,y0,x1,y1)=>{c.strokeStyle=skin;c.lineWidth=5;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()};
  const sleeve=(x0,y0,x1,y1)=>{c.strokeStyle=tun;c.lineWidth=7;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()};
  const slip=(x,y,rot)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle='#f4ead0';c.fillRect(-5,-8,10,13);c.fillStyle='#b8402e';c.fillRect(-5,-4,10,2);c.fillStyle='#3a2a1a';c.fillRect(-3,0,6,1);c.fillRect(-3,2.5,5,1);c.restore()};
  // arms behind body
  if(pose===1){sleeve(11,34,5,12);arm(5,17,3,6);sleeve(29,34,35,12);arm(35,17,37,6)}
  else if(pose===2){sleeve(29,34,34,13);arm(34,18,35,8);}
  else if(pose===3){sleeve(11,34,6,13);arm(6,18,5,8);}
  c.fillStyle=body; c.beginPath(); c.moveTo(6,64);c.quadraticCurveTo(5,32,20,27);c.quadraticCurveTo(35,32,34,64);c.closePath();c.fill();
  c.fillStyle=shade(skin,-25);c.fillRect(17,22,6,7);
  c.fillStyle=hd;c.beginPath();c.ellipse(20,14,8,9.5,0,0,7);c.fill();
  // hair
  c.fillStyle=['#2a1a10','#4a3018','#171717','#6a4a28','#8a8a8a'][(skin.charCodeAt(2)+tun.charCodeAt(3))%5]; c.beginPath();c.ellipse(20,8.5,8.5,5,0,Math.PI,0);c.fill();
  // face
  c.fillStyle='#2a1a10'; c.fillRect(16,13,2,2);c.fillRect(22,13,2,2);
  if(pose===1||pose===2||pose===3){c.fillStyle='#3a0f0a';c.beginPath();c.ellipse(20,19,3,3.6,0,0,7);c.fill()} else {c.fillRect(18,19,4,1)}
  if(pose===0){c.strokeStyle=skin;c.lineWidth=5;c.beginPath();c.moveTo(10,40);c.lineTo(13,52);c.moveTo(30,40);c.lineTo(27,52);c.stroke()}
  if(pose===2){c.strokeStyle=skin;c.lineWidth=5;c.beginPath();c.moveTo(11,40);c.lineTo(14,52);c.stroke(); slip(35,7,0.25)}
  if(pose===3){c.strokeStyle=skin;c.lineWidth=5;c.beginPath();c.moveTo(29,40);c.lineTo(26,52);c.stroke(); slip(5,7,-0.25)}
  if(pose===1){ /* fists up */ }
}
function shade(h,a){const n=parseInt(h.slice(1),16);let r=(n>>16)+a,g=(n>>8&255)+a,b=(n&255)+a;r=clamp(r,0,255);g=clamp(g,0,255);b=clamp(b,0,255);return `rgb(${r},${g},${b})`}
function atlas(dark){ const k=dark; if(atlases[k])return atlases[k]; const cv=document.createElement('canvas'); cv.width=40*4*10; cv.height=64*5; const c=cv.getContext('2d'); 
  for(let s=0;s<5;s++)for(let t=0;t<10;t++)for(let p=0;p<4;p++){ c.save(); c.translate((t*4+p)*40,s*64); drawFigure(c,SKINS[s],TUNICS[t],p); c.restore(); }
  c.globalCompositeOperation='source-atop'; c.fillStyle=`rgba(18,10,4,${dark})`; c.fillRect(0,0,cv.width,cv.height);
  const o=document.createElement('canvas'); o.width=cv.width; o.height=cv.height; const oc=o.getContext('2d'); oc.filter=`saturate(.7) blur(${dark>0.3?0.9:0.5}px)`; oc.drawImage(cv,0,0); atlases[k]=o; return o; }
const ROWS=[ // y in colosseum image px (1280x720), h figure height, step spacing
 {y:132,h:30,st:26,dark:.62,bet:.3},{y:162,h:36,st:30,dark:.55,bet:.35},
 {y:388,h:62,st:40,dark:.55,bet:.35},{y:410,h:76,st:46,dark:.38,bet:.4},{y:438,h:104,st:60,dark:.12,bet:.5}];
let CROWD=null;
function buildCrowd(){ const r=E.mulberry(77); CROWD=ROWS.map((row,ri)=>{ const arr=[]; for(let x=-30;x<1310;x+=row.st){ arr.push({x:x+(r()-.5)*row.st*0.6,sk:r()*5|0,tn:r()*10|0,ph:r()*6.28,ex:0.6+r()*0.7,bet:r()<row.bet,dy:(r()-.5)*4}) } return arr}); }
buildCrowd();
const crowd={e:0,slipsT:0};
function cheer(a){ crowd.e=Math.min(1,crowd.e+a); }
function drawCrowd(c,bx,by,bs,t){
  const e=crowd.e;
  ROWS.forEach((row,ri)=>{ const at=atlas(row.dark.toFixed(2)); const fh=row.h*bs, fw=fh*40/64;
    for(const p of CROWD[ri]){ const lv=e*p.ex; let pz=0;
      if(lv>0.62) pz=(teen()&&p.bet)?(Math.sin(t*6+p.ph)>0?2:3):1;
      else if(lv>0.3) pz=(teen()&&p.bet)?(Math.sin(t*4+p.ph)>0?2:3):(Math.sin(t*5+p.ph)>0.4?1:0);
      else if(teen()&&p.bet&&Math.sin(t*0.9+p.ph*3)>0.8) pz=(p.ph>3?2:3);
      const bob=-Math.abs(Math.sin(t*(3+lv*8)+p.ph))*lv*9*bs;
      const sx=bx+p.x*bs-fw/2, sy=by+row.y*bs-fh+bob+p.dy*bs;
      c.drawImage(at,(p.tn*4+pz)*40,p.sk*64,40,64,sx,sy,fw,fh); }
  });
}
// balcony parapet (stone) drawn over the lowest crowd row
function drawParapet(c,bx,by,bs){ const y=by+432*bs,h=20*bs,w=1400*bs; const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#8a7656');g.addColorStop(.25,'#b39c74');g.addColorStop(1,'#4a3c28'); c.fillStyle=g; c.fillRect(bx-60*bs,y,w,h);
  c.fillStyle='#00000040'; for(let x=bx-60*bs;x<bx+w;x+=64*bs)c.fillRect(x,y+2*bs,1.5*bs,h); c.fillStyle='#ffffff28';c.fillRect(bx-60*bs,y,w,2*bs); }
// ================= PARTICLES / FX =================
const dustSpr=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,'rgba(205,175,125,.85)');r.addColorStop(.5,'rgba(190,160,110,.4)');r.addColorStop(1,'rgba(190,160,110,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return c})();
let parts=[], texts=[], slipsFly=[], shake=0, flashV=0;
function dust(x,n,spd,size,life){ for(let i=0;i<n;i++)parts.push({x:x+(Math.random()-.5)*30,y:0,vx:(Math.random()-.5)*spd,vy:-20-Math.random()*spd*0.5,r:size*(0.6+Math.random()*0.8),life:life*(0.7+Math.random()*0.6),t:0,k:'d'}) }
function grit(x,n,dir){ for(let i=0;i<n;i++)parts.push({x,y:-10,vx:dir*(60+Math.random()*220),vy:-80-Math.random()*160,r:1.6,life:0.5,t:0,k:'g'}) }
function ftext(x,s,col,big){ texts.push({x,y:-110,s,col:col||'#fff',t:0,big}) }
// ================= FIGHT VIEW =================
let M=null, cv=null, cx=null, view={w:0,h:0,dpr:1}, cam={x:0,w:600}, lastT=0, acc=0, running=false, curOpp=null, bet=0, betOdds=0, oppSkill=0.4, ended=false, ft=0, tapMash=0;
function sizeCanvas(){ if(!cv)return; const r=cv.getBoundingClientRect(); const dpr=Math.min(2,window.devicePixelRatio||1); view.dpr=dpr; view.w=Math.max(1,r.width); view.h=Math.max(1,r.height); cv.width=Math.round(view.w*dpr); cv.height=Math.round(view.h*dpr); }
addEventListener('resize',()=>{sizeCanvas()});
const tmp=document.createElement('canvas'), tcx=tmp.getContext('2d');
function bgLayout(){ const cw=view.w,ch=view.h; const s=Math.max(cw/1280,ch/720)*1.08; const top=ch-720*s; return {s,top,H:top+440*s,gy:top+440*s+0.32*(ch-(top+440*s))+6}; }
function spriteOf(f){ // choose pose image, transforms
  const im=pose(f.id,f.pose); return im; }
function drawFighter(c,f,L,sc,t){
  const im=spriteOf(f); if(!(im.complete&&im.naturalWidth))return;
  const baseX=(f.x-cam.x)*sc+view.w/2;
  let depth=1,gy=L.gy;
  if(M.intro>0){ const p=clamp(1-M.intro/1.6,0,1); depth=0.7+0.3*p; gy=L.H+(L.gy-L.H)*(0.35+0.65*p); }
  const dw=f.s.w*sc*depth, k=dw/im.naturalWidth, dh=im.naturalHeight*k;
  let lunge=0, sq=1;
  if(f.st==='wind'){ lunge=-0.05*f.s.w*sc*f.face; sq=0.94 } else if(f.st==='act'&&!(f.act&&f.act.dash)) lunge=0.09*f.s.w*sc*f.face; else if(f.st==='rec') lunge=0.04*f.s.w*sc*f.face;
  const walk=(f.st==='move')?Math.sin(t*14)*3*sc:0, idle=Math.sin(t*2.2+f.x)*1.2*sc;
  const air=(f.air||0)*sc; const sh=(f.st==='hit'&&f.t<0.2)?Math.sin(t*90)*3*sc:0;
  const x=baseX+lunge+sh, y=gy-air+(walk?-Math.abs(walk):0)+idle*0;
  // shadow
  c.save(); c.globalAlpha=0.42*(f.alpha); c.fillStyle='#000'; c.beginPath(); c.ellipse(baseX,gy+2,dw*0.38*(1-air/400),dw*0.07,0,0,7); c.fill(); c.restore();
  c.save(); c.globalAlpha=f.alpha; c.translate(x,y); if(f.face<0)c.scale(-1,1);
  let rot=0; if(f.st==='ko')rot=clamp(f.t*1.2,0,0.5)*(f.x<0?-1:1)*f.face*-1; if(f.st==='dodge')rot=-0.12; if(f.st==='stun'&&f.winded>0)rot=Math.sin(t*6)*0.06; if(f.st==='held')rot=Math.sin(t*20)*0.05;
  c.rotate(rot); c.scale(1,sq);
  // quick aura for buffs
  if(f.buffs.frenzy){c.shadowColor='#ff5a30';c.shadowBlur=18*sc} else if(f.buffs.sprint){c.shadowColor='#ffe27a';c.shadowBlur=14*sc} else if(f.buffs.quills){c.shadowColor='#e8e0a0';c.shadowBlur=10*sc}
  if(f.blocking){c.shadowColor='#7ad0ff';c.shadowBlur=22*sc}
  c.drawImage(im,-dw/2,-dh,dw,dh); c.shadowBlur=0;
  if(f.flash>0||f.poison){ tmp.width=Math.ceil(dw);tmp.height=Math.ceil(dh); tcx.clearRect(0,0,tmp.width,tmp.height); tcx.drawImage(im,0,0,dw,dh); tcx.globalCompositeOperation='source-atop';
    if(f.flash>0){tcx.fillStyle=`rgba(255,255,255,${f.flash*0.75})`;tcx.fillRect(0,0,dw,dh)}
    if(f.poison){tcx.fillStyle=`rgba(90,220,60,${0.18+0.12*Math.sin(t*8)})`;tcx.fillRect(0,0,dw,dh)}
    tcx.globalCompositeOperation='source-over'; c.drawImage(tmp,-dw/2,-dh); }
  if(teen()&&f.scratch>0){ // mild realism: pale claw scratches (no blood)
    c.strokeStyle='rgba(255,238,210,.55)'; c.lineWidth=Math.max(1,1.5*sc); c.lineCap='round';
    for(let i=0;i<f.scratch;i++){ const bx=(-0.25+((i*37)%50)/100)*dw, by=-dh*(0.35+((i*23)%40)/100); c.beginPath(); for(let j=0;j<3;j++){c.moveTo(bx+j*5*sc,by); c.lineTo(bx+j*5*sc+14*sc,by+16*sc)} c.stroke(); } }
  c.restore();
  // dizzy stars
  if(f.winded>0){ c.save(); c.font=`${18*sc}px sans-serif`; c.textAlign='center'; for(let i=0;i<3;i++){const a=t*5+i*2.1; c.fillText('✦',baseX+Math.cos(a)*dw*0.22,gy-dh*0.95+Math.sin(a)*8*sc)} c.restore(); }
}
function drawGates(c,L,sc){ [-1,1].forEach(sd=>{ const gx=(sd*640-cam.x)*sc+view.w/2; const gw=150*sc*0.8, gh=170*sc*0.8; if(gx<-gw||gx>view.w+gw)return; const open=clamp(1-M.intro/1.2,0,1); const y=L.H+6;
  c.save(); const g=c.createLinearGradient(0,y-gh,0,y); g.addColorStop(0,'#0b0805');g.addColorStop(1,'#241a10'); c.fillStyle=g; c.beginPath(); c.moveTo(gx-gw/2,y); c.lineTo(gx-gw/2,y-gh*0.62); c.quadraticCurveTo(gx-gw/2,y-gh,gx,y-gh); c.quadraticCurveTo(gx+gw/2,y-gh,gx+gw/2,y-gh*0.62); c.lineTo(gx+gw/2,y); c.closePath(); c.fill();
  c.strokeStyle='#8a7656'; c.lineWidth=4*sc; c.stroke();
  c.strokeStyle='#5a4a38'; c.lineWidth=2.4*sc; const bh=gh*(1-open*0.9); c.save(); c.clip(); for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(gx+i*gw/7,y-gh);c.lineTo(gx+i*gw/7,y-gh+bh);c.stroke()} c.restore();
  c.restore(); }); }
let lastDraw=0;
function draw(t){
  const c=cx; c.setTransform(view.dpr,0,0,view.dpr,0,0); c.clearRect(0,0,view.w,view.h);
  const L=bgLayout(); const f1=M.A,f2=M.B;
  // camera
  const mid=(f1.x+f2.x)/2, d=Math.abs(f1.x-f2.x); const minW=view.w<520?350:520; const tw=clamp(Math.max(minW,d+(f1.s.w+f2.s.w)*0.55+150),minW,1100);
  const intro=M.intro>0; const targW=intro?900:tw; cam.w+=(targW-cam.w)*0.1; cam.x+=((intro?0:mid)-cam.x)*0.12;
  const sc=view.w/cam.w;
  let sx=0,sy=0; if(shake>0){sx=(Math.random()-.5)*shake*sc*0.8;sy=(Math.random()-.5)*shake*sc*0.5}
  c.save(); c.translate(sx,sy);
  const par=-cam.x*0.10*sc; const ox=(view.w-1280*L.s)/2+clamp(par,-(1280*L.s-view.w)/2+1,(1280*L.s-view.w)/2-1);
  c.drawImage(BG,ox,L.top,1280*L.s,720*L.s);
  drawCrowd(c,ox,L.top,L.s,t);
  drawParapet(c,ox,L.top,L.s);
  drawGates(c,L,sc);
  // warm grade over the walls
  const gr=c.createLinearGradient(0,0,0,L.H); gr.addColorStop(0,'rgba(20,10,0,.35)'); gr.addColorStop(1,'rgba(60,30,5,.08)'); c.fillStyle=gr; c.fillRect(0,0,view.w,L.H);
  // dust behind
  drawParts(c,L,sc,false);
  // fighters (the one acting draws in front)
  const order=[f1,f2].sort((a,b)=>(a.st==='act'||a.st==='grab'?1:0)-(b.st==='act'||b.st==='grab'?1:0));
  order.forEach(f=>drawFighter(c,f,L,sc,t));
  drawParts(c,L,sc,true);
  // slips flying (13+ betting)
  if(teen()){ c.save(); slipsFly.forEach(s=>{ c.translate(s.x,s.y); c.rotate(s.r); c.fillStyle='#f4ead0'; c.fillRect(-4,-5,8,10); c.fillStyle='#b8402e'; c.fillRect(-4,-1,8,1.6); c.setTransform(view.dpr,0,0,view.dpr,0,0); c.translate(sx,sy); }); c.restore(); }
  // texts
  texts.forEach(tx=>{ const px=(tx.x-cam.x)*sc+view.w/2, py=L.gy+(tx.y-tx.t*60)*sc; c.save(); c.globalAlpha=clamp(1.4-tx.t,0,1); c.font=`900 ${(tx.big?30:20)*Math.min(1.3,sc+0.4)}px Georgia,serif`; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#000'; c.strokeText(tx.s,px,py); c.fillStyle=tx.col; c.fillText(tx.s,px,py); c.restore(); });
  c.restore();
  // vignette
  const v=c.createRadialGradient(view.w/2,view.h*0.55,view.h*0.3,view.w/2,view.h*0.55,view.h*0.95); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.55)'); c.fillStyle=v; c.fillRect(0,0,view.w,view.h);
  if(flashV>0){c.fillStyle=`rgba(255,245,220,${flashV})`;c.fillRect(0,0,view.w,view.h)}
}
function drawParts(c,L,sc,front){ parts.forEach(p=>{ if((p.front||false)!==front&&p.k==='d'&&false)return; const px=(p.x-cam.x)*sc+view.w/2, py=L.gy+p.y*sc; if(p.k==='d'){ const a=clamp(1-p.t/p.life,0,1)*0.55; if(!front&&p.t<0)return; c.globalAlpha=a; const r=p.r*sc*(1+p.t/p.life*1.6); c.drawImage(dustSpr,px-r,py-r,r*2,r*2); c.globalAlpha=1 } else if(front){ c.fillStyle='rgba(180,150,100,.9)'; c.fillRect(px,py,p.r*sc,p.r*sc)} }); }
function updFx(dt){
  parts=parts.filter(p=>{p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt; if(p.k==='d'){p.vx*=0.96;p.vy*=0.94}else{p.vy+=700*dt; if(p.y>0){p.y=0;p.vy*=-0.2;p.vx*=0.5}} return p.t<p.life});
  texts=texts.filter(t=>{t.t+=dt;return t.t<1.3}); shake=Math.max(0,shake-dt*40); flashV=Math.max(0,flashV-dt*3);
  crowd.e=Math.max(0,crowd.e-dt*0.28); AU.crowdLevel(crowd.e);
  slipsFly=slipsFly.filter(s=>{s.t+=dt;s.x+=s.vx*dt+Math.sin(s.t*5+s.ph)*30*dt;s.y+=s.vy*dt;s.r+=s.vr*dt; return s.y<view.h+20&&s.t<4});
}
function spawnSlips(n){ if(!teen())return; const L=bgLayout(); for(let i=0;i<n;i++)slipsFly.push({x:Math.random()*view.w,y:L.top+(380+Math.random()*50)*L.s,vx:(Math.random()-.5)*60,vy:20+Math.random()*50,r:0,vr:(Math.random()-.5)*4,t:0,ph:Math.random()*6}); }
// ---- events -> feel ----
function handleEvents(){
  const sc=view.w/cam.w; 
  for(const e of M.events){
    switch(e.t){
      case 'hit': { const big=e.big||e.dmg>M.A.maxhp*0.08; shake=Math.max(shake,big?14:5); if(big){flashV=Math.max(flashV,0.12);spawnSlips(4)} AU.hit(big); dust(e.x,big?7:3,140,big?28:16,0.8); grit(e.x,big?10:4,e.dir||1);
        if(e.dmg>0)ftext(e.x,Math.round(e.dmg),big?'#ffd98a':'#fff',big); if(big&&e.name!=='grab')AU.growl(SP[(e.who==='L'?M.B:M.A).id].mass); break; }
      case 'cheer': cheer(e.amt); if(e.amt>0.25){AU.cheer(clamp(e.amt,0,1)); spawnSlips(3)} break;
      case 'whoosh': AU.whoosh(e.big); break;
      case 'parry': AU.parry(); ftext(e.x,'PARRY!','#7ad0ff',true); shake=Math.max(shake,8); dust(e.x,4,120,18,0.6); break;
      case 'block': AU.block(); ftext(e.x,'BLOCK','#9ad0ff'); break;
      case 'dodge': ftext(e.x,'DODGED!','#e8e0a0'); AU.whoosh(0); dust(e.x,3,100,16,0.6); break;
      case 'whiff': dust(e.x,2,60,12,0.5); break;
      case 'winded': ftext((e.who==='L'?M.A:M.B).x,'WINDED!','#ffe27a',true); cheer(0.2); break;
      case 'grab': AU.grab(); ftext(e.x,e.kind==='roll'?'DEATH ROLL!':e.kind==='constrict'?'CONSTRICT!':'PINNED!','#ff9a6a',true); shake=Math.max(shake,10); break;
      case 'free': ftext(e.x,'BROKE FREE!','#9bd36a',true); AU.parry(); break;
      case 'buff': AU.growl(1); ftext((e.who==='L'?M.A:M.B).x,e.kind.toUpperCase()+'!','#ffcf6a'); if(e.kind==='quills')AU.hiss(); break;
      case 'roar': AU.growl(SP[(e.who==='L'?M.A:M.B).id].mass*1.5); shake=Math.max(shake,6); cheer(0.2); break;
      case 'text': ftext(e.x,e.s,'#fff'); break;
      case 'bell': AU.bell(); banner('FIGHT!',900); cheer(0.5); break;
      case 'wind': { const f=e.who==='L'?M.A:M.B; if(e.kind==='venom'&&(f.id==='cobra'))AU.hiss(); break; }
      case 'end': AU.ko(); cheer(1); AU.cheer(1); flashV=0.25; spawnSlips(14); banner(e.side==='L'?'VICTORY!':(e.how==='time'?'TIME UP':'DEFEATED'),2200); break;
    }
  }
  M.events.length=0;
  // footsteps dust
  for(const f of M.F){ if(f.st==='move'&&Math.random()<0.18)dust(f.x-f.face*f.s.w*0.2,1,40,14,0.6); if(f.st==='dodge'&&Math.random()<0.5)dust(f.x,1,60,14,0.5); if(f.st==='act'&&f.act&&f.act.dashing&&Math.random()<0.7)dust(f.x-f.face*f.s.w*0.3,2,80,20,0.7); }
}
function banner(s,ms){ const b=$('#banner'); b.textContent=s; b.classList.add('on'); setTimeout(()=>b.classList.remove('on'),ms) }
// ---- HUD ----
function hud(){
  const set=(id,f)=>{ const h=$(id); $('.nm',h).textContent=f.s.name; $('.hp i',h).style.width=Math.max(0,f.hp/f.maxhp*100)+'%'; $('.st i',h).style.width=Math.max(0,f.stam)+'%';
    $('.hp i',h).style.background=f.hp/f.maxhp<0.3?'linear-gradient(#ff9a6a,#c0452e)':''; $('.st i',h).style.opacity=f.winded>0?0.4:1;
    $('.stt',h).textContent=(f.winded>0?'WINDED ':'')+(f.poison?'POISONED ':'')+(f.buffs.frenzy?'FRENZY ':'')+(f.buffs.sprint?'SPRINT ':'')+(f.buffs.quills?'QUILLS ':''); };
  set('#hbL',M.A); set('#hbR',M.B); $('#clock').textContent=Math.max(0,Math.ceil(M.time));
  const sp=$('#bSp'); const cd=M.A.cd.sp; let el=sp.querySelector('.cd'); if(!el){el=document.createElement('div');el.className='cd';sp.appendChild(el)} el.style.height=(cd>0?cd/2.2*100:0)+'%';
  const g=M.g, gp=$('#grip'); if(g){ gp.classList.add('on'); const me=g.b===M.A, att=g.a===M.A; $('#gripT').textContent=me?'GRABBED! MASH ANY BUTTON!':att?'SQUEEZE! TAP BITE IN THE GREEN':'GRAPPLE'+(g.kind==='roll'?' · DEATH ROLL':''); $('#gMeter').style.width=Math.min(100,g.meter)+'%'; $('#gZone').style.display=att?'block':'none'; $('#gMark').style.left=`calc(${g.mark*100}% - 3px)`; } else gp.classList.remove('on');
}
// ---- loop ----
function loop(ts){ if(!running)return; const dt=Math.min(0.05,(ts-lastT)/1000||0.016); lastT=ts; acc+=dt*TS; let n=0;
  while(acc>=1/60&&n<30){ M.step(1/60); handleEvents(); updFx(1/60); acc-=1/60; n++; }
  ft+=dt; draw(ft); hud();
  if(M.over&&!ended&&M.afterT>2.8){ ended=true; endFight(); return }
  requestAnimationFrame(loop); }
function startFight(oppId){
  curOpp=oppId; ended=false; parts=[];texts=[];slipsFly=[]; crowd.e=0.15; shake=0; flashV=0; cam.x=0;cam.w=900;
  show('fight'); cv=$('#cv'); cx=cv.getContext('2d'); sizeCanvas(); AU.init(); if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume(); $('#mute').textContent=S.muted?'🔇':'🔊';
  M=new E.Match(S.animal,oppId,{aiA:!!window.LE_AUTOPLAY,skillA:0.85,skillB:oppSkill});
  window.LE.match=M;
  // control labels
    setLabels(); running=true; lastT=performance.now(); acc=0; requestAnimationFrame(loop); setTimeout(()=>{AU.growl(SP[S.animal].mass)},400); setTimeout(()=>{AU.growl(SP[oppId].mass)},900);
  banner('ENTER THE COLOSSEUM',1300);
}
const CLAWL={grizzly:'CLAW',polar:'CLAW',lion:'CLAW',tiger:'CLAW',jaguar:'CLAW',cheetah:'CLAW',gorilla:'SLAM',ostrich:'KICK',cassowary:'KICK',kangaroo:'KICK',croc:'TAIL LASH',youngcroc:'TAIL LASH',saltcroc:'TAIL LASH',hippo:'SLAM',rhino:'HORN',elephant:'TUSK',anaconda:'LASH',cobra:'LASH',komodo:'TAIL LASH',gila:'CLAW',porcupine:'SWAT',wolfpup:'SLASH',wolf:'SLASH',alphawolf:'SLASH',swiftwolf:'SLASH'};
function setLabels(){ const l=CLAWL[S.animal]||'CLAW'; const b=$('#bClaw'); b.textContent=l; const s=$('#bSp'); s.textContent=D.SPECIALS[SP[S.animal].sp].label; }
// ---- player input ----
function bind(){
  const A=()=>M&&M.A;
  const down=(a)=>{ if(!M||M.over||M.intro>0)return; const f=M.A; AU.init();
    if(a==='left'){f.in.l=1} else if(a==='right'){f.in.r=1} else if(a==='block'){f.in.block=1; if(M.g)f.pressed.push('mash')} else { M.press(f,a) } 
    if(M.g&&(a==='left'||a==='right'))f.pressed.push('mash'); };
  const up=(a)=>{ if(!M)return; const f=M.A; if(a==='left')f.in.l=0; if(a==='right')f.in.r=0; if(a==='block')f.in.block=0; };
  $$('#ctl .b').forEach(b=>{ const a=b.dataset.a; b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture&&b.setPointerCapture(e.pointerId);b.classList.add('p');down(a)}); ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>{b.classList.remove('p');up(a)})); b.addEventListener('contextmenu',e=>e.preventDefault()); });
  const km={a:'left',arrowleft:'left',d:'right',arrowright:'right',s:'block',arrowdown:'block',j:'bite',k:'claw',l:'charge',';':'sp',' ':'dodge',w:'dodge'};
  addEventListener('keydown',e=>{ const a=km[e.key.toLowerCase()]; if(a&&!e.repeat&&$('#s-fight').classList.contains('on')){e.preventDefault();down(a)} });
  addEventListener('keyup',e=>{ const a=km[e.key.toLowerCase()]; if(a)up(a) });
  $('#mute').addEventListener('click',()=>{AU.init();AU.mute(!S.muted)});
}
// ================= SCREENS =================
function show(n){ $$('.screen').forEach(s=>s.classList.toggle('on',s.id==='s-'+n)); if(n!=='fight')running=false; window.LE.screen=n; }
const f0=(n)=>n>=1000?n.toLocaleString('en-US'):(n<1?n.toFixed(2):n%1?n.toFixed(1):''+n);
const stars=(a)=>'★'.repeat(Math.round(a/2))||'·';
function statsHTML(id){ const s=SP[id]; return `<div class="stats"><span>Weight</span><span>${f0(s.mass)} kg</span><span>Length</span><span>${f0(s.len)} m</span><span>Top speed</span><span>${s.spd} km/h</span><span>Bite/strike</span><span>~${f0(s.bite)} N</span><span>Armor</span><span>${stars(s.arm)} (${s.arm}/10)</span><span>Special</span><span>${D.SPECIALS[s.sp].label}</span></div>`; }
const thumb=(id,p='idle')=>`assets/a/${SP[id].art}/${p}.webp`;
const modeBadge=()=>teen()?'<span class="chip gold">13+ mode</span>':'<span class="chip ok">Kids mode</span>';
function title(){ show('title'); const has=!!S.animal;
  $('#s-title').innerHTML=`<h1>🍃 LEAF EVOLVE</h1><p class="sub">Start small. Fight real wild animals in the Colosseum. Evolve.</p>
  <div class="hero" style="height:230px"><img src="${thumb('lion','attack')}" style="transform:scaleX(1)"><img src="${thumb('grizzly','idle')}" style="transform:scaleX(-1)"></div>
  ${has?`<button class="btn" id="bCont">CONTINUE · ${SP[S.animal].n}</button><button class="btn alt" id="bNew">New game</button>`:`<button class="btn" id="bNew">PLAY</button>`}
  <div class="card"><b>Mode:</b> ${modeBadge()}<div class="modes"><button class="btn ${teen()?'alt':'green'}" id="mKids">Kids (default)</button><button class="btn ${teen()?'green':'alt'}" id="mTeen">13+</button></div>
  <div class="note">Kids: no scratches, no betting. 13+ adds mild scratch marks and the coin-only betting screen. No blood in either mode.</div></div>
  <div class="brand">leafactivity.com · Leaf Evolve demo · all coins are in-game only</div>`;
  $('#bNew')&&($('#bNew').onclick=()=>{AU.init();AU.ui(); if(has&&!confirm('Start a new game? Your saved progress will be replaced.'))return; const m=S.mode,mu=S.muted; S=blank(); S.mode=m;S.muted=mu; save(); starter()});
  $('#bCont')&&($('#bCont').onclick=()=>{AU.init();AU.ui();hub()});
  $('#mKids').onclick=()=>{S.mode='kids';save();title()};
  $('#mTeen').onclick=()=>{ if(teen())return; if(confirm('13+ mode adds scratch marks and a coin-only betting screen. Are you 13 or older?')){S.mode='teen';save();title()} };
}
function starter(){ show('starter'); $('#s-starter').innerHTML=`<h2>Choose your starter</h2><p class="sub">Each line evolves along real-life relatives. Small animals can win with good timing.</p><div class="cards">${Object.entries(D.LINES).map(([k,l])=>{const id=l.start,s=SP[id];return `<div class="card ac" data-l="${k}"><img src="${thumb(id)}"><div class="t"><b>${s.n}</b> <span class="chip">${l.n}</span><br>${l.blurb}<br><span class="chip">${f0(s.mass)} kg</span><span class="chip">${s.spd} km/h</span><span class="chip">${D.SPECIALS[s.sp].label}</span></div></div>`}).join('')}</div>`;
  $$('#s-starter .ac').forEach(a=>a.onclick=()=>{ const l=D.LINES[a.dataset.l]; S.line=a.dataset.l; S.animal=l.start; S.seen[l.start]=1; S.path=[l.start]; save(); AU.ui(); hub() }); }
function canEvolve(){ const o=D.LINES[S.line].evo[S.animal]||[]; return o.some(e=>S.dna>=e[1]) }
function nextCost(){ const o=D.LINES[S.line].evo[S.animal]||[]; return o.length?Math.min(...o.map(e=>e[1])):0 }
function hub(){ show('hub'); const s=SP[S.animal], cost=nextCost(), ok=canEvolve();
  $('#s-hub').innerHTML=`<div class="top"><span>🏆 ${S.wins}W · ${S.losses}L</span>${modeBadge()}<span class="coin">🪙 ${S.coins}</span></div>
  <h2>${s.n}</h2><div class="hero"><img src="${thumb(S.animal)}"></div>
  <div class="card"><div class="top"><span>🧬 DNA ${S.dna}${cost?` / ${cost}`:''}</span><span>${cost?(ok?'<b class="up">Ready to evolve!</b>':'Win fights to earn DNA'):'Fully evolved'}</span></div><div class="dnab"><i style="width:${cost?Math.min(100,S.dna/cost*100):100}%"></i></div></div>
  <button class="btn red" id="bFight">⚔ FIGHT IN THE COLOSSEUM</button>
  <button class="btn ${ok?'green':'alt'}" id="bEvo">🧬 EVOLVE ${ok?'(READY!)':''}</button>
  <div class="row"><button class="btn alt" id="bPark">🌿 Park</button><button class="btn alt" id="bHome">☰ Menu</button></div>
  <div class="card">${statsHTML(S.animal)}<div class="note" style="text-align:left">${s.fact}</div></div>`;
  $('#bFight').onclick=()=>{AU.init();AU.ui();pickOpp()}; $('#bEvo').onclick=()=>{AU.ui();evolveScreen()}; $('#bPark').onclick=()=>{AU.ui();park()}; $('#bHome').onclick=title; }
// ---- opponents ----
const EXCL=new Set(['wolfpup','youngcroc','alphawolf','swiftwolf']);
function myPower(){return E.derive(S.animal).power}
function pickContenders(){ const me=myPower(), art=SP[S.animal].art; const pool=Object.keys(SP).filter(id=>!EXCL.has(id)&&SP[id].art!==art&&id!==S.animal);
  const rnd=E.mulberry(S.bouts*131+7); const res=[],used=new Set();
  (S.bouts<3?[0.55,0.8,1.1]:[0.7,1.0,1.4]).forEach(t=>{ let best=null,bs=1e9; pool.forEach(id=>{ if(used.has(id))return; const r=E.derive(id).power/me; const sc=Math.abs(Math.log(r/t))+rnd()*0.22; if(sc<bs){bs=sc;best=id} }); if(best){used.add(best);res.push(best)} });
  return res; }
const oppSk=()=>clamp(0.28+0.02*S.bouts,0.28,0.72);
function pickOpp(){ show('pick'); const me=myPower(); const list=pickContenders();
  $('#s-pick').innerHTML=`<div class="top"><button class="btn alt" style="width:auto;min-height:40px;margin:0;font-size:15px;padding:0 14px" id="bBack">◀ Back</button><span class="coin">🪙 ${S.coins}</span></div><h2>Choose your opponent</h2><p class="sub">Real wild animals. Every bout is in the Colosseum.</p><div class="cards">${list.map(id=>{const s=SP[id],r=E.derive(id).power/me,tag=r>1.25?'<span class="chip hot">UNDERDOG · big reward</span>':r<0.85?'<span class="chip ok">Warm-up</span>':'<span class="chip gold">Even match</span>';
   return `<div class="card ac" data-id="${id}"><img src="${thumb(id)}"><div class="t"><b>${s.n}</b> ${tag}<br><span class="chip">${f0(s.mass)} kg</span><span class="chip">${s.spd} km/h</span><span class="chip">~${f0(s.bite)} N</span><span class="chip">${D.HABITATS[s.hab].n}</span><br>Power ${E.derive(id).power} vs your ${me} · ${D.SPECIALS[s.sp].label}</div></div>`}).join('')}</div>`;
  $('#bBack').onclick=hub; $$('#s-pick .ac').forEach(a=>a.onclick=()=>{ AU.ui(); oppSkill=oppSk()+(E.derive(a.dataset.id).power/me>1.25?0.06:0); curOpp=a.dataset.id; bet=0; betOdds=0; if(teen())betScreen(); else startFight(curOpp) }); }
// ---- betting (13+, coins only; odds from simulation; house edge keeps EV below even) ----
const BET_MIN=10, BET_MAX=200, EDGE=0.88;
function computeOdds(id){ const p=E.winProb(S.animal,id,50,0.85,oppSkill,S.bouts+3); const pu=Math.min(0.97,p+0.04); const mult=Math.min(9,EDGE/pu); return {p,pu,mult:Math.round(mult*100)/100,open:pu<=0.85&&mult>=1.03}; }
function betScreen(){ show('bet'); $('#s-bet').innerHTML='<h2>Reading the odds…</h2><p class="sub">Simulating this matchup</p>';
  setTimeout(()=>{ const o=computeOdds(curOpp); betOdds=o.mult; const a=SP[S.animal],b=SP[curOpp]; const maxB=Math.min(BET_MAX,S.coins); let amt=Math.min(maxB,Math.max(BET_MIN,Math.min(50,maxB)));
   const canBet=o.open&&S.coins>=BET_MIN;
   $('#s-bet').innerHTML=`<div class="top"><span>🪙 Coins ${S.coins}</span><span class="chip gold">13+ · coins only, no real money</span></div><h2>🏛 Crowd betting</h2>
   <div class="card"><div class="row" style="align-items:center;text-align:center"><div><img src="${thumb(S.animal)}" style="width:100%;height:60px;object-fit:contain"><b>${a.n}</b><br><small>${f0(a.mass)} kg · ${a.spd} km/h</small></div><div style="flex:0 0 28px;font-weight:900">VS</div><div><img src="${thumb(curOpp)}" style="width:100%;height:60px;object-fit:contain"><b>${b.n}</b><br><small>${f0(b.mass)} kg · ${b.spd} km/h</small></div></div></div>
   <div class="card"><div class="note">Odds are based on both animals' stats (simulated bouts).</div><div class="odds">${canBet?'Bet on yourself · pays ×'+o.mult.toFixed(2):'No bet offered'}</div><div class="note">${canBet?`Estimated win chance ${Math.round(o.pu*100)}% · house edge 12% (expected return is below even)`:(S.coins<BET_MIN?'You need at least '+BET_MIN+' coins.':'Odds are too short to bet on this one.')}</div>
   ${canBet?`<div class="row" style="align-items:center;margin-top:8px"><button class="btn alt" id="bMinus" style="margin:0">−10</button><div class="odds" id="bAmt" style="flex:1.2">${amt}</div><button class="btn alt" id="bPlus" style="margin:0">+10</button></div><div class="row"><button class="btn alt" id="bMin">MIN ${BET_MIN}</button><button class="btn alt" id="bMax">MAX ${maxB}</button></div><div class="note">Min ${BET_MIN} · Max ${BET_MAX} coins. Win: +${Math.round(amt*(o.mult-1))} · Lose: −${amt}</div>`:''}</div>
   ${canBet?'<button class="btn green" id="bPlace">PLACE BET &amp; FIGHT</button>':''}<button class="btn ${canBet?'alt':''}" id="bNo">${canBet?'No bet, just fight':'FIGHT'}</button><button class="btn alt" id="bBk">◀ Back</button>`;
   const upd=()=>{ $('#bAmt').textContent=amt; $('#bAmt').nextElementSibling; const n=$('#s-bet .note:last-of-type'); };
   const setAmt=(v)=>{amt=clamp(Math.round(v/10)*10,BET_MIN,Math.max(BET_MIN,maxB)); if(maxB<BET_MIN)amt=0; $('#bAmt').textContent=amt; const nt=$$('#s-bet .note'); nt[nt.length-1].textContent=`Min ${BET_MIN} · Max ${BET_MAX} coins. Win: +${Math.round(amt*(o.mult-1))} · Lose: −${amt}`};
   if(canBet){ $('#bMinus').onclick=()=>{AU.ui();setAmt(amt-10)}; $('#bPlus').onclick=()=>{AU.ui();setAmt(amt+10)}; $('#bMin').onclick=()=>setAmt(BET_MIN); $('#bMax').onclick=()=>setAmt(maxB); $('#bPlace').onclick=()=>{ bet=amt; S.coins-=amt; save(); startFight(curOpp) } }
   $('#bNo').onclick=()=>{bet=0;startFight(curOpp)}; $('#bBk').onclick=pickOpp; },30); }
// ---- result ----
function endFight(){ running=false; const win=M.winner==='L'; const me=E.derive(S.animal), op=E.derive(curOpp); const ratio=clamp(op.power/me.power,0.5,2.2);
  let dna=Math.round((26+28*ratio)*(win?1:0.3)); let coins=win?Math.round(20+10*ratio):5; const flawless=win&&M.A.hp>=M.A.maxhp*0.85; if(flawless)dna=Math.round(dna*1.15);
  let betTxt=''; if(bet>0){ if(win){const g=Math.round(bet*betOdds); S.coins+=g; betTxt=`Bet won: +${g-bet} coins`} else betTxt=`Bet lost: −${bet} coins` }
  S.dna+=dna; S.coins+=coins; S.bouts++; if(win){S.wins++;S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);S.beaten[curOpp]=(S.beaten[curOpp]||0)+1; S.seen[curOpp]=1} else {S.losses++;S.streak=0}
  save(); const how=M.how==='time'?'Won on points':'Knocked out';
  show('result'); const st=M.A.stats;
  $('#s-result').innerHTML=`<div class="bigtxt ${win?'win':'lose'}">${win?'VICTORY!':'DEFEATED'}</div><div class="hero" style="height:150px"><img src="${thumb(win?S.animal:curOpp,win?'attack':'idle')}"></div>
  <p class="sub">${win?`${SP[curOpp].n} flees the sand. ${how}.`:`${SP[S.animal].n} limps away to rest. Nobody is hurt in Leaf Evolve.`}</p>
  <div class="card"><div class="top"><span>🧬 DNA</span><b>+${dna}${flawless?' (flawless bonus)':''}</b></div><div class="top"><span>🪙 Coins</span><b>+${coins}</b></div>${betTxt?`<div class="top"><span>🎟 Bet</span><b>${betTxt}</b></div>`:''}<div class="note" style="text-align:left">Dealt ${Math.round(st.dealt)} · taken ${Math.round(st.taken)} · parries ${st.parries} · dodges ${st.dodges}</div></div>
  ${canEvolve()?'<button class="btn green" id="bE">🧬 EVOLVE NOW</button>':''}<button class="btn" id="bAgain">⚔ FIGHT AGAIN</button><button class="btn alt" id="bHub">Back to den</button>`;
  $('#bE')&&($('#bE').onclick=evolveScreen); $('#bAgain').onclick=pickOpp; $('#bHub').onclick=hub; }
// ---- evolve ----
function cmp(a,b,key,fmt){ const d=SP[b][key]-SP[a][key]; return `<span class="${d>0?'up':d<0?'dn':''}">${fmt?fmt(SP[b][key]):SP[b][key]} ${d>0?'▲':d<0?'▼':''}</span>` }
function pathText(){ const L=D.LINES[S.line]; const out=[]; const walk=(id,depth)=>{ const nxt=L.evo[id]||[]; out.push({id,depth}); nxt.forEach(n=>walk(n[0],depth+1)) }; walk(L.start,0); return out.map(o=>`<div style="padding-left:${o.depth*14}px;${o.id===S.animal?'color:#ffd98a;font-weight:800':S.path.includes(o.id)?'':'opacity:.65'}">${o.depth?'↳ ':''}${SP[o.id].n}${o.id===S.animal?' ◀ you':''}</div>`).join('') }
function evolveScreen(){ show('evolve'); const opts=D.LINES[S.line].evo[S.animal]||[];
  $('#s-evolve').innerHTML=`<div class="top"><button class="btn alt" style="width:auto;min-height:40px;margin:0;font-size:15px;padding:0 14px" id="bBack">◀ Back</button><span>🧬 DNA ${S.dna}</span></div><h2>Evolve ${SP[S.animal].n}</h2>
  <div class="hero" style="height:140px"><img src="${thumb(S.animal)}"></div>
  ${opts.length?`<p class="sub">Choose how your animal grows.</p><div class="evo">${opts.map(([id,cost])=>{const ok=S.dna>=cost;return `<div class="card" ><img src="${thumb(id)}"><b>${SP[id].n}</b><div class="stats" style="text-align:left"><span>Weight</span>${cmp(S.animal,id,'mass',f0)}<span>Speed</span>${cmp(S.animal,id,'spd')}<span>Bite</span>${cmp(S.animal,id,'bite',f0)}<span>Armor</span>${cmp(S.animal,id,'arm')}<span>Special</span><span>${D.SPECIALS[SP[id].sp].label}</span></div><button class="btn ${ok?'green':'alt'}" data-id="${id}" data-c="${cost}" ${ok?'':'disabled'} style="min-height:48px;font-size:16px">${ok?'EVOLVE':'Need '+cost+' DNA'}</button></div>`}).join('')}</div>`:'<p class="sub">Fully evolved! Keep fighting for coins and glory.</p>'}
  <div class="card"><b>Evolution line: ${D.LINES[S.line].n}</b>${pathText()}</div>`;
  $('#bBack').onclick=hub; $$('#s-evolve button[data-id]').forEach(b=>b.onclick=()=>{ if(b.disabled)return; doEvolve(b.dataset.id,+b.dataset.c) }); }
function doEvolve(id,cost){ AU.init(); AU.evolve(); const old=S.animal; S.dna-=cost; S.animal=id; S.seen[id]=1; S.path.push(id); save(); const fl=$('#flash'); fl.classList.add('on'); setTimeout(()=>fl.classList.remove('on'),60);
  show('evolve'); $('#s-evolve').innerHTML=`<h2>${SP[old].n} evolved into</h2><div class="hero glow" style="height:230px"><img src="${thumb(id)}"></div><div class="bigtxt win" style="font-size:34px">${SP[id].n}!</div><div class="card">${statsHTML(id)}<div class="note" style="text-align:left">${SP[id].fact}</div></div><button class="btn" id="bOk">⚔ Back to the den</button>`; $('#bOk').onclick=hub; window.LE.evolved=id; }
// ---- park (habitats are for housing animals only; fights are all in the Colosseum) ----
function park(){ show('park'); const hs=Object.keys(D.HABITATS); const mine=new Set([...Object.keys(S.seen),...Object.keys(S.beaten)]);
  $('#s-park').innerHTML=`<div class="top"><button class="btn alt" style="width:auto;min-height:40px;margin:0;font-size:15px;padding:0 14px" id="bBack">◀ Back</button><span>${mine.size}/${Object.keys(SP).length} animals</span></div><h2>🌿 Leaf Park</h2><p class="sub">Animals you've been or beaten live here in their habitats. All fights happen in the Colosseum.</p>
  ${hs.map(h=>{ const ids=Object.keys(SP).filter(id=>SP[id].hab===h&&!['wolfpup','youngcroc','alphawolf','swiftwolf'].includes(id)); return `<div class="hab" style="background-image:url(assets/hab/${h}.webp)"><h3>${D.HABITATS[h].n}</h3>${ids.map(id=>`<span class="an ${mine.has(id)?'':'q'}"><img src="${thumb(id)}">${mine.has(id)?SP[id].n:'???'}</span>`).join('')}</div>`}).join('')}`;
  $('#bBack').onclick=hub; }
// ================= BOOT =================
window.LE={S:()=>S,save,show,hub,title,startFight,pickOpp,betScreen,evolveScreen,park,addDNA:(n)=>{S.dna+=n;save()},screen:'title',match:null,reset:()=>{S=blank();save()},engine:E,data:D,doEvolve,canEvolve,get running(){return running},setAutoplay(v){window.LE_AUTOPLAY=v}};
bind(); title();
if('serviceWorker' in navigator&&false){}
})();

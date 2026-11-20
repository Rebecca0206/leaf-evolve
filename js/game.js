// Leaf Evolve - UI, rendering, audio, crowd, save. leafactivity.com
(function(){
const D=window.LE_DATA, E=window.LE_ENGINE, SP=D.SPECIES, clamp=E.clamp;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const q=new URLSearchParams(location.search); const TS=Math.max(1,+q.get('ts')||1);
// ================= SAVE =================
const KEY='leafEvolve.v2';
const blank=()=>({v:2,coins:300,till:0,zoo:[],nextU:1,team:[],habs:{},mode:'kids',muted:false,wins:0,losses:0,bouts:0,beaten:{},free:{},streak:0,last:Date.now()});
let S=blank();
function load(){try{const j=JSON.parse(localStorage.getItem(KEY)||'null'); if(j&&j.v===2)S=Object.assign(blank(),j)}catch(e){}}
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
const STAGE_ART={tiger:['tiger_cub','tiger_juv'],lion:['lion_cub','lion_juv'],wolf:['wolf_cub','wolf_cub'],grizzly:['grizzly_cub','grizzly_cub']};
const hasSA=(id,st)=>!!(STAGE_ART[id]&&st!=null&&st<2);
const artOf=(id,st)=>hasSA(id,st)?STAGE_ART[id][st]:SP[id].art;
const ssc=(id,st)=>hasSA(id,st)?[.9,1.0][st]:[.62,.8,1,1.08][st];
function pose(id,p,st){ const a=artOf(id,st); let i=img(`assets/a/${a}/${p}.webp`); if(!(i.complete&&i.naturalWidth)){ if(p!=='idle'){const alt=img(`assets/a/${a}/idle.webp`); return alt}} return i; }
function preload(ids){ ids.forEach(id=>POSES.forEach(p=>img(`assets/a/${SP[id].art}/${p}.webp`))); Object.values(STAGE_ART).forEach(l=>l.forEach(a=>POSES.forEach(p=>img(`assets/a/${a}/${p}.webp`)))) }
const ART=Object.keys(SP).map(k=>SP[k].art); preload(Object.keys(SP));
const BG=img('assets/colosseum.webp');
// ================= CROWD (painted photo layers, parallax + bobbing strips) =================
function shade(h,a){const n=parseInt(h.slice(1),16);let r=(n>>16)+a,g=(n>>8&255)+a,b=(n&255)+a;r=clamp(r,0,255);g=clamp(g,0,255);b=clamp(b,0,255);return `rgb(${r},${g},${b})`}
const CIMG={calm:img('assets/crowd/calm.webp'),cheer:img('assets/crowd/cheer.webp'),cheerk:img('assets/crowd/cheerk.webp')};
const crowd={e:0};
function cheer(a){ crowd.e=Math.min(1,crowd.e+a); }
const CTILE={};
// tile = [image | mirrored image] pre-tinted once, so the strips can wrap seamlessly
function ctile(key,sd,dark,fade){ const k=key+sd+dark+fade; if(CTILE[k])return CTILE[k]; const im=CIMG[key]; if(!(im.complete&&im.naturalWidth))return null;
  const w=Math.round(im.naturalWidth*sd),h=Math.round(im.naturalHeight*sd); const cv=document.createElement('canvas'); cv.width=w*2; cv.height=h; const c=cv.getContext('2d');
  c.drawImage(im,0,0,w,h); c.save(); c.translate(w*2,0); c.scale(-1,1); c.drawImage(im,0,0,w,h); c.restore();
  c.globalCompositeOperation='source-atop'; c.fillStyle=`rgba(24,12,4,${dark})`; c.fillRect(0,0,cv.width,h); c.fillStyle=`rgba(210,150,70,${0.1+dark*0.25})`; c.fillRect(0,0,cv.width,h);
  if(fade){ c.globalCompositeOperation='destination-out'; const g=c.createLinearGradient(0,h*0.55,0,h); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,1)'); c.fillStyle=g; c.fillRect(0,0,cv.width,h); }
  return CTILE[k]={cv,w:w*2,h}; }
// bot: arena-y (1280x720 art space) of the feet line, k: arena px per source px, sd: tile downscale, par: parallax vs the wall (0.10)
const CLAY=[
 {bot:172,k:.14,sd:.25,dark:.6,par:.105,n:24,amp:2,fade:1,al:.8,x:380},
 {bot:418,k:.3,sd:.5,dark:.45,par:.13,n:32,amp:4,al:1,x:260},
 {bot:446,k:.44,sd:1,dark:.2,par:.17,n:48,amp:7,al:1,x:-190}];
CLAY.forEach((ly,i)=>{ const r=E.mulberry(91+i*7); ly.th=[];ly.ph=[]; for(let s=0;s<ly.n;s++){ const g=s>>1; if(!(g in ly.th)){ ly.th[g]=0.1+r()*0.7; ly.ph[g]=r()*6.28 } } });
function drawCrowd(c,bx,by,bs,t,sc){
  const e=crowd.e, ck=teen()?'cheer':'cheerk';
  for(const ly of CLAY){ const T0=ctile('calm',ly.sd,ly.dark,ly.fade), T1=ctile(ck,ly.sd,ly.dark,ly.fade); if(!T0||!T1)continue;
    const kk=ly.k/ly.sd*bs, n=ly.n, TW=T0.w*kk, swd=TW/n, stw0=T0.w/n, stw1=T1.w/n;
    const shift=-cam.x*sc*(ly.par-0.10); const x0=bx+(640+ly.x)*bs-TW/2+shift;
    c.globalAlpha=ly.al;
    for(let i=Math.floor((0-x0)/swd)-1;;i++){ const dx=x0+i*swd; if(dx>view.w+swd)break; const s=((i%n)+n)%n, g=s>>1;
      const lv=clamp((e-ly.th[g])/0.28,0,1); const ph=ly.ph[g]+s*0.18;
      let T=T0, sw=stw0, bob=Math.sin(t*1.3+ph)*0.7*bs;
      if(lv>0){ T=T1; sw=stw1; bob=-Math.abs(Math.sin(t*(4.5+lv*5)+ph))*lv*ly.amp*bs; }
      const dh=T.h*kk; c.drawImage(T.cv,s*sw,0,sw,T.h,Math.floor(dx),by+ly.bot*bs-dh+bob,Math.ceil(swd)+1,dh); }
  }
  c.globalAlpha=1;
}
// balcony parapet (stone) drawn over the lowest crowd row
function drawParapet(c,bx,by,bs){ const y=by+436*bs,h=24*bs,w=1500*bs; const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#a58e66');g.addColorStop(.18,'#c9b283');g.addColorStop(.5,'#8d7852');g.addColorStop(1,'#3a2e1e'); c.fillStyle=g; c.fillRect(bx-110*bs,y,w,h);
  c.fillStyle='#00000040'; for(let x=bx-110*bs;x<bx+w;x+=64*bs)c.fillRect(x,y+2*bs,1.5*bs,h); c.fillStyle='#ffffff40';c.fillRect(bx-110*bs,y,w,2*bs);
  const sh=c.createLinearGradient(0,y-18*bs,0,y); sh.addColorStop(0,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,.35)'); c.fillStyle=sh; c.fillRect(bx-110*bs,y-18*bs,w,18*bs); }
// ================= PARTICLES / FX =================
const dustSpr=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,'rgba(205,175,125,.85)');r.addColorStop(.5,'rgba(190,160,110,.4)');r.addColorStop(1,'rgba(190,160,110,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return c})();
const shadSpr=(()=>{const c=document.createElement('canvas');c.width=128;c.height=32;const g=c.getContext('2d');g.translate(64,16);g.scale(1,0.25);const r=g.createRadialGradient(0,0,2,0,0,64);r.addColorStop(0,'rgba(0,0,0,.75)');r.addColorStop(.55,'rgba(0,0,0,.4)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.beginPath();g.arc(0,0,64,0,7);g.fill();return c})();
// sun shafts: drawn once, composited with 'lighter' each frame
const raysSpr=(()=>{const c=document.createElement('canvas');c.width=256;c.height=256;const g=c.getContext('2d');
  [[0.02,.22,.30],[0.10,.30,.22],[0.22,.38,.16],[0.36,.42,.10]].forEach(([x0,w,a])=>{ const gr=g.createLinearGradient(256*x0,0,256*(x0+w*1.4),256); gr.addColorStop(0,`rgba(255,226,150,${a})`); gr.addColorStop(1,'rgba(255,200,110,0)'); g.fillStyle=gr; g.beginPath(); g.moveTo(256*x0,0); g.lineTo(256*(x0+w*0.35),0); g.lineTo(256*(x0+w*1.1+0.25),256); g.lineTo(256*(x0+w*0.5+0.1),256); g.closePath(); g.fill(); });
  return c})();
let parts=[], texts=[], slipsFly=[], shake=0, flashV=0, punch=0, punchX=null;
const PCAP=90; // keeps phones at 60fps
const addP=(p)=>{ if(parts.length<PCAP)parts.push(p) };
function dust(x,n,spd,size,life){ for(let i=0;i<n;i++)addP({x:x+(Math.random()-.5)*30,y:0,vx:(Math.random()-.5)*spd,vy:-20-Math.random()*spd*0.5,r:size*(0.6+Math.random()*0.8),life:life*(0.7+Math.random()*0.6),t:0,k:'d',fr:Math.random()<0.4}) }
function grit(x,n,dir){ for(let i=0;i<n;i++)addP({x,y:-10,vx:dir*(60+Math.random()*220),vy:-80-Math.random()*160,r:1.6+Math.random()*1.4,life:0.5,t:0,k:'g'}) }
function ring(x,big){ addP({x,y:-34-Math.random()*16,vx:0,vy:0,r:big?64:38,life:big?0.42:0.3,t:0,k:'r',big}) }
function ftext(x,s,col,big){ texts.push({x,y:-110,s,col:col||'#fff',t:0,big}) }
// ================= FIGHT VIEW =================
let M=null, cv=null, cx=null, view={w:0,h:0,dpr:1}, cam={x:0,w:600}, lastT=0, acc=0, running=false, curOpp=null, bet=0, betOdds=0, oppSkill=0.4, ended=false, ft=0, tapMash=0;
function sizeCanvas(){ if(!cv)return; const r=cv.getBoundingClientRect(); const dpr=Math.min(2,window.devicePixelRatio||1); view.dpr=dpr; view.w=Math.max(1,r.width); view.h=Math.max(1,r.height); cv.width=Math.round(view.w*dpr); cv.height=Math.round(view.h*dpr); }
addEventListener('resize',()=>{sizeCanvas()});
const tmp=document.createElement('canvas'), tcx=tmp.getContext('2d');
function bgLayout(){ const cw=view.w,ch=view.h; const s=Math.max(cw/1280,ch/720)*1.08; const top=ch-720*s; return {s,top,H:top+440*s,gy:top+440*s+0.32*(ch-(top+440*s))+6}; }
function spriteOf(f){ // choose pose image, transforms
  const im=pose(f.id,f.pose,f.s.stage); return im; }
const RIM=new Map();
function rimImg(im,dir){ const k=im.src+dir; if(RIM.has(k))return RIM.get(k); const w=im.naturalWidth,h=im.naturalHeight; const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const g=cv.getContext('2d'); const lg=g.createLinearGradient(dir?w:0,0,dir?0:w,h); lg.addColorStop(0,'rgba(255,214,140,.2)'); lg.addColorStop(.55,'rgba(0,0,0,0)'); lg.addColorStop(1,'rgba(10,5,0,.26)'); g.fillStyle=lg; g.fillRect(0,0,w,h); g.globalCompositeOperation='destination-in'; g.drawImage(im,0,0); RIM.set(k,cv); return cv }
const ANIM=new WeakMap();
function animOf(f){ let a=ANIM.get(f); if(!a){ a={ox:0,oy:0,vx:0,vy:0,lean:0,lv:0,st:f.st,air:0,lt:-1,px:null,ph:Math.random()*6.28,trail:[]}; ANIM.set(f,a) } return a }
function drawFighter(c,f,L,sc,t){
  const im=spriteOf(f); if(!(im.complete&&im.naturalWidth))return;
  const baseX=(f.x-cam.x)*sc+view.w/2;
  let depth=1,gy=L.gy;
  if(M.intro>0){ const p=clamp(1-M.intro/1.6,0,1); depth=0.7+0.3*p; gy=L.H+(L.gy-L.H)*(0.35+0.65*p); }
  const dw=f.s.w*sc*depth, k=dw/im.naturalWidth, dh=im.naturalHeight*k;
  // ---- springy squash & stretch ----
  const a=animOf(f); const dt=a.lt<0?0.016:clamp(t-a.lt,0.001,0.05); a.lt=t;
  if(a.st!==f.st){ // impulses on state entry
    if(f.st==='wind'){a.vy-=1.6;a.vx+=1.1;a.lv-=1.2} else if(f.st==='act'){a.vx+=2.6;a.vy-=1.8;a.lv+=1.4} else if(f.st==='hit'){a.vy-=2.8;a.vx+=2.4;a.lv-=2.4} else if(f.st==='dodge'){a.vx+=1.6;a.vy-=1.2} else if(f.st==='grab'){a.vx+=1.5;a.vy-=1}
    a.st=f.st }
  const airNow=f.air||0; if(a.air>6&&airNow<1){ a.vy-=2.6;a.vx+=2.2; dust(f.x,3,90,18,0.6) } a.air=airNow;
  let tx=-0.006*Math.sin(t*2.1+a.ph), ty=0.014*Math.sin(t*2.1+a.ph), tl=0;
  if(f.st==='wind'){tx=0.05;ty=-0.07;tl=-0.05} else if(f.st==='act'){tx=0.05;ty=-0.03;tl=0.04} else if(f.st==='hit'){ty=-0.05;tl=-0.06} else if(f.st==='move'){ty=-0.025*Math.abs(Math.sin(t*13+a.ph));tl=0.02} else if(f.st==='stun'||f.st==='ko'){tx=0;ty=0}
  const K=230,Dm=15; a.vx+=(-K*(a.ox-tx)-Dm*a.vx)*dt; a.vy+=(-K*(a.oy-ty)-Dm*a.vy)*dt; a.ox+=a.vx*dt; a.oy+=a.vy*dt;
  a.lv+=(-K*(a.lean-tl)-Dm*a.lv)*dt; a.lean+=a.lv*dt; a.ox=clamp(a.ox,-0.2,0.22); a.oy=clamp(a.oy,-0.22,0.2);
  let lunge=0; if(f.st==='wind') lunge=-0.05*f.s.w*sc*f.face; else if(f.st==='act'&&!(f.act&&f.act.dash)) lunge=0.09*f.s.w*sc*f.face; else if(f.st==='rec') lunge=0.04*f.s.w*sc*f.face;
  const bob=(f.st==='move')?-Math.abs(Math.sin(t*13+a.ph))*3.5*sc:0;
  const air=(f.air||0)*sc; const sh=(f.st==='hit'&&f.t<0.2)?Math.sin(t*90)*3*sc:0;
  const x=baseX+lunge+sh, y=gy-air+bob;
  // contact shadow (shrinks and fades while airborne)
  const sa=clamp(1-air/(dh*0.9),0.25,1); c.save(); c.globalAlpha=0.8*f.alpha*sa; const sw=dw*(1.05-0.25*(1-sa)); c.drawImage(shadSpr,baseX-sw/2,gy-sw*0.045,sw,sw*0.25); c.restore();
  // speed trail (ghost images while lunging/dashing)
  const vxs=a.px==null?0:Math.abs(baseX-a.px)/dt; a.px=baseX;
  if((f.st==='act'||f.st==='dodge'||(f.st==='move'&&f.buffs&&f.buffs.sprint))&&(vxs>240*sc||f.st==='act')){ a.trail.push({x,y,sx:1+a.ox,sy:1+a.oy,im,face:f.face,age:0}); if(a.trail.length>4)a.trail.shift() }
  for(let i=a.trail.length-1;i>=0;i--){ const g=a.trail[i]; g.age+=dt; if(g.age>0.2){a.trail.splice(i,1);continue} c.save(); c.globalAlpha=0.28*(1-g.age/0.2)*f.alpha; c.translate(g.x,g.y); if(g.face<0)c.scale(-1,1); c.scale(g.sx,g.sy); c.drawImage(g.im,-dw/2,-dh,dw,dh); c.restore(); }
  c.save(); c.globalAlpha=f.alpha; c.translate(x,y); if(f.face<0)c.scale(-1,1);
  let rot=0; if(f.st==='ko')rot=clamp(f.t*1.2,0,0.5)*(f.x<0?-1:1)*f.face*-1; if(f.st==='dodge')rot=-0.12; if(f.st==='stun'&&f.winded>0)rot=Math.sin(t*6)*0.06; if(f.st==='held')rot=Math.sin(t*20)*0.05;
  c.rotate(rot+a.lean); c.scale(1+a.ox,1+a.oy);
  // quick aura for buffs
  if(f.buffs.frenzy){c.shadowColor='#ff5a30';c.shadowBlur=18*sc} else if(f.buffs.sprint){c.shadowColor='#ffe27a';c.shadowBlur=14*sc} else if(f.buffs.quills){c.shadowColor='#e8e0a0';c.shadowBlur=10*sc}
  if(f.blocking){c.shadowColor='#7ad0ff';c.shadowBlur=22*sc}
  c.drawImage(im,-dw/2,-dh,dw,dh); c.shadowBlur=0;
  // warm rim light from the upper-left sun, only on the lit side
  if(f.st!=='ko'){ const ri=rimImg(im,f.face<0?1:0); if(ri)c.drawImage(ri,-dw/2,-dh,dw,dh); }
  if(f.flash>0||f.poison){ tmp.width=Math.ceil(dw);tmp.height=Math.ceil(dh); tcx.clearRect(0,0,tmp.width,tmp.height); tcx.drawImage(im,0,0,dw,dh); tcx.globalCompositeOperation='source-atop';
    if(f.flash>0){tcx.fillStyle=`rgba(255,255,255,${f.flash*0.75})`;tcx.fillRect(0,0,dw,dh)}
    if(f.poison){tcx.fillStyle=`rgba(90,220,60,${0.18+0.12*Math.sin(t*8)})`;tcx.fillRect(0,0,dw,dh)}
    tcx.globalCompositeOperation='source-over'; c.drawImage(tmp,-dw/2,-dh); }
  if(teen()&&f.scratch>0){ // mild realism: pale claw scratches (no blood)
    c.strokeStyle='rgba(255,238,210,.55)'; c.lineWidth=Math.max(1,1.5*sc); c.lineCap='round';
    for(let i=0;i<f.scratch;i++){ const bx=(-0.25+((i*37)%50)/100)*dw, by=-dh*(0.35+((i*23)%40)/100); c.beginPath(); for(let j=0;j<3;j++){c.moveTo(bx+j*5*sc,by); c.lineTo(bx+j*5*sc+14*sc,by+16*sc)} c.stroke(); } }
  c.restore();
  // dizzy stars
  if(f.winded>0){ c.save(); c.font=`${18*sc}px sans-serif`; c.textAlign='center'; for(let i=0;i<3;i++){const a2=t*5+i*2.1; c.fillText('✦',baseX+Math.cos(a2)*dw*0.22,gy-dh*0.95+Math.sin(a2)*8*sc)} c.restore(); }
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
  // big-hit punch-in: whole scene zooms toward the impact, then eases back
  const pe=Math.min(1,punch); if(pe>0.01){ const z=1+0.085*pe*pe*(3-2*pe), fx=punchX!=null?(punchX-cam.x)*sc+view.w/2:view.w/2; c.translate(fx,L.gy-view.h*0.12); c.scale(z,z); c.translate(-fx,-(L.gy-view.h*0.12)); }
  const par=-cam.x*0.10*sc; const ox=(view.w-1280*L.s)/2+clamp(par,-(1280*L.s-view.w)/2+1,(1280*L.s-view.w)/2-1);
  c.drawImage(BG,ox,L.top,1280*L.s,720*L.s);
  drawCrowd(c,ox,L.top,L.s,t,sc);
  drawParapet(c,ox,L.top,L.s);
  drawGates(c,L,sc);
  // warm grade over the walls
  const gr=c.createLinearGradient(0,0,0,L.H); gr.addColorStop(0,'rgba(20,10,0,.35)'); gr.addColorStop(1,'rgba(60,30,5,.08)'); c.fillStyle=gr; c.fillRect(0,0,view.w,L.H);
  // depth haze between the walls and the sand
  const hz=c.createLinearGradient(0,L.H-70*L.s,0,L.H+60*L.s); hz.addColorStop(0,'rgba(222,170,100,0)'); hz.addColorStop(.55,'rgba(222,170,100,.17)'); hz.addColorStop(1,'rgba(222,170,100,0)'); c.fillStyle=hz; c.fillRect(0,L.H-70*L.s,view.w,130*L.s);
  // dust behind
  drawParts(c,L,sc,false);
  // fighters (the one acting draws in front)
  const order=[f1,f2].sort((a,b)=>(a.st==='act'||a.st==='grab'?1:0)-(b.st==='act'||b.st==='grab'?1:0));
  M.outs.forEach(o=>drawFighter(c,o.f,L,sc,t)); order.forEach(f=>drawFighter(c,f,L,sc,t));
  drawParts(c,L,sc,true);
  // slips flying (13+ betting)
  if(teen()){ c.save(); slipsFly.forEach(s=>{ c.translate(s.x,s.y); c.rotate(s.r); c.fillStyle='#f4ead0'; c.fillRect(-4,-5,8,10); c.fillStyle='#b8402e'; c.fillRect(-4,-1,8,1.6); c.setTransform(view.dpr,0,0,view.dpr,0,0); c.translate(sx,sy); }); c.restore(); }
  // sun shafts + floating dust motes
  c.save(); c.globalCompositeOperation='lighter'; c.globalAlpha=0.5+0.12*Math.sin(t*0.6); const rw=view.w*1.15, rh=L.H*1.15, rsw=Math.sin(t*0.25)*view.w*0.02; c.drawImage(raysSpr,-view.w*0.05+rsw,0,rw,rh);
  c.globalAlpha=0.25+0.1*Math.sin(t*0.9+2); c.drawImage(raysSpr,view.w*0.12-rsw*1.5,0,rw*0.8,rh*0.9);
  c.fillStyle='#ffe9b0'; for(let i=0;i<22;i++){ const mx=((i*97.3+t*(6+i%5*3))%(view.w*1.1)), my=(i*53.7+Math.sin(t*0.7+i)*14+t*(3+i%3))%(L.gy*0.95); const tw2=0.35+0.35*Math.sin(t*2+i*1.7); c.globalAlpha=tw2*0.7*clamp(1-mx/(view.w*0.9),0.15,1); c.fillRect(mx,my,1.6,1.6); }
  c.restore();
  // texts
  texts.forEach(tx=>{ const px=(tx.x-cam.x)*sc+view.w/2, py=L.gy+(tx.y-tx.t*60)*sc; c.save(); c.globalAlpha=clamp(1.4-tx.t,0,1); const pop=1+Math.max(0,0.5-tx.t*3); c.font=`900 ${(tx.big?30:20)*Math.min(1.3,sc+0.4)*pop}px Georgia,serif`; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#000'; c.strokeText(tx.s,px,py); c.fillStyle=tx.col; c.fillText(tx.s,px,py); c.restore(); });
  c.restore();
  // vignette
  const v=c.createRadialGradient(view.w/2,view.h*0.55,view.h*0.28,view.w/2,view.h*0.55,view.h*0.95); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.62)'); c.fillStyle=v; c.fillRect(0,0,view.w,view.h);
  if(flashV>0){c.fillStyle=`rgba(255,245,220,${flashV})`;c.fillRect(0,0,view.w,view.h)}
}
function drawParts(c,L,sc,front){ for(const p of parts){ const px=(p.x-cam.x)*sc+view.w/2, py=L.gy+p.y*sc;
  if(p.k==='d'){ if(!!p.fr!==front||p.t<0)continue; const a=clamp(1-p.t/p.life,0,1)*0.55; c.globalAlpha=a; const r=p.r*sc*(1+p.t/p.life*1.6); c.drawImage(dustSpr,px-r,py-r,r*2,r*2); c.globalAlpha=1 }
  else if(p.k==='r'){ if(!front)continue; const u=p.t/p.life, r=p.r*sc*(0.3+u*1.1); c.save(); c.globalAlpha=(1-u)*0.8; c.strokeStyle=p.big?'#fff1c8':'#ffe3a8'; c.lineWidth=(p.big?5:3)*sc*(1-u*0.7); c.beginPath(); c.ellipse(px,py,r,r*0.55,0,0,7); c.stroke(); c.restore(); }
  else if(front){ c.fillStyle='rgba(196,160,104,.95)'; c.fillRect(px,py,p.r*sc,p.r*sc)} } }
function updFx(dt){
  parts=parts.filter(p=>{p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt; if(p.k==='d'){p.vx*=0.96;p.vy*=0.94}else if(p.k==='g'){p.vy+=700*dt; if(p.y>0){p.y=0;p.vy*=-0.2;p.vx*=0.5}} return p.t<p.life});
  texts=texts.filter(t=>{t.t+=dt;return t.t<1.3}); shake=Math.max(0,shake-dt*40); flashV=Math.max(0,flashV-dt*3); punch=Math.max(0,punch-dt*2.4);
  crowd.e=Math.max(0,crowd.e-dt*0.28); AU.crowdLevel(crowd.e);
  slipsFly=slipsFly.filter(s=>{s.t+=dt;s.x+=s.vx*dt+Math.sin(s.t*5+s.ph)*30*dt;s.y+=s.vy*dt;s.r+=s.vr*dt; return s.y<view.h+20&&s.t<4});
}
function spawnSlips(n){ if(!teen())return; const L=bgLayout(); for(let i=0;i<n;i++)slipsFly.push({x:Math.random()*view.w,y:L.top+(380+Math.random()*50)*L.s,vx:(Math.random()-.5)*60,vy:20+Math.random()*50,r:0,vr:(Math.random()-.5)*4,t:0,ph:Math.random()*6}); }
// ---- events -> feel ----
function handleEvents(){
  const sc=view.w/cam.w; 
  for(const e of M.events){
    switch(e.t){
      case 'hit': { const big=e.big||e.dmg>M.A.maxhp*0.08; shake=Math.max(shake,big?14:5); if(big){flashV=Math.max(flashV,0.12);spawnSlips(4)} ring(e.x,big); if(big){punch=Math.max(punch,1);punchX=e.x} AU.hit(big); dust(e.x,big?7:3,140,big?28:16,0.8); grit(e.x,big?10:4,e.dir||1);
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
      case 'tag': AU.whoosh(1); AU.growl(((e.who==='L'?M.A:M.B).s.mass)||1); ftext(e.x,'TAG IN!','#ffd98a',true); cheer(0.3); break;
      case 'down': ftext(e.x,'DOWN!','#ff9a6a',true); punch=1.1;punchX=e.x;ring(e.x,true); AU.ko(); shake=Math.max(shake,12); cheer(0.6); AU.cheer(0.8); spawnSlips(6); break;
      case 'end': AU.ko(); punch=1.2;punchX=null; cheer(1); AU.cheer(1); flashV=0.25; spawnSlips(14); banner(e.side==='L'?'VICTORY!':(e.how==='time'?'TIME UP':'DEFEATED'),2200); break;
    }
  }
  M.events.length=0;
  // footsteps dust
  for(const f of M.F){ if(f.st==='move'&&Math.random()<0.18)dust(f.x-f.face*f.s.w*0.2,1,40,14,0.6); if(f.st==='dodge'&&Math.random()<0.5)dust(f.x,1,60,14,0.5); if(f.st==='act'&&f.act&&f.act.dashing&&Math.random()<0.7)dust(f.x-f.face*f.s.w*0.3,2,80,20,0.7); }
}
function banner(s,ms){ const b=$('#banner'); b.textContent=s; b.classList.add('on'); setTimeout(()=>b.classList.remove('on'),ms) }
// ---- HUD ----
function hud(){
  const set=(id,f,tm)=>{ const h=$(id); $('.nm',h).textContent=(f.uid?(S.zoo.find(z=>z.u===f.uid)||{}).nick||f.s.name:f.s.name)+' L'+f.s.lvl; $('.hp i',h).style.width=Math.max(0,f.hp/f.maxhp*100)+'%'; $('.st i',h).style.width=Math.max(0,f.stam)+'%';
    $('.hp i',h).style.background=f.hp/f.maxhp<0.3?'linear-gradient(#ff9a6a,#c0452e)':''; $('.st i',h).style.opacity=f.winded>0?0.4:1;
    $('.stt',h).textContent=D.STAGES[f.s.stage].n+' '+tm.map(x=>x.dead?'○':x===f?'◉':'●').join('')+' '+(f.winded>0?'WINDED ':'')+(f.poison?'POISONED ':'')+(f.buffs.frenzy?'FRENZY ':'')+(f.buffs.sprint?'SPRINT ':'')+(f.buffs.quills?'QUILLS ':''); };
  set('#hbL',M.A,M.teamL); set('#hbR',M.B,M.teamR); if(lblId!==M.A.id)setLabels(M.A); const tb=$('#bTag'); const alive=M.teamL.filter(x=>!x.dead&&x!==M.A).length; tb.style.display=M.teamL.length>1?'':'none'; tb.disabled=!alive||M.tagCd.L>0; tb.innerHTML='TAG<small>'+(alive?(M.teamL[(M.teamL.indexOf(M.A)+1)%M.teamL.length].s.name):'no partner')+'</small>'; tb.style.opacity=(!alive||M.tagCd.L>0)?0.5:1; $('#clock').textContent=Math.max(0,Math.ceil(M.time));
  const sp=$('#bSp'); const cd=M.A.cd.sp; let el=sp.querySelector('.cd'); if(!el){el=document.createElement('div');el.className='cd';sp.appendChild(el)} el.style.height=(cd>0?cd/2.2*100:0)+'%';
  const g=M.g, gp=$('#grip'); if(g){ gp.classList.add('on'); const me=g.b===M.A, att=g.a===M.A; $('#gripT').textContent=me?'GRABBED! MASH ANY BUTTON!':att?'SQUEEZE! TAP BITE IN THE GREEN':'GRAPPLE'+(g.kind==='roll'?' · DEATH ROLL':''); $('#gMeter').style.width=Math.min(100,g.meter)+'%'; $('#gZone').style.display=att?'block':'none'; $('#gMark').style.left=`calc(${g.mark*100}% - 3px)`; } else gp.classList.remove('on');
}
// ---- loop ----
function loop(ts){ if(!running)return; const dt=Math.min(0.05,(ts-lastT)/1000||0.016); lastT=ts; acc+=dt*TS; let n=0;
  while(acc>=1/60&&n<30){ M.step(1/60); handleEvents(); updFx(1/60); acc-=1/60; n++; }
  ft+=dt; draw(ft); hud();
  if(M.over&&!ended&&M.afterT>2.8){ ended=true; endFight(); return }
  requestAnimationFrame(loop); }
function modOf(a){ return {stage:E.stageOf(a.lvl),lvl:a.lvl,tr:a.tr} }
function myTeam(){ return S.team.map(u=>S.zoo.find(z=>z.u===u)).filter(Boolean).map(a=>({id:a.id,uid:a.u,mod:modOf(a)})) }
function normTeam(t){ return (Array.isArray(t)?t:[t]).map(e=>typeof e==='string'?{id:e,mod:{stage:2,lvl:5,tr:{p:0,s:0,d:0}}}:e) }
let lblId=null, curTeam=null;
function startFight(oppTeam){
  curTeam=normTeam(oppTeam); ended=false; parts=[];texts=[];slipsFly=[]; crowd.e=0.15; shake=0; flashV=0; punch=0; punchX=null; cam.x=0;cam.w=900; lblId=null;
  show('fight'); cv=$('#cv'); cx=cv.getContext('2d'); sizeCanvas(); AU.init(); if(AU.ctx&&AU.ctx.state==='suspended')AU.ctx.resume(); $('#mute').textContent=S.muted?'🔇':'🔊';
  M=new E.Match(myTeam(),curTeam,{aiA:!!window.LE_AUTOPLAY,skillA:0.85,skillB:oppSkill});
  window.LE.match=M; running=true; lastT=performance.now(); acc=0; requestAnimationFrame(loop);
  setTimeout(()=>{AU.growl(M.A.s.mass||1)},400); setTimeout(()=>{AU.growl(M.B.s.mass||1)},900);
  banner('ENTER THE COLOSSEUM',1300);
}
const CLAWL={gorilla:'SLAM',ostrich:'KICK',cassowary:'KICK',kangaroo:'KICK',croc:'TAIL LASH',saltcroc:'TAIL LASH',hippo:'SLAM',rhino:'HORN',elephant:'TUSK',anaconda:'LASH',cobra:'LASH',komodo:'TAIL LASH',porcupine:'SWAT',wolf:'SLASH',fox:'SLASH'};
function setLabels(f){ lblId=f.id; $('#bClaw').textContent=CLAWL[f.id]||'CLAW'; $('#bSp').textContent=D.SPECIALS[SP[f.id].sp].label; }
// ---- player input ----
function bind(){
  const A=()=>M&&M.A;
  const down=(a)=>{ if(!M||M.over||M.intro>0)return; const f=M.A; AU.init();
    if(a==='left'){f.in.l=1} else if(a==='right'){f.in.r=1} else if(a==='block'){f.in.block=1; if(M.g)f.pressed.push('mash')} else if(a==='tag'){M.tag('L')} else { M.press(f,a) } 
    if(M.g&&(a==='left'||a==='right'))f.pressed.push('mash'); };
  const up=(a)=>{ if(!M)return; const f=M.A; if(a==='left')f.in.l=0; if(a==='right')f.in.r=0; if(a==='block')f.in.block=0; };
  $$('#ctl .b').forEach(b=>{ const a=b.dataset.a; b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture&&b.setPointerCapture(e.pointerId);b.classList.add('p');down(a)}); ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>{b.classList.remove('p');up(a)})); b.addEventListener('contextmenu',e=>e.preventDefault()); });
  const km={a:'left',arrowleft:'left',d:'right',arrowright:'right',s:'block',arrowdown:'block',j:'bite',k:'claw',l:'charge',';':'sp',' ':'dodge',w:'dodge',t:'tag'};
  addEventListener('keydown',e=>{ const a=km[e.key.toLowerCase()]; if(a&&!e.repeat&&$('#s-fight').classList.contains('on')){e.preventDefault();down(a)} });
  addEventListener('keyup',e=>{ const a=km[e.key.toLowerCase()]; if(a)up(a) });
  $('#mute').addEventListener('click',()=>{AU.init();AU.mute(!S.muted)});
}
// ================= SCREENS =================
function show(n){ $$('.screen').forEach(s=>{const on=s.id==='s-'+n; s.classList.toggle('on',on); if(!on&&s.id!=='s-fight')s.innerHTML=''}); if(n!=='fight')running=false; window.LE.screen=n; }
const f0=(n)=>n>=1000?Math.round(n).toLocaleString('en-US'):(n<1?n.toFixed(2):n<10&&n%1?n.toFixed(1):''+Math.round(n));
const stars=(a)=>'★'.repeat(Math.round(a/2))||'·';
const STG=D.STAGES, MAXLV=10;
const thumb=(id,p='idle',st)=>`assets/a/${artOf(id,st)}/${p}.webp`;
const modeBadge=()=>teen()?'<span class="chip gold">13+ mode</span>':'<span class="chip ok">Kids mode</span>';
const btnS='width:auto;min-height:40px;margin:0;font-size:15px;padding:0 14px';
const getA=(u)=>S.zoo.find(z=>z.u===u);
const dA=(a)=>E.derive(a.id,modOf(a));
const stageN=(a)=>STG[E.stageOf(a.lvl)].n;
const need=(lvl)=>60+40*(lvl-1);
const aName=(a)=>`${SP[a.id].n}`;
const price=(id)=>Math.max(40,Math.round(Math.pow(E.derive(id,{stage:2,lvl:5}).power,2)/80/10)*10);
function newAnimal(id){ const a={u:S.nextU++,id,lvl:1,xp:0,tr:{p:0,s:0,d:0}}; S.zoo.push(a); if(S.team.length<3&&!SP[id].hybrid&&S.team.length===0)S.team.push(a.u); return a; }
// ---- progression: XP, stages ----
function addXP(a,x,ups){ const s0=E.stageOf(a.lvl); a.xp+=x; while(a.lvl<MAXLV&&a.xp>=need(a.lvl)){a.xp-=need(a.lvl);a.lvl++} if(a.lvl>=MAXLV)a.xp=Math.min(a.xp,need(MAXLV)-1); const s1=E.stageOf(a.lvl); if(s1>s0&&ups)ups.push({u:a.u,from:s0,to:s1}); return s1>s0 }
const feedCost=(a)=>15+5*a.lvl;
const trainCap=(a)=>2+2*E.stageOf(a.lvl);
const trainPts=(a)=>a.tr.p+a.tr.s+a.tr.d;
const trainCost=(a,k)=>30+12*a.tr[k]+4*a.lvl;
function feed(u){ const a=getA(u); if(!a||S.coins<feedCost(a)||a.lvl>=MAXLV&&a.xp>=need(MAXLV)-1)return null; S.coins-=feedCost(a); const ups=[]; addXP(a,40,ups); save(); return {ups}; }
function train(u,k){ const a=getA(u); if(!a||a.tr[k]>=trainCap(a)||S.coins<trainCost(a,k))return null; S.coins-=trainCost(a,k); a.tr[k]++; const ups=[]; addXP(a,12,ups); save(); return {ups}; }
// ---- Leaf Park habitats & visitor income ----
const HMAX=4;
const buildCost=()=>250, upCost=(L)=>Math.round(120*Math.pow(L+1,1.5)/10)*10;
const hl=(h)=>S.habs[h]||0;
function housed(h){ const L=hl(h); if(!L)return []; return S.zoo.filter(a=>SP[a.id].hab===h).sort((x,y)=>dA(y).power-dA(x).power).slice(0,1+L); }
function perMin(a,L){ return Math.round((3+dA(a).power/6)*(0.8+0.35*L)); }
function habRate(h){ const L=hl(h); return housed(h).reduce((s,a)=>s+perMin(a,L),0); }
function totalRate(){ return Object.keys(D.HABITATS).reduce((s,h)=>s+habRate(h),0); }
const tillCap=()=>Math.max(60,totalRate()*40);
function tick(sec){ const r=totalRate(); if(r>0){ S.till=Math.min(tillCap(),S.till+r/60*sec) } }
function collect(){ const n=Math.floor(S.till); if(n<=0)return 0; S.till-=n; S.coins+=n; save(); return n }
function build(h){ const L=hl(h); if(L>=HMAX)return false; const c=L?upCost(L):buildCost(); if(S.coins<c)return false; S.coins-=c; S.habs[h]=L+1; save(); return true }
{ const off=Math.min(1800,Math.max(0,(Date.now()-(S.last||Date.now()))/1000)); if(S.zoo.length)tick(off); S.last=Date.now(); }
setInterval(()=>{ tick(TS); S.last=Date.now(); const el=$('#tillv'); if(el)el.textContent=Math.floor(S.till); const c=$('#coinv'); if(c)c.textContent=S.coins; if((window.LE.screen==='park')&&(++tickN%5===0))save(); },1000); let tickN=0;
// ---- title / start ----
function title(){ show('title'); const has=S.zoo.length>0;
  $('#s-title').innerHTML=`<h1>🍃 LEAF EVOLVE</h1><p class="sub">Raise real big cats and beasts. Run Leaf Park. Fight in the Colosseum.</p>
  <div class="hero" style="height:230px"><img src="${thumb('lion','attack')}"><img src="${thumb('tiger','idle')}" style="transform:scaleX(-1)"></div>
  ${has?`<button class="btn" id="bCont">CONTINUE · ${S.zoo.length} animals</button><button class="btn alt" id="bNew">New game</button>`:`<button class="btn" id="bNew">PLAY</button>`}
  <div class="card"><b>Mode:</b> ${modeBadge()}<div class="modes"><button class="btn ${teen()?'alt':'green'}" id="mKids">Kids (default)</button><button class="btn ${teen()?'green':'alt'}" id="mTeen">13+</button></div>
  <div class="note">Kids: no scratches, no betting. 13+ adds mild scratch marks and the coin-only betting screen. No blood in either mode.</div></div>
  <div class="brand">leafactivity.com · Leaf Evolve demo · all coins are in-game only</div>`;
  $('#bNew')&&($('#bNew').onclick=()=>{AU.init();AU.ui(); if(has&&!confirm('Start a new game? Your saved progress will be replaced.'))return; const m=S.mode,mu=S.muted; S=blank(); S.mode=m;S.muted=mu; save(); starter()});
  $('#bCont')&&($('#bCont').onclick=()=>{AU.init();AU.ui();hub()});
  $('#mKids').onclick=()=>{S.mode='kids';save();title()};
  $('#mTeen').onclick=()=>{ if(teen())return; if(confirm('13+ mode adds scratch marks and a coin-only betting screen. Are you 13 or older?')){S.mode='teen';save();title()} }; }
function starter(){ show('starter'); const opts=['tiger','lion'];
  $('#s-starter').innerHTML=`<h2>Adopt your first cub</h2><p class="sub">Feed it, train it, and watch it grow: Cub → Juvenile → Adult → Alpha. You get 300 coins and its first habitat for free.</p><div class="cards">${opts.map(id=>{const d=E.derive(id,{stage:0,lvl:1}),s=SP[id];return `<div class="card ac" data-id="${id}"><img src="${thumb(id,'idle',0)}" style="transform:scale(${hasSA(id,0)?1:.8})"><div class="t"><b>${s.n} cub</b><br>${s.fact}<br><span class="chip">cub ~${f0(d.realMass)} kg</span><span class="chip">adult ~${f0(s.mass)} kg</span><span class="chip">${D.SPECIALS[s.sp].label}</span><span class="chip">${D.HABITATS[s.hab].n} habitat</span></div></div>`}).join('')}</div>`;
  $$('#s-starter .ac').forEach(a=>a.onclick=()=>{ const id=a.dataset.id; const an=newAnimal(id); S.team=[an.u]; S.habs[SP[id].hab]=1; S.coins=300; S.till=0; S.last=Date.now(); save(); AU.ui(); hub() }); }
function hub(){ show('hub'); const lead=getA(S.team[0]); const rate=totalRate();
  $('#s-hub').innerHTML=`<div class="top"><span>🏆 ${S.wins}W · ${S.losses}L</span>${modeBadge()}<span class="coin">🪙 <span id="coinv">${S.coins}</span></span></div>
  <h2>🍃 Leaf Park HQ</h2><div class="hero">${lead?`<img src="${thumb(lead.id,'idle',E.stageOf(lead.lvl))}" style="transform:scale(${ssc(lead.id,E.stageOf(lead.lvl))});transform-origin:bottom center">`:''}</div>
  <div class="card"><div class="top"><span>👥 Team (${S.team.length}/3)</span><span>${S.team.map(u=>{const a=getA(u);return a?`<span class="chip gold">${aName(a)} · ${stageN(a)} L${a.lvl}</span>`:''}).join('')}</span></div>
  <div class="top"><span>🎟 Visitors pay <b>${rate}</b> coins/min</span><span>Till: <b id="tillv">${Math.floor(S.till)}</b></span></div></div>
  <button class="btn red" id="bFight">⚔ FIGHT IN THE COLOSSEUM</button>
  <div class="row"><button class="btn alt" id="bZoo">🐾 My animals</button><button class="btn alt" id="bPark">🏞 Leaf Park${S.till>=10?' 💰':''}</button></div>
  <div class="row"><button class="btn alt" id="bMkt">🛒 Market</button><button class="btn alt" id="bHome">☰ Menu</button></div>`;
  $('#bFight').onclick=()=>{AU.init();AU.ui();pickOpp()}; $('#bZoo').onclick=()=>{AU.ui();zoo()}; $('#bPark').onclick=()=>{AU.ui();park()}; $('#bMkt').onclick=()=>{AU.ui();market()}; $('#bHome').onclick=title; }
// ---- my animals ----
function statsAt(a){ const d=dA(a),s=SP[a.id]; return `<div class="stats"><span>Weight</span><span>${f0(d.realMass)} kg</span><span>Length</span><span>${f0(d.realLen)} m</span><span>Top speed</span><span>${Math.round(d.realSpd)} km/h</span><span>Bite/strike</span><span>~${f0(d.realBite)} N</span><span>Armor</span><span>${stars(s.arm)} (${s.arm}/10)</span><span>Special</span><span>${D.SPECIALS[s.sp].label}</span><span>Game: HP / hit</span><span>${d.maxhp} / ${d.dmg.toFixed(1)}</span></div>`; }
function zoo(){ show('zoo');
  $('#s-zoo').innerHTML=`<div class="top"><button class="btn alt" style="${btnS}" id="bBack">◀ Back</button><span>👥 Team ${S.team.length}/3</span><span class="coin">🪙 <span id="coinv">${S.coins}</span></span></div><h2>🐾 My animals</h2><p class="sub">Pick up to 3 for the Colosseum. Tag-switch between them mid-fight.</p>
  <div class="cards">${S.zoo.map(a=>{const inT=S.team.indexOf(a.u),st=E.stageOf(a.lvl),d=dA(a);return `<div class="card ${inT>=0?'sel':''}"><div class="ac" data-u="${a.u}"><img src="${thumb(a.id,'idle',st)}" style="transform:scale(${hasSA(a.id,st)?1:[.7,.85,1,1.05][st]})"><div class="t"><b>${aName(a)}</b> <span class="chip gold">${STG[st].n}</span><span class="chip">L${a.lvl}</span>${SP[a.id].hybrid?'<span class="chip hot">hybrid</span>':''}<br>Power ${d.power} · ${D.HABITATS[SP[a.id].hab].n}<div class="dnab" style="margin-top:4px"><i style="width:${a.lvl>=MAXLV?100:a.xp/need(a.lvl)*100}%"></i></div></div></div>
   <div class="row" style="margin-top:6px"><button class="btn alt" data-m="${a.u}" style="min-height:44px;font-size:15px;margin:0">Feed &amp; train</button><button class="btn ${inT>=0?'green':'alt'}" data-t="${a.u}" style="min-height:44px;font-size:15px;margin:0">${inT>=0?'In team #'+(inT+1)+' ✓':'Add to team'}</button></div></div>`}).join('')}</div>`;
  $('#bBack').onclick=hub; $$('#s-zoo [data-m],#s-zoo .ac').forEach(b=>b.onclick=()=>animal(+(b.dataset.m||b.dataset.u)));
  $$('#s-zoo [data-t]').forEach(b=>b.onclick=()=>{ toggleTeam(+b.dataset.t); zoo() }); }
function toggleTeam(u){ const i=S.team.indexOf(u); if(i>=0){ if(S.team.length>1)S.team.splice(i,1) } else if(S.team.length<3)S.team.push(u); save(); }
let msg='';
function animal(u){ show('animal'); const a=getA(u); if(!a)return zoo(); const st=E.stageOf(a.lvl), d=dA(a), cap=trainCap(a); const full=a.lvl>=MAXLV&&a.xp>=need(MAXLV)-1;
  const nextStage=STG[st+1]; const tr=(k,l)=>{const c=trainCost(a,k),dis=a.tr[k]>=cap||S.coins<c;return `<button class="btn alt" data-k="${k}" ${dis?'disabled':''} style="min-height:56px;font-size:14px;margin:0">${l}<small style="display:block;font-size:11px">${a.tr[k]>=cap?'max for '+STG[st].n:a.tr[k]+'/'+cap+' · 🪙'+c}</small></button>`};
  $('#s-animal').innerHTML=`<div class="top"><button class="btn alt" style="${btnS}" id="bBack">◀ Back</button><span class="coin">🪙 <span id="coinv">${S.coins}</span></span></div><h2>${aName(a)} · ${STG[st].n} L${a.lvl}</h2>
  <div class="hero" style="height:170px"><img src="${thumb(a.id,'idle',st)}" style="transform:scale(${ssc(a.id,st)});transform-origin:bottom center"></div>
  <div class="card"><div class="top" id="stg">${STG.map((s,i)=>`<span class="chip ${i===st?'gold':i<st?'ok':''}">${s.n}</span>`).join('→')}</div><div class="top"><span>XP ${a.lvl>=MAXLV?'MAX':a.xp+' / '+need(a.lvl)}</span><span>${nextStage?'Next stage at level '+nextStage.lvl:'Fully grown alpha'}</span></div><div class="dnab"><i style="width:${a.lvl>=MAXLV?100:a.xp/need(a.lvl)*100}%"></i></div></div>
  <div class="row"><button class="btn green" id="bFeed" ${(S.coins<feedCost(a)||full)?'disabled':''}>🥩 FEED<small style="display:block;font-size:12px">+40 XP · 🪙${feedCost(a)}</small></button></div>
  <div class="note" style="margin:0">TRAIN (+12 XP): raises power, speed or guard</div>
  <div class="row" style="margin:6px 0">${tr('p','💪 POWER')}${tr('s','⚡ SPEED')}${tr('d','🛡 GUARD')}</div>
  <div class="note" id="msg" style="min-height:18px;color:#ffd98a">${msg}</div>
  <button class="btn ${S.team.includes(a.u)?'green':'alt'}" id="bTeam">${S.team.includes(a.u)?'✓ In your Colosseum team':'Add to Colosseum team'}</button>
  <div class="card">${statsAt(a)}<div class="note" style="text-align:left">${SP[a.id].fact}</div></div>`;
  msg='';
  $('#bBack').onclick=zoo; $('#bTeam').onclick=()=>{toggleTeam(a.u);animal(u)};
  $('#bFeed').onclick=()=>{ AU.init(); const r=feed(u); if(!r)return; AU.ui(); msg='Yum! +40 XP'; r.ups.length?grow(r.ups,()=>animal(u)):animal(u) };
  $$('#s-animal [data-k]').forEach(b=>b.onclick=()=>{ AU.init(); const r=train(u,b.dataset.k); if(!r)return; AU.ui(); msg='Training done! '+({p:'Power',s:'Speed',d:'Guard'})[b.dataset.k]+' +1'; r.ups.length?grow(r.ups,()=>animal(u)):animal(u) }); }
// ---- growth stage-up screen ----
function grow(ups,done){ const g=ups[0]; const a=getA(g.u); AU.init(); AU.evolve(); const fl=$('#flash'); fl.classList.add('on'); setTimeout(()=>fl.classList.remove('on'),60); show('evolve');
  const sc=[.62,.8,1,1.08]; const before=E.derive(a.id,{stage:g.from,lvl:STG[g.from].lvl}), after=dA(a);
  $('#s-evolve').innerHTML=`<h2>🎉 Growth stage up!</h2><div class="hero glow" style="height:240px"><img id="gimg" src="${thumb(a.id,'idle',g.from)}" style="transform:scale(${ssc(a.id,g.from)});transform-origin:bottom center;transition:transform 1.4s ease-out"></div><div class="bigtxt win" style="font-size:30px">${aName(a)}: ${STG[g.from].n} → ${STG[g.to].n}</div>
  <div class="card"><div class="stats"><span>Weight</span><span>${f0(before.realMass)} → <b class="up">${f0(after.realMass)} kg</b></span><span>Bite/strike</span><span>${f0(before.realBite)} → <b class="up">${f0(after.realBite)} N</b></span><span>Speed</span><span>${Math.round(before.realSpd)} → <b class="up">${Math.round(after.realSpd)} km/h</b></span><span>Game HP</span><span>${before.maxhp} → <b class="up">${after.maxhp}</b></span></div></div><button class="btn" id="bOk">OK</button>`;
  setTimeout(()=>{const i=$('#gimg'); if(i)i.style.transform=`scale(${ssc(a.id,g.to)})`},60); setTimeout(()=>{const i=$('#gimg'); if(i)i.src=thumb(a.id,'idle',g.to)},650); window.LE.grown=g;
  $('#bOk').onclick=()=>{ ups.shift(); ups.length?grow(ups,done):done() }; }
// ---- Leaf Park (habitats earn from visitors) ----
function park(){ show('park'); const hs=Object.keys(D.HABITATS);
  $('#s-park').innerHTML=`<div class="top"><button class="btn alt" style="${btnS}" id="bBack">◀ Back</button><span class="coin">🪙 <span id="coinv">${S.coins}</span></span></div><div class="phero"><div><h2>🏞 Leaf Park</h2><p class="sub">Visitors pay to see your animals in their habitats. Fights are held in the Colosseum.</p></div></div>
  <div class="card"><div class="top"><span>🎟 <b id="rate">${totalRate()}</b> coins/min · ~${Math.round(totalRate()*0.7)} visitors/min</span><span>Till: <b id="tillv">${Math.floor(S.till)}</b> / ${Math.floor(tillCap())}</span></div><button class="btn green" id="bCollect" style="min-height:50px;margin:4px 0 0">💰 COLLECT</button></div>
  ${hs.map(h=>{ const L=hl(h), an=housed(h), all=S.zoo.filter(a=>SP[a.id].hab===h); const c=L?upCost(L):buildCost(); return `<div class="hab" style="background-image:url(assets/hab/${h}.webp)"><h3>${D.HABITATS[h].n} ${L?'· Lv'+L+' '+'★'.repeat(L):'· not built'}</h3>
   <div>${L?`<span class="chip ok">${habRate(h)} coins/min</span><span class="chip">holds ${1+L}</span>`:'<span class="chip">no visitors yet</span>'}</div>
   <div>${an.map(a=>`<span class="an"><img src="${thumb(a.id,'idle',E.stageOf(a.lvl))}">${aName(a)}<br>${perMin(a,L)}/min</span>`).join('')}${all.length>an.length?`<span class="chip hot">${all.length-an.length} no room</span>`:''}</div>
   ${L>=HMAX?'<div class="chip gold">MAX</div>':`<button class="btn ${S.coins>=c?'':'alt'}" data-h="${h}" ${S.coins>=c?'':'disabled'} style="min-height:46px;font-size:15px;margin:6px 0 0">${L?'Upgrade':'Build'} · 🪙${c}</button>`}</div>` }).join('')}`;
  $('#bBack').onclick=hub; $('#bCollect').onclick=()=>{ AU.init(); const n=collect(); if(n){AU.cheer(0.3)} park() };
  $$('#s-park [data-h]').forEach(b=>b.onclick=()=>{ AU.init(); if(build(b.dataset.h)){AU.ui(); park()} }); }
// ---- market / breeding ----
function market(){ show('market'); const ids=Object.keys(SP).filter(id=>!SP[id].hybrid).sort((a,b)=>price(a)-price(b));
  const adult=(id)=>S.zoo.some(a=>a.id===id&&E.stageOf(a.lvl)>=2);
  const canBreed=adult('lion')&&adult('tiger');
  $('#s-market').innerHTML=`<div class="top"><button class="btn alt" style="${btnS}" id="bBack">◀ Back</button><span class="coin">🪙 <span id="coinv">${S.coins}</span></span></div><h2>🛒 Animal market</h2><p class="sub">Buy cubs, or earn a free one by beating that species twice in the Colosseum. Each species needs its habitat built in Leaf Park.</p>
  <div class="card"><b>🧬 Breeding den</b><div class="note" style="text-align:left">Needs an adult (or older) lion and tiger. Hybrids are rare in captivity and are game-only extras. 🪙500 each.</div><div class="row"><button class="btn ${canBreed&&S.coins>=500?'':'alt'}" data-b="liger" ${canBreed&&S.coins>=500?'':'disabled'} style="min-height:46px;font-size:15px">Liger cub</button><button class="btn ${canBreed&&S.coins>=500?'':'alt'}" data-b="tigon" ${canBreed&&S.coins>=500?'':'disabled'} style="min-height:46px;font-size:15px">Tigon cub</button></div></div>
  <div class="cards">${ids.map(id=>{const s=SP[id],p=price(id),free=(S.beaten[id]||0)>=2&&!S.free[id],hb=hl(s.hab)>0,ok=hb&&(free||S.coins>=p);const own=S.zoo.filter(a=>a.id===id).length;
   return `<div class="card ac"><img src="${thumb(id,'idle',0)}"><div class="t"><b>${s.n}</b>${own?` <span class="chip ok">own ${own}</span>`:''}<br><span class="chip">adult ${f0(s.mass)} kg</span><span class="chip">${s.spd} km/h</span><span class="chip">~${f0(s.bite)} N</span><span class="chip ${hb?'':'hot'}">${D.HABITATS[s.hab].n}${hb?'':' (build first)'}</span>
   <button class="btn ${free?'green':ok?'':'alt'}" data-id="${id}" ${ok?'':'disabled'} style="min-height:44px;font-size:15px;margin:6px 0 0">${free?'FREE (earned) · claim cub':'Buy cub · 🪙'+p}</button></div></div>`}).join('')}</div>`;
  $('#bBack').onclick=hub;
  $$('#s-market [data-id]').forEach(b=>b.onclick=()=>{ const id=b.dataset.id; if(buyAnimal(id)){AU.init();AU.ui();market()} });
  $$('#s-market [data-b]').forEach(b=>b.onclick=()=>{ if(breed(b.dataset.b)){AU.init();AU.evolve();market()} }); }
function buyAnimal(id){ const free=(S.beaten[id]||0)>=2&&!S.free[id]; const p=price(id); if(hl(SP[id].hab)<1)return false; if(!free&&S.coins<p)return false; if(free)S.free[id]=1; else S.coins-=p; newAnimal(id); save(); return true }
function breed(id){ if(S.coins<500)return false; const ad=(x)=>S.zoo.some(a=>a.id===x&&E.stageOf(a.lvl)>=2); if(!ad('lion')||!ad('tiger'))return false; S.coins-=500; newAnimal(id); save(); return true }
// ---- opponents (teams, same size as yours) ----
const CAND=[]; Object.keys(SP).filter(id=>!SP[id].hybrid).forEach(id=>[0,1,2,3].forEach(st=>{ const lvl=STG[st].lvl+(st<3?1:2); CAND.push({id,st,mod:{stage:st,lvl,tr:{p:0,s:0,d:0}},pw:E.derive(id,{stage:st,lvl}).power}) }));
const myPow=()=>{ const t=myTeam(); return t.reduce((s,m)=>s+E.derive(m.id,m.mod).power,0)/Math.max(1,t.length) };
function pickContenders(){ const me=myPow(), n=Math.max(1,S.team.length); const rnd=E.mulberry(S.bouts*131+7); const res=[],used=new Set();
  (S.bouts<3?[0.6,0.95,1.6]:[0.8,1.2,1.9]).forEach(t=>{ const team=[]; const usedHere=new Set(); for(let k=0;k<n;k++){ let best=null,bs=1e9; CAND.forEach(c=>{ if(usedHere.has(c.id)||(res.length&&used.has(c.id)&&k===0))return; const sc=Math.abs(Math.log(c.pw/(me*t)))+rnd()*0.25; if(sc<bs){bs=sc;best=c} }); usedHere.add(best.id); team.push({id:best.id,mod:best.mod}); } team.forEach(m=>used.add(m.id)); res.push(team) });
  return res; }
const teamPow=(t)=>t.reduce((s,m)=>s+E.derive(m.id,m.mod).power,0)/t.length;
const oppSk=()=>clamp(0.28+0.02*S.bouts,0.28,0.72);
const tname=(m)=>`${STG[m.mod.stage].n} ${SP[m.id].n}`;
function pickOpp(){ show('pick'); if(!S.team.length){return zoo()} const me=myPow(); const list=pickContenders(); window.LE.contenders=list;
  $('#s-pick').innerHTML=`<div class="top"><button class="btn alt" style="${btnS}" id="bBack">◀ Back</button><span class="coin">🪙 ${S.coins}</span></div><h2>Choose your opponent</h2><p class="sub">Your team of ${S.team.length} enters the Colosseum. Real wild animals, same arena every time.</p><div class="cards">${list.map((t,i)=>{const r=teamPow(t)/me,tag=r>1.3?'<span class="chip hot">UNDERDOG · big reward</span>':r<0.9?'<span class="chip ok">Warm-up</span>':'<span class="chip gold">Even match</span>';
   return `<div class="card ac" data-i="${i}"><div style="display:flex;flex-direction:column;align-items:center">${t.map(m=>`<img src="${thumb(m.id,'idle',m.mod&&m.mod.stage)}" style="width:70px;height:46px">`).join('')}</div><div class="t">${tag}<br><b>${t.map(tname).join(' + ')}</b><br>Power ${Math.round(teamPow(t))} avg vs your ${Math.round(me)} avg</div></div>`}).join('')}</div>`;
  $('#bBack').onclick=hub; $$('#s-pick .ac').forEach(a=>a.onclick=()=>{ AU.ui(); const t=list[+a.dataset.i]; oppSkill=clamp(oppSk()+[0,0.2,0.4][+a.dataset.i],0.28,0.8); curTeam=t; bet=0; betOdds=0; if(teen())betScreen(); else startFight(t) }); }
// ---- betting (13+, coins only; odds from simulation; house edge keeps EV below even) ----
const BET_MIN=10, BET_MAX=200, EDGE=0.88;
function computeOdds(){ const p=E.winProb(myTeam(),curTeam,40,0.85,oppSkill,S.bouts+3); const pu=Math.min(0.97,p+0.04); const mult=Math.min(9,EDGE/pu); return {p,pu,mult:Math.round(mult*100)/100,open:pu<=0.85&&mult>=1.03}; }
function betScreen(){ show('bet'); $('#s-bet').innerHTML='<h2>Reading the odds…</h2><p class="sub">Simulating this matchup</p>';
  setTimeout(()=>{ const o=computeOdds(); betOdds=o.mult; const me=myTeam(); const maxB=Math.min(BET_MAX,S.coins); let amt=Math.min(maxB,Math.max(BET_MIN,Math.min(50,maxB)));
   const canBet=o.open&&S.coins>=BET_MIN; const side=(t)=>`<div>${t.map(m=>`<img src="${thumb(m.id,'idle',m.mod&&m.mod.stage)}" style="width:60px;height:38px;object-fit:contain">`).join('')}<br><small>${t.map(m=>SP[m.id].n).join(' + ')}</small></div>`;
   $('#s-bet').innerHTML=`<div class="top"><span>🪙 Coins ${S.coins}</span><span class="chip gold">13+ · coins only, no real money</span></div><h2>🏛 Crowd betting</h2>
   <div class="card"><div class="row" style="align-items:center;text-align:center">${side(me)}<div style="flex:0 0 28px;font-weight:900">VS</div>${side(curTeam)}</div></div>
   <div class="card"><div class="note">Odds are based on both teams' stats (simulated bouts).</div><div class="odds">${canBet?'Bet on your team · pays ×'+o.mult.toFixed(2):'No bet offered'}</div><div class="note">${canBet?`Estimated win chance ${Math.round(o.pu*100)}% · house edge 12% (expected return is below even)`:(S.coins<BET_MIN?'You need at least '+BET_MIN+' coins.':'Odds are too short to bet on this one.')}</div>
   ${canBet?`<div class="row" style="align-items:center;margin-top:8px"><button class="btn alt" id="bMinus" style="margin:0">−10</button><div class="odds" id="bAmt" style="flex:1.2">${amt}</div><button class="btn alt" id="bPlus" style="margin:0">+10</button></div><div class="row"><button class="btn alt" id="bMin">MIN ${BET_MIN}</button><button class="btn alt" id="bMax">MAX ${maxB}</button></div><div class="note" id="bNote">Min ${BET_MIN} · Max ${BET_MAX} coins. Win: +${Math.round(amt*(o.mult-1))} · Lose: −${amt}</div>`:''}</div>
   ${canBet?'<button class="btn green" id="bPlace">PLACE BET &amp; FIGHT</button>':''}<button class="btn ${canBet?'alt':''}" id="bNo">${canBet?'No bet, just fight':'FIGHT'}</button><button class="btn alt" id="bBk">◀ Back</button>`;
   const setAmt=(v)=>{amt=clamp(Math.round(v/10)*10,BET_MIN,Math.max(BET_MIN,maxB)); $('#bAmt').textContent=amt; $('#bNote').textContent=`Min ${BET_MIN} · Max ${BET_MAX} coins. Win: +${Math.round(amt*(o.mult-1))} · Lose: −${amt}`};
   if(canBet){ $('#bMinus').onclick=()=>{AU.ui();setAmt(amt-10)}; $('#bPlus').onclick=()=>{AU.ui();setAmt(amt+10)}; $('#bMin').onclick=()=>setAmt(BET_MIN); $('#bMax').onclick=()=>setAmt(maxB); $('#bPlace').onclick=()=>{ bet=amt; S.coins-=amt; save(); startFight(curTeam) } }
   $('#bNo').onclick=()=>{bet=0;startFight(curTeam)}; $('#bBk').onclick=pickOpp; },30); }
// ---- result ----
function endFight(){ running=false; const win=M.winner==='L'; const me=myPow(), op=teamPow(curTeam); const ratio=clamp(op/me,0.5,2.2);
  let coins=win?Math.round((30+18*ratio)*Math.max(1,curTeam.length*0.8)):8; const xpBase=win?Math.round(38*ratio+10):14;
  let betTxt=''; if(bet>0){ if(win){const g=Math.round(bet*betOdds); S.coins+=g; betTxt=`Bet won: +${g-bet} coins`} else betTxt=`Bet lost: −${bet} coins` }
  const ups=[]; const rows=[]; M.teamL.filter(f=>f.fought).forEach(f=>{ const a=getA(f.uid); if(!a)return; const x=Math.round(xpBase*(f.dead?0.8:1)); const l0=a.lvl; addXP(a,x,ups); rows.push(`<div class="top"><span>${aName(a)}</span><b>+${x} XP${a.lvl>l0?' · LEVEL '+a.lvl+'!':''}</b></div>`) });
  S.coins+=coins; S.bouts++; if(win){S.wins++;S.streak++; curTeam.forEach(m=>{S.beaten[m.id]=(S.beaten[m.id]||0)+1})} else {S.losses++;S.streak=0}
  const freeNow=win?curTeam.filter(m=>S.beaten[m.id]===2&&!S.free[m.id]).map(m=>SP[m.id].n):[]; save(); const st=M.A.stats;
  show('result');
  $('#s-result').innerHTML=`<div class="bigtxt ${win?'win':'lose'}">${win?'VICTORY!':'DEFEATED'}</div><div class="hero" style="height:150px"><img src="${thumb(win?M.teamL.find(f=>!f.dead).id:curTeam[0].id,win?'attack':'idle')}"></div>
  <p class="sub">${win?`The crowd roars! The rival team flees the sand.`:`Your team limps away to rest. Nobody is hurt in Leaf Evolve.`}</p>
  <div class="card">${rows.join('')}<div class="top"><span>🪙 Coins</span><b>+${coins}</b></div>${betTxt?`<div class="top"><span>🎟 Bet</span><b>${betTxt}</b></div>`:''}${freeNow.length?`<div class="note" style="color:#9bd36a">Earned a free ${freeNow.join(' / ')} cub! Claim it in the Market.</div>`:''}</div>
  ${ups.length?'<button class="btn green" id="bGrow">🎉 SEE GROWTH</button>':''}<button class="btn" id="bAgain">⚔ FIGHT AGAIN</button><button class="btn alt" id="bHub">Back to HQ</button>`;
  $('#bGrow')&&($('#bGrow').onclick=()=>grow(ups,hub)); $('#bAgain').onclick=pickOpp; $('#bHub').onclick=hub; }
// ================= BOOT =================
function resetAll(){ S=blank(); save() }
window.LE={artOf,crowdReady:()=>['calm','cheer','cheerk'].every(k=>CIMG[k].complete&&CIMG[k].naturalWidth>0),punch:()=>punch,particles:()=>parts.length,odds:(t,sk)=>{curTeam=t;oppSkill=sk||0.4;return computeOdds()},S:()=>S,save,show,hub,title,startFight,pickOpp,betScreen,park,zoo,market,animal,starter,feed,train,tick,collect,build,buyAnimal,breed,newAnimal,toggleTeam,addXP,derive:E.derive,reset:resetAll,engine:E,data:D,screen:'title',match:null,totalRate,housed,price,setAutoplay(v){window.LE_AUTOPLAY=v},grow:(u,from,to)=>grow([{u,from,to}],hub),get running(){return running}};
bind(); title();
})();

// Leaf Evolve - fight engine (headless, deterministic with a seed). No DOM, no audio.
(function(){
const D = window.LE_DATA; const L10 = Math.log10;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ---- real numbers -> game stats (log-compressed so skill can beat size) ----
function derive(id){
  const s=D.SPECIES[id]; const lm=L10(1+s.mass);
  const st={id,name:s.n,sp:s.sp,ai:s.ai,arm:s.arm};
  st.maxhp=Math.round(70+30*lm);
  st.dmg=4+1.8*(L10(s.bite)-1);                   // per bite
  st.run=clamp(90+2*s.spd,100,260);
  st.w=150*Math.pow(s.len,0.42)*(s.scale||1);   // drawn body width (world units)
  st.sz=0.85+0.12*lm;                           // bigger = slower wind-ups
  st.regen=26-3*lm; st.cost=0.9+0.25*lm;        // bigger = tires faster
  st.red=s.arm*0.035;                           // armor damage reduction
  st.mass=s.mass;
  st.power=Math.round(st.maxhp*st.dmg*(0.8+s.spd/200)*(1+st.red)/10);
  return st;
}
const SPEC_MOVES={
 venom:{w:.18,a:.1,r:.3,dmg:.55,reach:30,kb:30,stam:16,venom:1.9},
 swipe:{w:.36,a:.12,r:.5,dmg:1.75,reach:44,kb:240,stam:30,armor:1},
 kick:{w:.22,a:.1,r:.4,dmg:1.5,reach:38,kb:200,stam:20},
 gape:{w:.55,a:.12,r:.6,dmg:2.2,reach:30,kb:120,stam:32,armor:1},
 roll:{w:.24,a:.1,r:.5,dmg:.8,reach:28,kb:0,stam:30,grab:'roll'},
 constrict:{w:.26,a:.1,r:.5,dmg:.5,reach:30,kb:0,stam:30,grab:'constrict'},
 pounce:{w:.2,a:.4,r:.45,dmg:1.1,reach:20,kb:60,stam:30,dash:300,grab:'pin'},
 gore:{w:.26,a:.4,r:.6,dmg:1.9,reach:20,kb:360,stam:32,dash:280,armor:1},
 trample:{w:.32,a:.45,r:.7,dmg:2.1,reach:20,kb:480,stam:36,dash:360,armor:1},
 roar:{w:.35,a:.1,r:.4,dmg:0,reach:400,kb:0,stam:18,roar:1}
};
const CD={sp:2.2,charge:1.4};

class Fighter{
  constructor(id,side,x,opt){
    this.id=id; this.s=derive(id); this.side=side; this.x=x; this.face=side==='L'?1:-1;
    this.hp=this.maxhp=this.s.maxhp; this.stam=100; this.st='intro'; this.t=0;
    this.kv=0; this.in={l:0,r:0,block:0}; this.buf=null; this.pressed=[];
    this.iframes=0; this.hitstun=0; this.winded=0; this.flash=0; this.cd={sp:0,charge:0,dodge:0};
    this.buffs={}; this.poison=null; this.blockT=0; this.blocking=false; this.act=null; this.pose='idle';
    this.air=0; this.alpha=1; this.skill=opt&&opt.skill!=null?opt.skill:0.5; this.isAI=!!(opt&&opt.ai);
    this.ai={t:0,plan:'approach',pt:0,seen:0,hold:0,block:0,kind:this.s.ai}; this.lastHit=0; this.combo=0;
    this.stats={dealt:0,taken:0,parries:0,dodges:0}; this.scratch=0; this.tx=x;
  }
  get w(){return this.s.w}
}
class Match{
  constructor(idA,idB,opt={}){
    this.rnd=mulberry(opt.seed!=null?opt.seed:(Math.random()*1e9|0));
    this.A=new Fighter(idA,'L',-640,{skill:opt.skillA,ai:opt.aiA});
    this.B=new Fighter(idB,'R',640,{skill:opt.skillB!=null?opt.skillB:0.5,ai:true});
    this.A.tx=-170; this.B.tx=170;
    this.time=opt.limit||80; this.t=0; this.events=[]; this.g=null; this.over=false; this.winner=null; this.afterT=0;
    this.intro=opt.skipIntro?0:1.6; if(opt.skipIntro){this.A.x=this.A.tx;this.B.x=this.B.tx;this.A.st=this.B.st='idle'}
    this.hitstop=0; this.actId=0; this.how='ko';
    this.F=[this.A,this.B];
  }
  opp(f){return f===this.A?this.B:this.A}
  ev(o){this.events.push(o)}
  dist(){return Math.abs(this.A.x-this.B.x)}
  contact(){return 0.3*(this.A.w+this.B.w)}
  step(dt){
    this.t+=dt;
    if(this.hitstop>0){this.hitstop-=dt;return}
    for(const f of this.F){ if(f.isAI&&!this.over&&f.st!=='intro') this.think(f,this.opp(f),dt); }
    if(this.intro>0){this.intro-=dt; for(const f of this.F){f.x+=(f.tx-f.x)*Math.min(1,dt*2.6); f.pose='idle'; f.alpha=clamp(1-(Math.abs(f.x)-300)/340,0.15,1)} if(this.intro<=0){for(const f of this.F){f.st='idle';f.alpha=1}this.ev({t:'bell'})} return}
    if(this.g) this.grapple(dt);
    for(const f of this.F) this.upd(f,this.opp(f),dt);
    // soft collision
    const A=this.A,B=this.B; if(!this.g){const md=this.contact()*0.92, d=B.x-A.x; const dir=d>=0?1:-1; if(Math.abs(d)<md&&A.st!=='ko'&&B.st!=='ko'){const push=(md-Math.abs(d))/2; if(!(A.act&&A.act.dashing)) A.x-=dir*push; if(!(B.act&&B.act.dashing)) B.x+=dir*push; if(A.act&&A.act.dashing&&B.act&&B.act.dashing){A.x-=dir*push;B.x+=dir*push}}}
    for(const f of this.F){f.x=clamp(f.x,-560,560); if(!this.g)f.pressed.length=0}
    if(!this.over){
      this.time-=dt;
      if(this.time<=0){const a=this.A.hp/this.A.maxhp,b=this.B.hp/this.B.maxhp; this.finish(a>b?'L':'R','time')}
    } else this.afterT+=dt;
  }
  finish(side,how){ if(this.over)return; this.over=true; this.winner=side; this.how=how||'ko'; this.g=null;
    const lo=side==='L'?this.B:this.A, wi=side==='L'?this.A:this.B;
    for(const f of this.F){if(f.st==='held'||f.st==='grab')f.st='idle'}
    lo.st='ko';lo.t=0;lo.kv=(lo===this.A?-1:1)*160; wi.st='win';wi.t=0; wi.act=null;wi.blocking=false;
    this.ev({t:'end',side,how}); this.ev({t:'cheer',amt:1}); }
  // ---------- per-fighter ----------
  press(f,name){ f.buf={n:name,t:0.16}; f.pressed.push(name); }
  upd(f,o,dt){
    const s=f.s;
    for(const k in f.cd) f.cd[k]=Math.max(0,f.cd[k]-dt);
    f.iframes=Math.max(0,f.iframes-dt); f.flash=Math.max(0,f.flash-dt*4);
    for(const k in f.buffs){f.buffs[k]-=dt; if(f.buffs[k]<=0)delete f.buffs[k]}
    if(f.buf){f.buf.t-=dt; if(f.buf.t<=0)f.buf=null}
    if(f.poison){f.poison.t-=dt; f.hp-=f.poison.dps*dt; f.flashP=1; if(f.poison.t<=0)f.poison=null; if(f.hp<=0&&!this.over){f.hp=0;this.finish(f.side==='L'?'R':'L','poison')}}
    f.x+=f.kv*dt; f.kv*=Math.exp(-8*dt);
    if(f.st==='ko'){ f.t+=dt; if(f.t>0.5){const gate=(f.x<0?-1:1)*760; f.x+=Math.sign(gate-f.x)*110*dt; f.alpha=clamp(1-(f.t-0.6)/1.8,0,1);} f.pose='hit'; f.x=clamp(f.x,-800,800); return}
    if(f.st==='win'){f.t+=dt;f.pose=(f.t%1.2<0.35)?'attack':'idle';return}
    if(f.st==='grab'||f.st==='held'){f.blocking=false; f.pose=f.st==='grab'?'bite':'hit'; return}
    f.face=(o.x>f.x)?1:-1;
    const regenOK=['idle','move'].includes(f.st);
    if(f.winded>0){f.winded-=dt; f.st='stun'; f.pose='hit'; if(f.winded<=0){f.stam=45;f.st='idle'}; f.blocking=false; return}
    if(regenOK&&!f.blocking) f.stam=Math.min(100,f.stam+(s.regen+(f.buffs.sprint?30:0))*dt);
    else if(f.st==='rec'||f.st==='wind') f.stam=Math.min(100,f.stam+s.regen*0.3*dt);
    switch(f.st){
      case 'idle': case 'move': {
        f.pose='idle';
        const wantBlock=f.in.block&&f.stam>0;
        if(wantBlock&&!f.blocking){f.blockT=0}
        f.blocking=!!wantBlock; if(f.blocking){f.blockT+=dt; f.stam-=9*s.cost*dt; if(f.stam<=0)this.wind(f)}
        if(f.buf&&this.startAction(f,o,f.buf.n)){f.buf=null;break}
        const dir=(f.in.r?1:0)-(f.in.l?1:0);
        let sp=s.run*(f.buffs.sprint?1.8:1)*(f.blocking?0.45:1); 
        f.x+=dir*sp*dt; f.st=dir?'move':'idle'; f.walk=dir; f.pose='idle';
        break;}
      case 'wind': { f.t+=dt; f.pose='idle'; f.crouch=1;
        if(f.act&&f.t>=f.act.w){f.st='act';f.t=0;this.beginActive(f,o);} break;}
      case 'act': { f.t+=dt; f.crouch=0; this.activeTick(f,o,dt); if(f.st==='act'&&f.act&&f.t>=f.act.a){f.st='rec';f.t=0;f.act.dashing=false} break;}
      case 'rec': { f.t+=dt; f.pose=f.act?f.act.pose:'idle'; if(!f.act||f.t>=f.act.r){f.st='idle';f.act=null} break;}
      case 'hit': { f.t+=dt; f.pose='hit'; f.blocking=false; if(f.t>=f.hitstun){f.st='idle'} break;}
      case 'stun': { f.t+=dt; f.pose='hit'; if(f.t>=f.hitstun){f.st='idle'} break;}
      case 'dodge': { f.t+=dt; f.pose='idle'; f.x+=f.dd*f.s.run*2.6*Math.max(0,1-f.t/0.36)*dt; f.air=Math.sin(Math.min(1,f.t/0.36)*Math.PI)*28; if(f.t>=0.36){f.st='idle';f.air=0} break;}
    }
  }
  wind(f){f.winded=1.6;f.stam=0;f.st='stun';f.act=null;f.blocking=false;this.ev({t:'winded',who:f.side})}
  reach(f,m){return this.contact()+m.reach}
  mk(f,name){
    const s=f.s, sz=s.sz, fr=f.buffs.frenzy?0.7:1;
    let m;
    if(name==='bite') m={w:.17*sz*fr,a:.1,r:.24*sz*fr,dmg:s.dmg,reach:22,kb:70,stam:12,pose:'bite'};
    else if(name==='claw') m={w:.34*sz*fr,a:.12,r:.44*sz,dmg:s.dmg*1.7,reach:36,kb:160,stam:24,armor:1,pose:'attack'};
    else if(name==='charge') m={w:.22*sz,a:.38,r:.55*sz,dmg:s.dmg*1.15,reach:16,kb:260,stam:26,dash:240,armor:1,pose:'attack',cd:CD.charge};
    else if(name==='sp'){
      const k=D.SPECIES[f.id].sp; const base=SPEC_MOVES[k];
      if(base){m=Object.assign({pose:'bite',cd:CD.sp},base); m.w*=sz; m.dmg*=s.dmg; if(m.dash)m.pose='attack'; if(k==='venom'&&f.id==='cobra'){m.reach=70}
        if(k==='roar')m.pose='attack'}
      else m={w:.2,a:.1,r:.3,dmg:0,reach:0,kb:0,stam:18,buff:k,cd:CD.sp,pose:'idle'};
      m.kind=k;
    }
    m.name=name; m.stam*=1; m.id=++this.actId; return m;
  }
  startAction(f,o,name){
    if(name==='dodge'){ if(f.cd.dodge>0||f.stam<8)return false; f.stam-=18*f.s.cost; f.cd.dodge=0.5; f.st='dodge'; f.t=0; f.iframes=0.26;
      f.dd=(f.in.r?1:f.in.l?-1:-f.face); f.blocking=false; f.stats.dodges+=0; this.ev({t:'whoosh',x:f.x,big:0}); f.act=null; if(f.stam<=0)this.wind(f); return true;}
    if(name==='block'){return false}
    if((name==='sp'||name==='charge')&&f.cd[name]>0)return false;
    if(f.stam<5)return false;
    const m=this.mk(f,name); f.act=m; f.st='wind'; f.t=0; f.blocking=false;
    f.stam-=m.stam*f.s.cost; if(f.stam<0)f.stam=0; if(m.cd)f.cd[name]=m.cd;
    if(m.kind&&D.SPECIES[f.id].sp)f.act.dashing=false;
    this.ev({t:'wind',who:f.side,name,kind:m.kind}); return true;
  }
  beginActive(f,o){
    const m=f.act; m.hit=false; f.pose=m.pose;
    this.ev({t:'whoosh',x:f.x,big:m.dmg>f.s.dmg*1.4?1:0,kind:m.kind,who:f.side});
    if(m.buff){ if(m.buff==='sprint'){f.buffs.sprint=1.5;f.stam=Math.min(100,f.stam+25)} if(m.buff==='frenzy'){f.buffs.frenzy=4} if(m.buff==='quills'){f.buffs.quills=4}
      this.ev({t:'buff',who:f.side,kind:m.buff}); return }
    if(m.roar){ this.ev({t:'roar',who:f.side,x:f.x}); const d=this.dist(); if(d<m.reach+this.contact()){ if(o.blocking){o.stam-=12}else{o.stam-=32;o.st='stun';o.t=0;o.hitstun=0.45;o.act=null;o.blocking=false; if(o.stam<=0)this.wind(o)} this.ev({t:'text',x:o.x,s:o.blocking?'BRACED':'RATTLED!'})} return }
    if(m.dash){ m.dashing=true; m.dd=f.face; m.dl=m.dash; }
    else this.meleeCheck(f,o,m);
  }
  activeTick(f,o,dt){
    const m=f.act; if(!m.dash||!m.dashing)return;
    const sp=m.dash/m.a; const mv=Math.min(m.dl,sp*dt); f.x+=m.dd*mv; m.dl-=mv; f.air=Math.sin(clamp(f.t/m.a,0,1)*Math.PI)*(m.kind==='pounce'?44:6);
    if(!m.hit){ if(this.dist()<=this.reach(f,m)){ this.meleeCheck(f,o,m); m.dashing=false; f.air=0 } }
    if(m.dl<=0)m.dashing=false;
  }
  meleeCheck(f,o,m){
    if(m.hit)return; if(this.dist()>this.reach(f,m)){this.ev({t:'whiff',who:f.side,x:f.x}); if(m.dmg>0&&(m.armor||m.dash)){f.stam=Math.max(0,f.stam-8*f.s.cost);} if(f.stam<=0&&!this.over)this.wind(f); return}
    m.hit=true; this.strike(f,o,m);
  }
  strike(f,o,m){
    if(this.over||o.st==='ko')return;
    if(o.iframes>0||o.st==='dodge'){o.stats.dodges++; this.ev({t:'dodge',x:o.x,who:o.side}); f.lastWhiff=1; return}
    const fx=(f.x<o.x?1:-1);
    // parry / block
    if(o.blocking&&o.st!=='stun'&&o.face===-fx){
      if(o.blockT<0.2&&!m.grab){ o.stats.parries++; f.st='stun';f.t=0;f.hitstun=0.85;f.act=null;f.kv=-fx*160; f.stam=Math.max(0,f.stam-20); o.stam=Math.min(100,o.stam+15); this.ev({t:'parry',x:(f.x+o.x)/2,who:o.side}); this.ev({t:'cheer',amt:0.35}); this.hitstop=0.07; return}
      const dmg=m.dmg*0.22*(1-o.s.red); o.hp-=dmg; f.stats.dealt+=dmg; o.stats.taken+=dmg;
      o.stam-=(10+m.dmg*0.8)*o.s.cost; o.kv=fx*m.kb*0.4; this.ev({t:'block',x:o.x,who:o.side,dmg});
      if(o.stam<=0){this.wind(o); this.ev({t:'text',x:o.x,s:'GUARD BREAK'})}
      if(o.hp<=0)this.finish(f.side,'ko'); return;
    }
    // grabs
    if(m.grab){ this.startGrapple(f,o,m); return }
    let dmg=m.dmg*(f.buffs.frenzy?1.35:1)*(1-o.s.red)*(o.winded>0?1.5:1)*(o.st==='stun'||o.st==='rec'&&o.act&&!o.act.armor?1.15:1)*(o.buffs.frenzy?0.85:1)*(0.93+0.14*this.rnd());
    if(o.buffs.quills&&m.name!=='sp'){ f.hp-=Math.max(1.5,dmg*0.25); f.flash=1; this.ev({t:'text',x:f.x,s:'QUILLS!'}) }
    o.hp-=dmg; f.stats.dealt+=dmg; o.stats.taken+=dmg; o.flash=1; o.scratch=Math.min(5,o.scratch+1);
    const pct=dmg/o.maxhp, big=pct>0.1||m.armor;
    const mr=Math.pow(clamp(f.s.mass/o.s.mass,0.05,20),0.3);
    o.kv=fx*m.kb*clamp(mr,0.5,1.8); 
    const heavy=m.armor&&(o.st==='wind'||o.st==='act')&&o.act&&o.act.armor;
    if(!heavy||pct>0.18){ if(!(o.act&&o.act.armor&&(o.st==='wind'))){ o.st='hit';o.t=0;o.hitstun=clamp(0.22+pct*2.2,0.2,0.65)*clamp(mr,0.6,1.3);o.act=null;o.air=0; } }
    if(m.venom&&!o.poison){o.poison={t:5,dps:m.dmg*m.venom/5}; this.ev({t:'text',x:o.x,s:'POISONED'}) }
    if(m.name==='claw'&&o.winded>0&&!this.g){ this.hitFX(f,o,dmg,big,m); this.startGrapple(f,o,{grab:'pin',dmg:m.dmg*0.55}); return }
    this.hitFX(f,o,dmg,big,m);
    if(o.hp<=0){o.hp=0;this.finish(f.side,'ko')}
  }
  hitFX(f,o,dmg,big,m){
    this.hitstop=big?0.075:0.04;
    this.ev({t:'hit',x:(f.x+o.x)/2,who:o.side,dmg,big,name:m.name,kind:m.kind,dir:f.x<o.x?1:-1});
    this.ev({t:'cheer',amt:big?0.28:0.08+dmg/120});
  }
  // ---------- grapple / pin minigame ----------
  startGrapple(f,o,m){
    const kind=m.grab; const dur=kind==='pin'?2.4:3.2;
    const tick=(kind==='roll'?f.s.dmg*1.35:kind==='constrict'?f.s.dmg*0.75:f.s.dmg*0.7);
    this.g={a:f,b:o,kind,t:0,dur,tickT:0,tick,meter:28,mark:0,md:1,zone:[0.38,0.62],flash:0,gHit:0};
    f.st='grab';o.st='held';f.act=null;o.act=null;o.blocking=false;f.air=0;o.air=0; o.x=f.x+f.face*(this.contact()*0.9);
    this.ev({t:'grab',kind,who:o.side,x:(f.x+o.x)/2}); this.ev({t:'cheer',amt:0.35});
  }
  grapple(dt){
    const g=this.g,a=g.a,b=g.b; g.t+=dt; g.tickT+=dt; g.mark+=g.md*dt*1.7; if(g.mark>=1){g.mark=1;g.md=-1}if(g.mark<=0){g.mark=0;g.md=1}
    const sr=clamp(Math.pow(a.s.mass/b.s.mass,0.25),0.7,1.5);
    g.meter=Math.max(0,g.meter-(11*sr)*dt);
    // AI inputs
    for(const [f,att] of [[a,true],[b,false]]){ if(!f.isAI)continue;
      if(att){ if(!f.ai.gz&&g.mark>g.zone[0]&&g.mark<g.zone[1]){f.ai.gz=1; if(this.rnd()<0.45+0.4*f.skill)this.gripTap(f)} if(g.mark<g.zone[0]-0.05||g.mark>g.zone[1]+0.05)f.ai.gz=0 }
      else { if(this.rnd()<(3.5+4.5*f.skill)*dt)b.pressed.push('mash') } }
    for(const f of this.F){ const n=f.pressed.length; f.pressed.length=0;
      if(!n)continue;
      if(f===b){g.meter=Math.min(110,g.meter+8*n)} else {this.gripTap(f,n)} }
    if(g.kind==='constrict'){b.stam=Math.max(0,b.stam-7*dt)}
    if(g.tickT>=0.45){g.tickT=0; const d=g.tick*(1-b.s.red*0.5); b.hp-=d; a.stats.dealt+=d; b.stats.taken+=d; b.flash=1; this.ev({t:'hit',x:(a.x+b.x)/2,who:b.side,dmg:d,big:g.kind==='roll',name:'grab',kind:g.kind,dir:a.face}); this.ev({t:'cheer',amt:0.1}); if(b.hp<=0){b.hp=0;this.g=null;a.st='idle';this.finish(a.side,'ko');return}}
    if(g.meter>=100){ this.g=null; a.st='stun';a.t=0;a.hitstun=0.6;b.st='idle';b.kv=-a.face*160;a.kv=a.face*-80;b.iframes=0.3;this.ev({t:'free',who:b.side,x:b.x});return}
    if(g.t>=g.dur){ this.g=null; a.st='rec';a.act={pose:'idle',r:0.4};a.t=0;b.st='hit';b.t=0;b.hitstun=0.45;b.kv=a.face*260; this.ev({t:'hit',x:b.x,who:b.side,dmg:0,big:true,name:'throw',dir:a.face}); }
  }
  gripTap(f,n){ const g=this.g; if(!g||g.a!==f)return; if(g.mark>g.zone[0]&&g.mark<g.zone[1]){g.meter=Math.max(0,g.meter-14);g.gHit++;g.b.hp-=g.tick*0.5;this.ev({t:'text',x:f.x,s:'GRIP!'});g.flash=1}else{g.meter+=3;f.stam=Math.max(0,f.stam-3)} }
  // ---------- AI ----------
  think(f,o,dt){
    if(f.st==='grab'||f.st==='held'||f.st==='ko'||f.st==='win')return;
    const ai=f.ai; ai.t-=dt; ai.hold-=dt; if(ai.block>0){ai.block-=dt; if(ai.block<=0)f.in.block=0}
    const dir=o.x>f.x?1:-1; const gap=Math.abs(o.x-f.x)-this.contact();
    const set=(d)=>{f.in.l=d<0?1:0;f.in.r=d>0?1:0};
    const skill=f.skill, kind=ai.kind;
    // reactions to telegraphed attacks
    if(o.st==='wind'&&o.act&&o.act.id!==ai.seen&&(gap<(o.act.dash||0)+o.act.reach+90)&&f.st!=='wind'&&f.st!=='act'&&f.st!=='stun'&&f.st!=='hit'){
      ai.seen=o.act.id; const r=this.rnd(); const ign=(kind==='berserk'?0.5:1);
      const pb=(0.62*skill)*ign, pd=(0.4*skill)*ign*(kind==='charger'?0.8:1);
      if(r<pb&&f.stam>0){f.in.block=1;ai.block=0.55; f.blockT=0; f.blocking=true}
      else if(r<pb+pd&&f.stam>14){this.press(f,'dodge'); f.in.l=f.in.r=0; set(-dir);}
    }
    if(ai.t>0)return; ai.t=0.14+0.2*(1-skill)+this.rnd()*0.12;
    if(f.st==='wind'||f.st==='act'||f.st==='rec'||f.st==='dodge'||f.st==='hit'||f.st==='stun')return;
    const reachB=22+0, reachC=36;
    const inB=gap<=22, inC=gap<=36;
    const winded=o.winded>0||o.st==='stun'&&o.t>0.1;
    const rp=(a)=>this.rnd()<a;
    // tired: recover
    if(f.stam<22&&!winded){ set(-dir); if(rp(0.5*skill)&&gap<60){f.in.block=1;ai.block=0.5;f.blockT=0.3} ai.t+=0.2; return }
    if(!f.in.block){} 
    // punish whiffs / winded
    if((winded||(o.st==='rec'&&o.act&&o.act.r>0.3))&&gap<80&&rp(0.35+0.55*skill)){ set(dir); if(inC&&f.stam>20)this.press(f,winded?'claw':'bite'); else if(inB)this.press(f,'bite'); else set(dir); return }
    const sp=D.SPECIES[f.id].sp, spReach=sp&&SPEC_MOVES[sp]?SPEC_MOVES[sp].reach+(SPEC_MOVES[sp].dash||0)+(f.id==='cobra'?40:0):0;
    const canSp=f.cd.sp<=0&&f.stam>30; const canCh=f.cd.charge<=0&&f.stam>40;
    const doSp=()=>{this.press(f,'sp')};
    switch(kind){
      case 'kiter': if(gap>210){set(dir); if(canSp&&sp==='sprint'&&rp(0.5))doSp()} else if(gap<=36){ if(rp(0.55)){this.press(f,rp(0.7)?'bite':'claw')} else {this.press(f,'dodge');set(-dir)} } else if(gap<100&&rp(0.4)){set(-dir)} else set(rp(0.7)?dir:0); if(gap<110&&canSp&&sp!=='sprint'&&rp(0.25))doSp(); break;
      case 'ambush': case 'striker': if(gap>spReach+30){ set(rp(0.4)?dir:0); } else if(gap<=spReach&&canSp&&rp(0.55)){doSp(); set(0)} else if(inB&&rp(0.6)){this.press(f,'bite')} else if(gap<spReach+10){set(rp(0.5)?-dir:0)} else set(dir); if(kind==='striker'&&gap<60&&rp(0.5))set(-dir); break;
      case 'grappler': if(gap>40){set(dir); if(gap>220&&canCh&&rp(0.25))this.press(f,'charge')} else { set(0); if(canSp&&rp(0.45))doSp(); else if(inB)this.press(f,rp(0.6)?'bite':'claw') } break;
      case 'charger': if(gap>180&&canSp&&(f.stam>45)&&rp(0.55)){doSp()} else if(gap>150&&canCh&&rp(0.3)){this.press(f,'charge')} else if(gap>30){set(dir)} else {set(0); this.press(f,rp(0.5)?'claw':'bite')} break;
      case 'berserk': if(gap>28){set(dir)} else {set(0); if(canSp&&!f.buffs.frenzy&&rp(0.3)){doSp()} else this.press(f,rp(0.75)?'bite':'claw')} if(gap>150&&canSp&&!f.buffs.frenzy&&rp(0.3))doSp(); break;
      case 'defender': if(gap>90){ set(0); if(canSp&&!f.buffs.quills&&gap<200&&rp(0.4))doSp() } else if(gap>36){set(rp(0.5)?dir:0)} else { set(0); if(canSp&&!f.buffs.quills&&rp(0.6))doSp(); else this.press(f,'bite'); if(rp(0.4*skill)){f.in.block=1;ai.block=0.7;f.blockT=0.3} } break;
      case 'brawler': if(gap>40){set(dir); if(gap>200&&canCh&&rp(0.2))this.press(f,'charge')} else {set(0); const r=this.rnd(); if(canSp&&r<0.28)doSp(); else if(r<0.55)this.press(f,'claw'); else this.press(f,'bite')} break;
      case 'bluffer': if(gap>200&&canSp&&rp(0.6)){doSp()} else if(gap>40){set(dir); if(gap>150&&canCh&&rp(0.3))this.press(f,'charge')} else {set(0); this.press(f,rp(0.5)?'claw':'bite')} break;
      case 'pack': { if(gap>180){set(dir)} else if(gap>60){ if(rp(0.45)){set(dir)}else if(rp(0.5)){set(-dir)} else set(0); if(gap<150&&canSp&&sp==='pounce'&&rp(0.3))doSp() } else if(gap>36){set(dir)} else { if(rp(0.55)){this.press(f,'bite');} else if(rp(0.5)){this.press(f,'dodge');set(-dir)} else this.press(f,'claw') } break; }
      default: set(gap>30?dir:0); if(gap<=36)this.press(f,'bite');
    }
    // stand-off: avoid stalemates
    if(Math.abs(f.x)>520){set(f.x>0?-1:1)}
  }
}
// Monte-Carlo: win probability of A vs B when both are AI-controlled at given skill
function winProb(idA,idB,n=60,skillA=0.85,skillB=0.55,seed=1){
  let w=0;
  for(let i=0;i<n;i++){
    const m=new Match(idA,idB,{seed:seed*7919+i,skipIntro:true,aiA:true,skillA:skillA,skillB:skillB,limit:70});
    let k=0; while(!m.over&&k<70*30){m.step(1/30);m.events.length=0;k++}
    if(!m.over){m.finish(m.A.hp/m.A.maxhp>m.B.hp/m.B.maxhp?'L':'R','time')}
    if(m.winner==='L')w++;
  }
  return w/n;
}
window.LE_ENGINE={Match,Fighter,derive,winProb,mulberry,SPEC_MOVES,clamp};
})();

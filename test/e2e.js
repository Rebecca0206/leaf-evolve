// Headless e2e: node test/e2e.js [baseUrl]  (needs a static server serving the repo root)
const {chromium}=require('/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.js');
const BASE=process.argv[2]||'http://localhost:8765/';
const out=[];const ok=(c,m)=>{out.push((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const [w,h,n] of [[390,844,'portrait'],[844,390,'landscape']]){
  const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const p=await ctx.newPage(); const errs=[];
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push('PE '+e.message));
  p.on('dialog',d=>d.accept());
  await p.goto(BASE+'index.html?ts=6'); await p.evaluate(()=>LE.reset()); await p.reload();
  const scr=()=>p.evaluate(()=>LE.screen);
  // ---- title / kids mode / starter
  ok(await scr()==='title',`${n}: title screen`);
  await p.click('#bNew'); ok(await scr()==='starter',`${n}: starter screen`);
  ok(await p.$$eval('#s-starter .ac',a=>a.length)>=3,`${n}: >=3 evolution lines offered`);
  await p.click('#s-starter .ac[data-l=croc]'); ok(await scr()==='hub',`${n}: hub`);
  // ---- kids mode: no betting
  ok(await p.evaluate(()=>LE.S().mode)==='kids',`${n}: default Kids mode`);
  await p.click('#bFight'); await p.click('#s-pick .ac'); await p.waitForTimeout(300);
  ok(await scr()==='fight',`${n}: Kids mode goes straight to fight (betting hidden)`);
  // ---- real button taps (non-autoplay)
  await p.waitForFunction(()=>LE.match&&LE.match.intro<=0,null,{timeout:8000});
  await p.evaluate(()=>{LE.match.B.in.l=LE.match.B.in.r=0;LE.match.B.isAI=false}); // freeze enemy for the tap test
  const sel=a=>`#ctl .b[data-a=${a}]`;
  const tap=async(a,ms=60)=>{const bb=await (await p.$(sel(a))).boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.waitForTimeout(ms);await p.mouse.up()};
  const x0=await p.evaluate(()=>LE.match.A.x); await p.mouse.move(0,0);
  { const bb=await (await p.$(sel('right'))).boundingBox(); await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2); await p.mouse.down(); await p.waitForTimeout(250); const x1=await p.evaluate(()=>LE.match.A.x); await p.mouse.up(); ok(x1>x0+5,`${n}: RIGHT button moves the animal`);} 
  await p.evaluate(()=>{window.__d=0;const m=LE.match,o=m.startAction.bind(m);m.startAction=(f,oo,nm)=>{const r=o(f,oo,nm);if(nm==='dodge'&&r&&f===m.A)window.__d++;return r}});
  const st0=await p.evaluate(()=>LE.match.A.stam); await tap('claw'); await p.waitForTimeout(100);
  ok(await p.evaluate(s=>LE.match.A.stam<s||LE.match.A.st!=='idle',st0),`${n}: CLAW tap starts an attack and costs stamina`);
  await p.waitForTimeout(700); await tap('block',400); await tap('dodge'); await p.waitForTimeout(120);
  ok(await p.evaluate(()=>window.__d>0),`${n}: DODGE works`);
  // ---- full fight with autoplay driver (same engine, AI-controlled player)
  await p.evaluate(()=>{LE.setAutoplay(true);LE.startFight(LE.match.B.id)});
  await p.waitForTimeout(5000);
  await p.screenshot({path:`shots/fight-${n}.png`});
  await p.waitForFunction(()=>LE.screen==='result',null,{timeout:150000});
  ok(true,`${n}: a full fight completed -> result screen`);
  const res=await p.evaluate(()=>({w:LE.S().wins,l:LE.S().losses,dna:LE.S().dna}));
  // ---- more fights until DNA >= 120, then evolve
  let guard=0; while(!(await p.evaluate(()=>LE.canEvolve()))&&guard++<14){
    await p.click('#bAgain'); await p.click('#s-pick .ac:nth-child(1)'); await p.waitForFunction(()=>LE.screen==='result',null,{timeout:150000}); }
  ok(await p.evaluate(()=>LE.canEvolve()),`${n}: earned enough DNA from fights to evolve (${await p.evaluate(()=>LE.S().dna)} DNA, ${guard+1} fights)`);
  await p.click('#bHub'); await p.click('#bEvo'); ok(await scr()==='evolve',`${n}: evolve screen`);
  await p.screenshot({path:`shots/evolution-${n}.png`});
  const before=await p.evaluate(()=>LE.S().animal);
  await p.click('#s-evolve button[data-id]:not([disabled])'); await p.waitForTimeout(300);
  const after=await p.evaluate(()=>LE.S().animal); ok(after!==before,`${n}: evolved ${before} -> ${after}`);
  await p.screenshot({path:`shots/evolved-${n}.png`});
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('leafEvolve.v1')).animal); ok(saved===after,`${n}: progress saved in localStorage`);
  // ---- 13+ betting
  await p.click('#bOk'); await p.click('#bHome'); await p.click('#mTeen'); ok(await p.evaluate(()=>LE.S().mode)==='teen',`${n}: 13+ mode toggle (age confirm)`);
  await p.click('#bCont'); await p.click('#bFight'); await p.click('#s-pick .ac:last-child'); await p.waitForSelector('#bNo',{timeout:20000}); if(!(await p.$('#bPlace'))){ await p.click('#bBk'); await p.click('#s-pick .ac:nth-child(2)'); await p.waitForSelector('#bNo',{timeout:20000}); await p.waitForTimeout(100)}
  const betOK=await p.$('#bPlace'); ok(!!betOK,`${n}: 13+ betting screen with odds appears`);
  if(betOK){ const t=await p.textContent('#s-bet'); ok(/pays ×\d/.test(t)&&/house edge/.test(t)&&/Min 10/.test(t),`${n}: odds, house edge and min/max shown`);
    await p.screenshot({path:`shots/betting-${n}.png`});
    const c0=await p.evaluate(()=>LE.S().coins); await p.click('#bPlace'); await p.waitForTimeout(500);
    ok(await p.evaluate(c=>LE.S().coins<c,c0),`${n}: bet deducted from in-game coins`);
    await p.waitForTimeout(4000); await p.screenshot({path:`shots/fight-13plus-${n}.png`});
    await p.waitForFunction(()=>LE.screen==='result',null,{timeout:150000}); ok(true,`${n}: bet fight settled`); }
  ok(errs.length===0,`${n}: no console errors${errs.length?' -> '+errs.join(' | '):''}`);
  await ctx.close();
 }
 await b.close(); console.log(out.join('\n'));
})().catch(e=>{console.log(out.join('\n'));console.error(e);process.exit(1)});

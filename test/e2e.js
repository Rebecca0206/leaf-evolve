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
  const scr=()=>p.evaluate(()=>LE.screen), S=()=>p.evaluate(()=>JSON.parse(JSON.stringify(LE.S())));
  // ---- start with a tiger cub
  ok(await scr()==='title',`${n}: title`);
  await p.click('.screen.on #bNew'); ok(await scr()==='starter',`${n}: starter = tiger or lion cub`);
  ok(await p.$$eval('#s-starter .ac',a=>a.map(x=>x.dataset.id).join())==='tiger,lion',`${n}: starters are tiger cub / lion cub (no meerkat)`);
  await p.click('#s-starter .ac[data-id=tiger]'); ok(await scr()==='hub',`${n}: hub`);
  let s=await S(); ok(s.zoo.length===1&&s.zoo[0].id==='tiger'&&s.zoo[0].lvl===1,`${n}: tiger cub (Cub stage) owned, team=${s.team.length}`);
  // ---- park income tick (real timer, sped up by ?ts=6)
  await p.click('.screen.on #bPark'); ok(await scr()==='park',`${n}: Leaf Park screen`);
  const t0=(await S()).till; await p.waitForTimeout(2600); const t1=(await S()).till;
  ok(t1>t0+0.5,`${n}: habitat income ticks (till ${t0.toFixed(1)} -> ${t1.toFixed(1)})`);
  const c0=(await S()).coins; await p.click('.screen.on #bCollect'); ok((await S()).coins>c0,`${n}: collect visitor coins`);
  // ---- training
  await p.evaluate(()=>{LE.S().coins+=2500}); await p.click('.screen.on #bBack'); await p.click('.screen.on #bZoo'); await p.click('#s-zoo [data-m]'); ok(await scr()==='animal',`${n}: animal detail`);
  const pw0=await p.evaluate(()=>LE.derive('tiger',{stage:0,lvl:1,tr:LE.S().zoo[0].tr}).dmg);
  await p.click('#s-animal [data-k=p]'); s=await S(); const pw1=await p.evaluate(()=>LE.derive('tiger',{stage:0,lvl:1,tr:LE.S().zoo[0].tr}).dmg);
  ok(s.zoo[0].tr.p===1&&pw1>pw0,`${n}: training POWER +1 raises hit damage (${pw0.toFixed(2)} -> ${pw1.toFixed(2)})`);
  // ---- feed until growth stage up
  let guard=0,sawGrow=false; while(guard++<12){ if(await scr()==='evolve'){sawGrow=true;break} if(await p.$('.screen.on #bFeed:not([disabled])'))await p.click('.screen.on #bFeed'); else break; }
  ok(sawGrow,`${n}: feeding triggers growth stage-up screen`); const g=await p.evaluate(()=>LE.grown);
  ok(g&&g.from===0&&g.to===1,`${n}: Cub -> Juvenile`); if(n==='portrait') await p.screenshot({path:'shots/growth-portrait.png'});
  await p.click('.screen.on #bOk'); ok(await scr()==='animal',`${n}: back to animal after growth`);
  // ---- build habitats, buy animals, make a team of 3
  await p.click('.screen.on #bBack'); await p.click('.screen.on #bBack'); await p.click('.screen.on #bPark');
  for(const h of ['savanna','forest']){ await p.click(`#s-park [data-h=${h}]`); }
  ok((await S()).habs.savanna===1&&(await S()).habs.forest===1,`${n}: built Savanna + Forest habitats`);
  await p.click('.screen.on #bBack'); await p.click('.screen.on #bMkt'); await p.click('#s-market [data-id=lion]'); await p.click('#s-market [data-id=wolf]');
  s=await S(); ok(s.zoo.some(a=>a.id==='lion')&&s.zoo.some(a=>a.id==='wolf'),`${n}: bought lion + wolf cubs from the market`);
  if(n==='portrait') await p.screenshot({path:'shots/market-portrait.png'});
  await p.click('.screen.on #bBack'); await p.click('.screen.on #bZoo'); for(const u of s.zoo.map(a=>a.u).filter(u=>!s.team.includes(u))){ await p.click(`#s-zoo [data-t="${u}"]`); }
  s=await S(); ok(s.team.length===3,`${n}: team of 3 chosen`);
  if(n==='portrait') await p.screenshot({path:'shots/team-portrait.png'});
  await p.click('.screen.on #bBack'); await p.click('.screen.on #bPark'); await p.waitForTimeout(400); await p.screenshot({path:`shots/park-${n}.png`}); ok((await p.$$eval('#s-park .hab .an',a=>a.length))>=3,`${n}: park shows animals housed in their habitats`);
  // ---- team fight with tag-switching (real button taps)
  await p.click('.screen.on #bBack'); await p.click('.screen.on #bFight'); await p.click('#s-pick .ac:nth-child(2)'); await p.waitForTimeout(300);
  ok(await scr()==='fight',`${n}: team fight starts (Kids mode, no betting)`);
  await p.waitForFunction(()=>LE.match&&LE.match.intro<=0,null,{timeout:8000});
  ok(await p.evaluate(()=>LE.match.teamL.length===3&&LE.match.teamR.length===3),`${n}: 3v3 teams`);
  const lead=await p.evaluate(()=>LE.match.A.uid);
  const bb=await (await p.$('#bTag')).boundingBox(); await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2); await p.mouse.down(); await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(200);
  const lead2=await p.evaluate(()=>LE.match.A.uid); ok(lead2!==lead,`${n}: TAG button switches fighter mid-fight`);
  await p.waitForTimeout(1500); await p.screenshot({path:`shots/fight-${n}.png`});
  await p.evaluate(()=>{LE.setAutoplay(true);LE.match.teamL.forEach(f=>f.isAI=true)});
  await p.waitForFunction(()=>LE.screen==='result',null,{timeout:200000}); ok(true,`${n}: team fight completed -> result`);
  const fought=await p.evaluate(()=>LE.match.teamL.filter(f=>f.fought).length); ok(fought>=2,`${n}: ${fought} team members fought and earned XP`);
  // ---- 13+ betting with teams
  await p.click('.screen.on #bHub'); await p.click('.screen.on #bHome'); await p.click('#mTeen'); ok((await S()).mode==='teen',`${n}: 13+ mode (age confirm)`);
  await p.click('.screen.on #bCont'); await p.click('.screen.on #bFight'); await p.click('#s-pick .ac:last-child'); await p.waitForSelector('#bNo',{timeout:30000}); if(!(await p.$('#bPlace'))){ await p.click('.screen.on #bBk'); await p.click('#s-pick .ac:nth-child(2)'); await p.waitForSelector('#bNo',{timeout:30000}); await p.waitForTimeout(100)}
  const betOK=await p.$('#bPlace'); ok(!!betOK,`${n}: 13+ betting screen appears`);
  if(betOK){ const t=await p.textContent('#s-bet'); ok(/pays ×\d/.test(t)&&/house edge/.test(t)&&/Min 10/.test(t),`${n}: odds, house edge, min/max shown`);
    if(n==='portrait')await p.screenshot({path:'shots/betting-portrait.png'});
    const c1=(await S()).coins; await p.click('.screen.on #bPlace'); await p.waitForTimeout(500); ok((await S()).coins<c1,`${n}: bet deducted from in-game coins`);
    await p.waitForTimeout(3500); await p.screenshot({path:`shots/fight-13plus-${n}.png`});
    await p.waitForFunction(()=>LE.screen==='result',null,{timeout:200000}); ok(true,`${n}: bet fight settled`); }
  ok(errs.length===0,`${n}: no console errors${errs.length?' -> '+errs.join(' | '):''}`);
  await ctx.close();
 }
 await b.close(); console.log(out.join('\n'));
})().catch(e=>{console.log(out.join('\n'));console.error(e);process.exit(1)});

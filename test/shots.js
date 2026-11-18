const {chromium}=require('/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.js');
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 for(const [w,h,n] of [[390,844,'portrait'],[844,390,'landscape']]){
  const p=await b.newPage({viewport:{width:w,height:h},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push('PE '+e.message));
  await p.goto('http://localhost:8765/index.html'); 
  await p.evaluate(()=>{LE.reset();const S=LE.S();S.mode='teen';S.line='mammal';S.animal='jaguar';S.seen={jaguar:1};S.path=['meerkat','honey_badger','jaguar'];S.bouts=8;S.coins=240;LE.setAutoplay(true);LE.startFight('tiger')});
  await p.waitForFunction(()=>LE.match&&LE.match.intro<=0);
  let got=false;
  for(let i=0;i<200&&!got;i++){ await p.waitForTimeout(120); got=await p.evaluate(()=>{const m=LE.match;return !m.over&&m.A.hp<m.A.maxhp*0.8&&m.B.hp<m.B.maxhp*0.8&&(m.g||m.A.st==='act'||m.B.st==='act'||m.A.st==='hit'||m.B.st==='hit')}); }
  await p.waitForTimeout(150); await p.screenshot({path:`shots/fight-${n}.png`});
  await p.evaluate(()=>{LE.setAutoplay(false);const S=LE.S();S.animal='honey_badger';S.dna=420;S.path=['meerkat','honey_badger'];LE.evolveScreen()});
  await p.waitForTimeout(300); await p.screenshot({path:`shots/evolution-${n}.png`});
  console.log(n,got,errs.join('|')); await p.close(); }
 await b.close();})();

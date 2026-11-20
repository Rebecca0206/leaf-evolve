// node test/shots.js [baseUrl] -> shots/cub-portrait.png (tiger cub in the Colosseum) + shots/cub-animal-portrait.png
const {chromium}=require('/usr/local/lib/pnpm/5/.pnpm/playwright@1.63.0-alpha-2026-08-31/node_modules/playwright/index.js');
const BASE=process.argv[2]||'http://localhost:8765/';
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
 const p=await ctx.newPage(); const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push('PE '+e.message));
 await p.goto(BASE+'index.html'); await p.evaluate(()=>LE.reset()); await p.reload();
 await p.click('.screen.on #bNew'); await p.click('#s-starter .ac[data-id=tiger]');
 await p.click('.screen.on #bZoo'); await p.click('#s-zoo [data-m]'); await p.waitForTimeout(500); await p.screenshot({path:'shots/cub-animal-portrait.png'});
 await p.evaluate(()=>{LE.setAutoplay(true);LE.startFight(['cassowary'])});
 await p.waitForFunction(()=>LE.match&&LE.match.intro<=0,null,{timeout:8000});
 for(let i=0;i<120;i++){ await p.waitForTimeout(150); const r=await p.evaluate(()=>{const m=LE.match;return m.A.st==='act'||m.B.st==='act'}); if(r&&i>8)break }
 await p.waitForTimeout(120); await p.screenshot({path:'shots/cub-portrait.png'});
 console.log('errors:',errs.join('|')||'none'); await b.close();})();

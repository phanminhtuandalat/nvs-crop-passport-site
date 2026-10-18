const { chromium } = require('playwright-core');
const { execSync } = require('child_process');
(async () => {
  let browser;
  try {
    let executablePath = null;
    for (const name of ['google-chrome', 'google-chrome-stable', 'chromium']) {
      try {
        const result = execSync('command -v ' + name, {encoding:'utf8'}).trim();
        if (result) { executablePath = result; break; }
      } catch {}
    }
    if (!executablePath) {
      executablePath = chromium.executablePath();
    }
    browser = await chromium.launch({ headless:true, executablePath, args:['--no-sandbox','--disable-gpu'] });
    const sizes = [
      {w:320,h:680},{w:360,h:780},{w:375,h:812},
      {w:390,h:844},{w:430,h:932},{w:768,h:1024},
      {w:1024,h:768},{w:1440,h:900}
    ];
    for(const {w,h} of sizes){
      const page = await browser.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:1, isMobile:w<=430, hasTouch:w<=430 });
      await page.route('https://fonts.googleapis.com/**', route=>route.abort());
      await page.route('https://fonts.gstatic.com/**', route=>route.abort());
      await page.goto('http://127.0.0.1:8765/community.html',{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(150);
      const dimensions = await page.evaluate(() => {
        const select = ['.header','.container','.hero-inner','.access-card','.steps','.step','.promise-inner','.action-button'];
        const bad = [];
        for(const query of select){
          document.querySelectorAll(query).forEach((node) => {
            const rect=node.getBoundingClientRect();
            if(rect.left < -1 || rect.right > window.innerWidth + 1) {
              bad.push({selector:query,left:rect.left,right:rect.right});
            }
          });
        }
        const link = document.querySelector('#portal-open-link');
        return {
          viewport:window.innerWidth,
          scrollWidth:document.documentElement.scrollWidth,
          iframeCount:document.querySelectorAll('iframe').length,
          href:link?.href||'',
          bad
        };
      });
      console.log(JSON.stringify({size:w,dimensions}));
      if(dimensions.scrollWidth > dimensions.viewport + 1)
        throw Error('HORIZONTAL SCROLL OVERFLOW at '+w+'px: '+dimensions.scrollWidth);
      if(dimensions.bad.length)
        throw Error('VISIBLE ELEMENT OVERFLOW at '+w+'px: '+JSON.stringify(dimensions.bad));
      if(dimensions.iframeCount !== 0)
        throw Error('Unexpected nested iframe');
      if(!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(dimensions.href))
        throw Error('CTA does not link to Google Apps Script');
      if(w===390) await page.screenshot({path:'nvs-mobile-390.png',fullPage:true});
      if(w===1440) await page.screenshot({path:'nvs-desktop-1440.png',fullPage:true});
      await page.close();
    }
    for (const route of ['index.html','season.html?id=NVS-CF-BHD-20261019']) {
      for(const {w,h} of sizes) {
        const page=await browser.newPage({ viewport:{width:w,height:h}, deviceScaleFactor:1 });
        await page.route('https://fonts.googleapis.com/**', r=>r.abort());
        await page.route('https://fonts.gstatic.com/**', r=>r.abort());
        await page.goto('http://127.0.0.1:8765/'+route,{waitUntil:'domcontentloaded'});
        const metrics=await page.evaluate(()=>({
          innerWidth:window.innerWidth,
          scrollWidth:document.documentElement.scrollWidth,
          bodyWidth:document.body.scrollWidth,
        }));
        console.log(JSON.stringify({route,viewport:w,metrics}));
        if(metrics.scrollWidth > metrics.innerWidth + 1)
          throw Error('Horizontal overflow on '+route+' at '+w+'px');
        await page.close();
      }
    }
    console.log('PASS: portal + homepage + season diary are responsive 320–1440px.');
  } finally {if(browser) await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});

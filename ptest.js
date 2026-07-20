const puppeteer = require('puppeteer');

const targets = [
  'https://rommark.dev/playground/apps/forex-signals/',
  'https://rommark.dev/playground/demos/galaxy-tour.html',
  'https://rommark.dev/playground/games/stellar-drift.html',
  'https://rommark.dev/playground/02-cascade-pipes.html',
  'https://rommark.dev/playground/20-aurora-maze.html'
];

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  for (const url of targets) {
    const page = await browser.newPage();
    const errors = [];
    page.on('console', m => { if (m.type()==='error') errors.push('CONSOLE: '+m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR: '+e.message));
    page.on('requestfailed', r => errors.push('REQFAIL: '+r.url()+' '+(r.failure()&&r.failure().errorText)));
    try {
      await page.goto(url, { waitUntil:'networkidle2', timeout: 25000 });
      await new Promise(r=>setTimeout(r,2500));
    } catch(e){ errors.push('GOTO: '+e.message); }
    const bodyLen = (await page.content()).length;
    console.log('=== '+url+' (len '+bodyLen+') ===');
    if (errors.length) errors.slice(0,12).forEach(e=>console.log('  '+e));
    else console.log('  no errors');
    await page.close();
  }
  await browser.close();
})();

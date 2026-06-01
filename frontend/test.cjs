const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERROR:', err.toString()));
  
  await page.goto('http://localhost:5175');
  
  // click footer 5 times
  for(let i=0; i<5; i++) {
    await page.click('footer strong');
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.type('input[placeholder="admin"]', 'admin');
  await page.type('input[placeholder="••••••••"]', 'VyxenAdmin@2025');
  
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Now click on Voters tab
  try {
    const votersTab = await page.$x("//button[contains(., 'Voters')]");
    if (votersTab.length > 0) {
      await votersTab[0].click();
      await new Promise(r => setTimeout(r, 1000));
    } else {
      console.log('No voters tab found');
    }
  } catch (e) {
    console.log('Error clicking voters tab', e);
  }
  
  await browser.close();
})();

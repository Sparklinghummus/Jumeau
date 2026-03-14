const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('file:///Users/luc/Desktop/Jumeau/prototype/home.html');
  await page.screenshot({ path: '/Users/luc/.gemini/antigravity/brain/eeeed1b8-802e-4162-a9a7-391f97f42362/home_layout_screenshot.png' });
  await browser.close();
})();

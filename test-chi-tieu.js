const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  
  try {
    await page.goto('file:///D:/HK3/NOTIOn/khong-gian-cua-toi/khong-gian-cua-toi/chi-tieu.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check header is present
    const header = await page.locator('header').count();
    console.log('✓ Headers found:', header);
    
    // Check nav tabs
    const tabs = await page.locator('nav.tabs button').count();
    console.log('✓ Tab buttons found:', tabs);
    
    // Check heatmap wrapper
    const heatmapWrapper = await page.locator('.heatmap-wrapper').count();
    console.log('✓ Heatmap wrapper found:', heatmapWrapper);
    
    // Check heatmap cells
    const heatmapCells = await page.locator('.heatmap-cell').count();
    console.log('✓ Heatmap cells found:', heatmapCells);
    
    // Check header background is solid (not transparent)
    const headerBg = await page.evaluate(() => {
      const computed = window.getComputedStyle(document.querySelector('header'));
      return computed.backgroundColor;
    });
    console.log('✓ Header background:', headerBg);
    
    // Check accent color is blue, not rose
    const activeTabColor = await page.evaluate(() => {
      const activeTab = document.querySelector('nav.tabs button.active');
      if(!activeTab) return 'NO_ACTIVE_TAB';
      const computed = window.getComputedStyle(activeTab);
      return computed.backgroundColor;
    });
    console.log('✓ Active tab background:', activeTabColor);
    
  } catch(e) {
    console.log('❌ TEST ERROR:', e.message);
  }
  
  await browser.close();
})();

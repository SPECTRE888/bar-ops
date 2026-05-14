const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const ASSETS = path.join(__dirname, 'assets')
const SIZE = 1024

const designs = {
  'preview-PA.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Jost:wght@200;300&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:#080808;
        display:flex; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
      }
      .wrap {
        display:flex; flex-direction:column; align-items:center; gap:0;
      }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:300;
        font-size:360px;
        color:#c4a46b;
        letter-spacing:24px;
        line-height:1;
      }
      .line {
        width:520px; height:1px; background:#c4a46b; opacity:0.4; margin-top:20px;
      }
    </style>
    <div class="wrap">
      <div class="mono">BO</div>
      <div class="line"></div>
    </div>
  `,

  'preview-PB.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Jost:wght@200&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:#080808;
        display:flex; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
      }
      .wrap { position:relative; display:flex; align-items:center; justify-content:center; }
      .circle {
        position:absolute;
        width:640px; height:640px;
        border-radius:50%;
        border:5px solid #c4a46b;
        opacity:0.5;
      }
      .circle-inner {
        position:absolute;
        width:580px; height:580px;
        border-radius:50%;
        border:1px solid #c4a46b;
        opacity:0.2;
      }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:300;
        font-style:italic;
        font-size:300px;
        color:#c4a46b;
        letter-spacing:20px;
        line-height:1;
        position:relative;
        z-index:1;
      }
    </style>
    <div class="wrap">
      <div class="circle"></div>
      <div class="circle-inner"></div>
      <div class="mono">BO</div>
    </div>
  `,

  'preview-PC.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Jost:wght@200&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:#080808;
        display:flex; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
      }
      .wrap {
        display:flex; flex-direction:column; align-items:center;
        border:4px solid #c4a46b;
        padding:60px 100px 50px;
        position:relative;
      }
      .wrap::before {
        content:'';
        position:absolute;
        inset:8px;
        border:1px solid #c4a46b;
        opacity:0.25;
      }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:600;
        font-size:280px;
        color:#c4a46b;
        letter-spacing:16px;
        line-height:1;
      }
      .sub {
        font-family:'Jost', sans-serif;
        font-weight:200;
        font-size:30px;
        color:#c4a46b;
        letter-spacing:22px;
        opacity:0.6;
        margin-top:16px;
        text-transform:uppercase;
      }
    </style>
    <div class="wrap">
      <div class="mono">BO</div>
      <div class="sub">BAR OPS</div>
    </div>
  `,

  'preview-PD.png': `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&display=swap');
      * { margin:0; padding:0; box-sizing:border-box; }
      body {
        width:${SIZE}px; height:${SIZE}px;
        background:#080808;
        display:flex; align-items:center; justify-content:center;
        border-radius:180px; overflow:hidden;
        position:relative;
      }
      .bg-letter {
        position:absolute;
        font-family:'Cormorant Garamond', serif;
        font-weight:400;
        font-size:900px;
        color:#c4a46b;
        opacity:0.04;
        line-height:1;
        top:50%; left:50%;
        transform:translate(-50%, -46%);
      }
      .mono {
        font-family:'Cormorant Garamond', serif;
        font-weight:300;
        font-size:380px;
        background: linear-gradient(160deg, #d4b47a 0%, #c4a46b 50%, #a8863a 100%);
        -webkit-background-clip:text;
        -webkit-text-fill-color:transparent;
        letter-spacing:30px;
        line-height:1;
        position:relative;
        z-index:1;
      }
    </style>
    <div class="bg-letter">B</div>
    <div class="mono">BO</div>
  `,
}

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })

  for (const [filename, body] of Object.entries(designs)) {
    const page = await browser.newPage()
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 })
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${body}</body></html>`)
    // Wait for fonts
    await page.evaluateHandle('document.fonts.ready')
    await new Promise(r => setTimeout(r, 800))
    await page.screenshot({ path: path.join(ASSETS, filename), type: 'png' })
    await page.close()
    console.log('✓', filename)
  }

  await browser.close()
}

run().catch(console.error)

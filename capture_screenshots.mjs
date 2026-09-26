import { chromium } from "@playwright/test";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const port = 3048;
  console.log(`Starting next server on port ${port}...`);

  const server = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: __dirname,
    stdio: "pipe",
    shell: true,
  });

  server.stdout.on("data", (d) => console.log(`[Next STDOUT] ${d.toString().trim()}`));
  server.stderr.on("data", (d) => console.error(`[Next STDERR] ${d.toString().trim()}`));

  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await wait(500);
  }

  if (!ready) {
    console.error("Server failed to start in time");
    server.kill();
    process.exit(1);
  }

  console.log("Server is ready! Launching msedge...");
  const browser = await chromium.launch({ 
    channel: "msedge",
    headless: true 
  });

  const screenshotsDir = path.join(__dirname, "screenshots");
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Desktop 1440x900 - Home
  {
    console.log("Capturing Desktop Home screenshots...");
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    page.on("console", (m) => console.log("[Page Console]", m.text()));
    page.on("pageerror", (e) => console.error("[Page Error]", e));
    page.on("requestfailed", (r) => console.log("[Req Failed]", r.url(), r.failure()));
    page.on("response", (res) => {
      if (res.status() >= 400) {
        console.log(`[HTTP ${res.status()}]`, res.url());
      }
    });

    await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
    await page.waitForSelector("header");

    const bg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    console.log("Calculated body background color on Desktop:", bg);

    await wait(2000);

    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_hero.png"),
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });

    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_full.png"),
      fullPage: true,
    });
    await context.close();
  }

  // 2. Desktop 1440x900 - Status OS 1042
  {
    console.log("Capturing Desktop Status Tracker screenshots...");
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(`http://localhost:${port}/status?q=1042`, { waitUntil: "networkidle" });
    await page.waitForSelector("header");
    await wait(2500);

    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_status.png"),
      fullPage: true,
    });
    await context.close();
  }

  // 3. Mobile 390x844 - Home
  {
    console.log("Capturing Mobile Home screenshots...");
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
    await page.waitForSelector("header");
    await wait(2000);

    await page.screenshot({
      path: path.join(screenshotsDir, "mobile_hero.png"),
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });

    await page.screenshot({
      path: path.join(screenshotsDir, "mobile_full.png"),
      fullPage: true,
    });
    await context.close();
  }

  // 4. Mobile 390x844 - Status OS 1042
  {
    console.log("Capturing Mobile Status Tracker screenshots...");
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(`http://localhost:${port}/status?q=1042`, { waitUntil: "networkidle" });
    await page.waitForSelector("header");
    await wait(2500);

    await page.screenshot({
      path: path.join(screenshotsDir, "mobile_status.png"),
      fullPage: true,
    });
    await context.close();
  }

  await browser.close();
  server.kill();
  console.log("All screenshots captured successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

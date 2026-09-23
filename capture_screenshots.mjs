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
  const port = 3045;
  console.log(`Starting next server on port ${port}...`);

  const server = spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: __dirname,
    stdio: "pipe",
    shell: true,
  });

  server.stdout.on("data", (d) => {
    // console.log(`[Next] ${d.toString()}`);
  });
  server.stderr.on("data", (d) => {
    // console.error(`[Next ERR] ${d.toString()}`);
  });

  // Wait for server to come up
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {
      // wait
    }
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

  // Desktop 1440x900
  {
    console.log("Capturing Desktop screenshots...");
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
    await page.waitForSelector("header");
    // Ensure styles are applied (body has bg #09090b or #09090c)
    await page.waitForFunction(() => {
      const bg = window.getComputedStyle(document.body).backgroundColor;
      return bg !== "rgba(0, 0, 0, 0)" && bg !== "rgb(255, 255, 255)";
    }, { timeout: 10000 }).catch(() => {});
    await wait(2000);

    // Desktop Hero
    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_hero.png"),
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });

    // Desktop Full
    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_full.png"),
      fullPage: true,
    });
    await context.close();
  }

  // Mobile 390x844 (iPhone 14)
  {
    console.log("Capturing Mobile screenshots...");
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
    await page.waitForSelector("header");
    await page.waitForFunction(() => {
      const bg = window.getComputedStyle(document.body).backgroundColor;
      return bg !== "rgba(0, 0, 0, 0)" && bg !== "rgb(255, 255, 255)";
    }, { timeout: 10000 }).catch(() => {});
    await wait(2000);

    // Mobile Hero
    await page.screenshot({
      path: path.join(screenshotsDir, "mobile_hero.png"),
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });

    // Mobile Full
    await page.screenshot({
      path: path.join(screenshotsDir, "mobile_full.png"),
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

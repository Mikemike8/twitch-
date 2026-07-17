import { chromium } from "@playwright/test";

const baseUrl = process.env.MOBILE_SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
const routes = ["/", "/search", "/live"];
const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "small-phone", width: 360, height: 740 },
  { name: "tablet", width: 768, height: 1024 },
];

const ignoredConsoleFragments = [
  "Failed to load resource: the server responded with a status of 401",
  "clerk",
  "favicon",
];

const failures = [];

function shouldIgnoreConsole(text) {
  const normalized = text.toLowerCase();
  return ignoredConsoleFragments.some((fragment) => normalized.includes(fragment.toLowerCase()));
}

async function launchBrowser() {
  const executablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  try {
    return await chromium.launch({ executablePath, headless: true });
  } catch {
    try {
      return await chromium.launch({ channel: "chrome", headless: true });
    } catch {
      return chromium.launch({ headless: true });
    }
  }
}

const browser = await launchBrowser();

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.name === "tablet" ? 1 : 3,
    isMobile: viewport.name !== "tablet",
    hasTouch: viewport.name !== "tablet",
  });

  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error" && !shouldIgnoreConsole(message.text())) {
      failures.push(`${viewport.name} console error: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    failures.push(`${viewport.name} page error: ${error.message}`);
  });

  for (const route of routes) {
    const url = new URL(route, baseUrl).toString();
    const response = await page.goto(url, { waitUntil: "networkidle" });
    if (!response?.ok()) {
      failures.push(`${viewport.name} ${route} returned ${response?.status() ?? "no response"}`);
      continue;
    }

    await page.waitForTimeout(250);
    const metrics = await page.evaluate(() => {
      const documentWidth = document.documentElement.scrollWidth;
      const viewportWidth = window.innerWidth;
      const overflowingElements = Array.from(document.querySelectorAll("body *"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.right > viewportWidth + 2 && getComputedStyle(element).position !== "fixed";
        })
        .slice(0, 5)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.className ? `.${String(element.className).trim().split(/\s+/).slice(0, 3).join(".")}` : ""} right=${Math.round(rect.right)}`;
        });

      const touchTargets = Array.from(document.querySelectorAll("a[href], button, input, textarea, select"))
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const styles = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && styles.visibility !== "hidden" && styles.display !== "none";
        })
        .map((element) => element.getBoundingClientRect())
        .filter((rect) => rect.width < 32 || rect.height < 32)
        .length;

      return {
        documentWidth,
        viewportWidth,
        overflowingElements,
        touchTargets,
        visibleText: document.body.innerText.slice(0, 120),
      };
    });

    if (metrics.documentWidth > metrics.viewportWidth + 2) {
      failures.push(`${viewport.name} ${route} has horizontal overflow ${metrics.documentWidth}px > ${metrics.viewportWidth}px: ${metrics.overflowingElements.join("; ")}`);
    }

    if (!metrics.visibleText.trim()) {
      failures.push(`${viewport.name} ${route} rendered no visible text`);
    }

    if (metrics.touchTargets > 10) {
      failures.push(`${viewport.name} ${route} has ${metrics.touchTargets} very small visible touch targets`);
    }

    if (route === "/live") {
      const liveHeading = page.getByRole("heading", { name: /live television/i }).first();
      if (!(await liveHeading.isVisible().catch(() => false))) {
        failures.push(`${viewport.name} /live missing Live Television heading`);
      }
      const firstChannelButton = page.getByRole("button", { name: /watch/i }).first();
      if (await firstChannelButton.isVisible().catch(() => false)) {
        await firstChannelButton.tap().catch(async () => firstChannelButton.click());
      }
    }
  }

  await context.close();
}

await browser.close();

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Mobile smoke check passed for ${baseUrl}.`);

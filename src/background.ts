import browser from "webextension-polyfill";
import logger from "./logger";

let lockedWindowId: number | null = null;
let passwordProtectionEnabled = false;

browser.runtime.onInstalled.addListener(() => {
  logger.info("Gradia extension installed");
});

browser.runtime.onMessage.addListener(
  (message: unknown): void | Promise<void> => {
    if (!message || typeof message !== "object") return;

    const typedMessage = message as {
      type?: string;
      windowId?: number;
      passwordProtectionEnabled?: boolean;
      multiMonitor?: boolean;
    };

    if (typedMessage.type === "SCREENSAVER_STARTED") {
      lockedWindowId =
        typeof typedMessage.windowId === "number"
          ? typedMessage.windowId
          : null;
      passwordProtectionEnabled = Boolean(
        typedMessage.passwordProtectionEnabled
      );
      return;
    }

    if (typedMessage.type === "START_SCREENSAVER") {
      void startScreensaver(Boolean(typedMessage.multiMonitor));
      return;
    }

    if (typedMessage.type === "UNLOCK_SCREENSAVER") {
      lockedWindowId = null;
      passwordProtectionEnabled = false;
      return;
    }
  }
);

browser.windows.onRemoved.addListener(async (windowId) => {
  if (!passwordProtectionEnabled) return;
  if (lockedWindowId === null || windowId !== lockedWindowId) return;

  try {
    const screensaverUrl = browser.runtime.getURL("src/main.html");
    const createdWindow = await browser.windows.create({
      url: screensaverUrl,
      type: "popup",
      state: "fullscreen",
    });

    lockedWindowId = createdWindow.id ?? null;
  } catch {
    logger.error("Failed to recreate locked screensaver window");
  }
});

async function startScreensaver(multiMonitor: boolean) {
  try {
    const result = await browser.storage.local.get([
      "selectedGradient",
      "screensaverPasswordHash",
    ]);

    const passwordHash =
      typeof result.screensaverPasswordHash === "string"
        ? result.screensaverPasswordHash
        : null;

    await browser.storage.local.set({
      screensaverPasswordProtectionEnabled: Boolean(passwordHash),
    });

    const screensaverUrl = browser.runtime.getURL("src/main.html");

    if (
      multiMonitor &&
      typeof chrome !== "undefined" &&
      chrome.system?.display
    ) {
      const displays = await chrome.system.display.getInfo();
      const windows: number[] = [];

      for (const display of displays) {
        const bounds = display.bounds;
        const createdWindow = await browser.windows.create({
          url: screensaverUrl,
          type: "popup",
          left: bounds.left,
          top: bounds.top,
          width: bounds.width,
          height: bounds.height,
          state: "normal",
          focused: false,
        });

        if (createdWindow.id) {
          windows.push(createdWindow.id);
        }
      }

      if (windows.length > 0) {
        await browser.runtime.sendMessage({
          type: "SCREENSAVER_STARTED",
          windowId: windows[0],
          passwordProtectionEnabled: Boolean(passwordHash),
        });
      }
    } else {
      const createdWindow = await browser.windows.create({
        url: screensaverUrl,
        type: "popup",
        state: "fullscreen",
      });

      await browser.runtime.sendMessage({
        type: "SCREENSAVER_STARTED",
        windowId: createdWindow.id,
        passwordProtectionEnabled: Boolean(passwordHash),
      });
    }
  } catch (error) {
    logger.error(`Failed to start screensaver: ${String(error)}`);
  }
}

browser.commands.onCommand.addListener(async (command) => {
  if (command === "start_screensaver") {
    const result = await browser.storage.local.get(["multiMonitor"]);
    const multiMonitor = Boolean(result.multiMonitor);
    void startScreensaver(multiMonitor);
  }
});

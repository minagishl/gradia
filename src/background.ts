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

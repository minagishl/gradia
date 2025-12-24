import browser from "webextension-polyfill";
import logger from "./logger";

let lockedWindowId: number | null = null;
let passwordProtectionEnabled = false;
let multiMonitorWindowIds: number[] = [];

browser.runtime.onInstalled.addListener(() => {
  logger.info("Gradia extension installed");
});

browser.runtime.onMessage.addListener(
  async (message: unknown): Promise<void> => {
    if (!message || typeof message !== "object") return;

    const typedMessage = message as {
      type?: string;
      windowId?: number;
      passwordProtectionEnabled?: boolean;
      multiMonitor?: boolean;
      multiMonitorWindowIds?: number[];
    };

    if (typedMessage.type === "SCREENSAVER_STARTED") {
      lockedWindowId =
        typeof typedMessage.windowId === "number"
          ? typedMessage.windowId
          : null;
      passwordProtectionEnabled = Boolean(
        typedMessage.passwordProtectionEnabled
      );
      if (Array.isArray(typedMessage.multiMonitorWindowIds)) {
        multiMonitorWindowIds = typedMessage.multiMonitorWindowIds;
      }
      return;
    }

    if (typedMessage.type === "START_SCREENSAVER") {
      void startScreensaver(Boolean(typedMessage.multiMonitor));
      return;
    }

    if (typedMessage.type === "UNLOCK_SCREENSAVER") {
      // Close all multi-monitor windows if any exist
      if (multiMonitorWindowIds.length > 0) {
        for (const windowId of multiMonitorWindowIds) {
          try {
            await browser.windows.remove(windowId);
          } catch {
            // Window may already be closed, ignore
          }
        }
        multiMonitorWindowIds = [];
      }
      lockedWindowId = null;
      passwordProtectionEnabled = false;
      return;
    }
  }
);

browser.windows.onRemoved.addListener(async (windowId) => {
  // Check if this is one of the multi-monitor windows
  if (multiMonitorWindowIds.includes(windowId)) {
    // Close all other multi-monitor windows
    for (const id of multiMonitorWindowIds) {
      if (id !== windowId) {
        try {
          await browser.windows.remove(id);
        } catch {
          // Window may already be closed, ignore
        }
      }
    }
    multiMonitorWindowIds = [];
    lockedWindowId = null;
    passwordProtectionEnabled = false;
    return;
  }

  // Handle single monitor case
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
          url: `${screensaverUrl}?multiMonitor=true`,
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
        multiMonitorWindowIds = windows;
        try {
          await browser.runtime.sendMessage({
            type: "SCREENSAVER_STARTED",
            windowId: windows[0],
            passwordProtectionEnabled: Boolean(passwordHash),
            multiMonitorWindowIds: windows,
          });
        } catch {
          // Ignore message errors
        }
      }
    } else {
      const createdWindow = await browser.windows.create({
        url: screensaverUrl,
        type: "popup",
        state: "fullscreen",
      });

      try {
        await browser.runtime.sendMessage({
          type: "SCREENSAVER_STARTED",
          windowId: createdWindow.id,
          passwordProtectionEnabled: Boolean(passwordHash),
        });
      } catch {
        // Ignore message errors
      }
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

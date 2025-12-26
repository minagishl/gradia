import browser from "webextension-polyfill";
import logger from "./logger";
import { BUILT_IN_PRESET_METADATA } from "./lib/preset";

let lockedWindowId: number | null = null;
let passwordProtectionEnabled = false;
let multiMonitorWindowIds: number[] = [];

browser.runtime.onInstalled.addListener(() => {
  logger.info("Gradia extension installed");

  // Create context menu items
  void createContextMenus();
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

// Create context menus
async function createContextMenus() {
  try {
    // Remove all existing menus first
    await browser.contextMenus.removeAll();

    // Main menu: Start screensaver
    browser.contextMenus.create({
      id: "start-screensaver",
      title: "Start Screensaver",
      contexts: ["page", "action"],
    });

    // Separator
    browser.contextMenus.create({
      id: "separator-1",
      type: "separator",
      contexts: ["page", "action"],
    });

    // Settings
    browser.contextMenus.create({
      id: "open-settings",
      title: "Settings",
      contexts: ["page", "action"],
    });

    // About
    browser.contextMenus.create({
      id: "open-about",
      title: "About",
      contexts: ["page", "action"],
    });

    // Separator
    browser.contextMenus.create({
      id: "separator-2",
      type: "separator",
      contexts: ["page", "action"],
    });

    // Quick start with specific presets (parent menu)
    browser.contextMenus.create({
      id: "quick-start",
      title: "Quick Start with Preset",
      contexts: ["page", "action"],
    });

    // Add built-in presets
    for (const preset of BUILT_IN_PRESET_METADATA) {
      browser.contextMenus.create({
        id: `preset-${preset.id}`,
        parentId: "quick-start",
        title: preset.name,
        contexts: ["page", "action"],
      });
    }

    // Add random options
    browser.contextMenus.create({
      id: "separator-preset",
      parentId: "quick-start",
      type: "separator",
      contexts: ["page", "action"],
    });

    browser.contextMenus.create({
      id: "preset-random-preset",
      parentId: "quick-start",
      title: "Random (Preset)",
      contexts: ["page", "action"],
    });

    browser.contextMenus.create({
      id: "preset-random-full",
      parentId: "quick-start",
      title: "Random (Full)",
      contexts: ["page", "action"],
    });

    logger.info("Context menus created successfully");
  } catch (error) {
    logger.error(`Failed to create context menus: ${String(error)}`);
  }
}

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info) => {
  try {
    if (info.menuItemId === "start-screensaver") {
      const result = await browser.storage.local.get(["multiMonitor"]);
      const multiMonitor = Boolean(result.multiMonitor);
      void startScreensaver(multiMonitor);
    } else if (info.menuItemId === "open-settings") {
      await browser.runtime.openOptionsPage();
    } else if (info.menuItemId === "open-about") {
      await browser.tabs.create({
        url: browser.runtime.getURL("src/about.html"),
      });
    } else if (
      typeof info.menuItemId === "string" &&
      info.menuItemId.startsWith("preset-")
    ) {
      // Extract preset ID
      const presetId = info.menuItemId.replace("preset-", "");

      // Save the selected preset
      await browser.storage.local.set({ selectedGradient: presetId });

      // Start screensaver with the selected preset
      const result = await browser.storage.local.get(["multiMonitor"]);
      const multiMonitor = Boolean(result.multiMonitor);
      void startScreensaver(multiMonitor);
    }
  } catch (error) {
    logger.error(`Failed to handle context menu click: ${String(error)}`);
  }
});

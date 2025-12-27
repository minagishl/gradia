import browser from "webextension-polyfill";
import logger from "./logger";
import { BUILT_IN_PRESET_METADATA } from "./lib/preset";
import { getCustomPresets } from "./lib/custom-presets";

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

      // Update context menus to hide "Change Running Preset"
      void createContextMenus();

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

    // Update context menus to hide "Change Running Preset"
    void createContextMenus();

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

        // Update context menus to show "Change Running Preset"
        void createContextMenus();
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

      // Update context menus to show "Change Running Preset"
      void createContextMenus();
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

// Helper functions for context menus

/**
 * Get all gradient presets (built-in + custom)
 */
async function loadAllPresets() {
  try {
    const customPresets = await getCustomPresets();
    return [...BUILT_IN_PRESET_METADATA, ...customPresets];
  } catch (error) {
    logger.error(`Failed to load presets: ${String(error)}`);
    // Fallback to built-in presets only
    return BUILT_IN_PRESET_METADATA;
  }
}

/**
 * Check if screensaver is currently running
 */
function isScreensaverRunning(): boolean {
  return lockedWindowId !== null || multiMonitorWindowIds.length > 0;
}

/**
 * Get the current default preset ID
 */
async function getCurrentDefaultPreset(): Promise<string> {
  const result = await browser.storage.local.get(["selectedGradient"]);
  return (result.selectedGradient as string | undefined) || "halo";
}

// Create context menus
async function createContextMenus() {
  try {
    // Remove all existing menus first
    await browser.contextMenus.removeAll();

    // Load all presets (built-in + custom) and current default
    const allPresets = await loadAllPresets();
    const currentDefault = await getCurrentDefaultPreset();
    const builtInPresets = allPresets.filter(
      (p) => !p.id.startsWith("custom-")
    );
    const customPresets = allPresets.filter((p) => p.id.startsWith("custom-"));

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
    for (const preset of builtInPresets) {
      browser.contextMenus.create({
        id: `preset-${preset.id}`,
        parentId: "quick-start",
        title: preset.name,
        contexts: ["page", "action"],
      });
    }

    // Add custom presets if any
    if (customPresets.length > 0) {
      browser.contextMenus.create({
        id: "separator-preset-custom",
        parentId: "quick-start",
        type: "separator",
        contexts: ["page", "action"],
      });

      for (const preset of customPresets) {
        browser.contextMenus.create({
          id: `preset-${preset.id}`,
          parentId: "quick-start",
          title: preset.name,
          contexts: ["page", "action"],
        });
      }
    }

    // Add random options
    browser.contextMenus.create({
      id: "separator-preset-random",
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

    // Separator
    browser.contextMenus.create({
      id: "separator-3",
      type: "separator",
      contexts: ["page", "action"],
    });

    // Set as Default menu
    browser.contextMenus.create({
      id: "set-default",
      title: "Set as Default",
      contexts: ["page", "action"],
    });

    // Add built-in presets
    for (const preset of builtInPresets) {
      const isDefault = currentDefault === preset.id;
      browser.contextMenus.create({
        id: `default-${preset.id}`,
        parentId: "set-default",
        title: isDefault ? `✓ ${preset.name}` : preset.name,
        contexts: ["page", "action"],
      });
    }

    // Add custom presets if any
    if (customPresets.length > 0) {
      browser.contextMenus.create({
        id: "separator-default-custom",
        parentId: "set-default",
        type: "separator",
        contexts: ["page", "action"],
      });

      for (const preset of customPresets) {
        const isDefault = currentDefault === preset.id;
        browser.contextMenus.create({
          id: `default-${preset.id}`,
          parentId: "set-default",
          title: isDefault ? `✓ ${preset.name}` : preset.name,
          contexts: ["page", "action"],
        });
      }
    }

    // Add random options
    browser.contextMenus.create({
      id: "separator-default-random",
      parentId: "set-default",
      type: "separator",
      contexts: ["page", "action"],
    });

    browser.contextMenus.create({
      id: "default-random-preset",
      parentId: "set-default",
      title:
        currentDefault === "random-preset"
          ? "✓ Random (Preset)"
          : "Random (Preset)",
      contexts: ["page", "action"],
    });

    browser.contextMenus.create({
      id: "default-random-full",
      parentId: "set-default",
      title:
        currentDefault === "random-full" ? "✓ Random (Full)" : "Random (Full)",
      contexts: ["page", "action"],
    });

    // Change Running Preset menu (only if screensaver is running)
    if (isScreensaverRunning()) {
      browser.contextMenus.create({
        id: "separator-4",
        type: "separator",
        contexts: ["page", "action"],
      });

      browser.contextMenus.create({
        id: "change-running",
        title: "Change Running Preset",
        contexts: ["page", "action"],
      });

      // Add built-in presets
      for (const preset of builtInPresets) {
        browser.contextMenus.create({
          id: `change-${preset.id}`,
          parentId: "change-running",
          title: preset.name,
          contexts: ["page", "action"],
        });
      }

      // Add custom presets if any
      if (customPresets.length > 0) {
        browser.contextMenus.create({
          id: "separator-change-custom",
          parentId: "change-running",
          type: "separator",
          contexts: ["page", "action"],
        });

        for (const preset of customPresets) {
          browser.contextMenus.create({
            id: `change-${preset.id}`,
            parentId: "change-running",
            title: preset.name,
            contexts: ["page", "action"],
          });
        }
      }

      // Add random options
      browser.contextMenus.create({
        id: "separator-change-random",
        parentId: "change-running",
        type: "separator",
        contexts: ["page", "action"],
      });

      browser.contextMenus.create({
        id: "change-random-preset",
        parentId: "change-running",
        title: "Random (Preset)",
        contexts: ["page", "action"],
      });

      browser.contextMenus.create({
        id: "change-random-full",
        parentId: "change-running",
        title: "Random (Full)",
        contexts: ["page", "action"],
      });
    }

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
      // Quick Start: Extract preset ID, save it, and start screensaver
      const presetId = info.menuItemId.replace("preset-", "");
      await browser.storage.local.set({ selectedGradient: presetId });

      const result = await browser.storage.local.get(["multiMonitor"]);
      const multiMonitor = Boolean(result.multiMonitor);
      void startScreensaver(multiMonitor);
    } else if (
      typeof info.menuItemId === "string" &&
      info.menuItemId.startsWith("default-")
    ) {
      // Set as Default: Extract preset ID and save it (don't start screensaver)
      const presetId = info.menuItemId.replace("default-", "");
      await browser.storage.local.set({ selectedGradient: presetId });

      // Recreate menus to update the checkmark
      void createContextMenus();

      logger.info(`Default preset set to: ${presetId}`);
    } else if (
      typeof info.menuItemId === "string" &&
      info.menuItemId.startsWith("change-")
    ) {
      // Change Running Preset: Extract preset ID and save it
      // The main.tsx listener will automatically apply the change
      const presetId = info.menuItemId.replace("change-", "");
      await browser.storage.local.set({ selectedGradient: presetId });

      logger.info(`Running preset changed to: ${presetId}`);
    }
  } catch (error) {
    logger.error(`Failed to handle context menu click: ${String(error)}`);
  }
});

// Listen for storage changes to update context menus when custom presets change
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes.customGradientPresets) {
    // Custom presets were added, modified, or deleted
    // Recreate context menus to reflect the changes
    void createContextMenus();
    logger.info("Context menus updated due to custom preset changes");
  }
});

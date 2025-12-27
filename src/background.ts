import browser from "webextension-polyfill";
import logger from "./logger";
import { BUILT_IN_PRESET_METADATA } from "./lib/preset";
import { getCustomPresets } from "./lib/custom-presets";

let lockedWindowId: number | null = null;
let passwordProtectionEnabled = false;
let multiMonitorWindowIds: number[] = [];

type PresetMenuItem = {
  id: string;
  name: string;
};

type ContextMenuCreateProperties = Parameters<
  typeof browser.contextMenus.create
>[0];

const MENU_CONTEXTS: NonNullable<ContextMenuCreateProperties["contexts"]> = [
  "page",
  "action",
];
const RANDOM_MENU_ITEMS = [
  { id: "random-preset", title: "Random (Preset)" },
  { id: "random-full", title: "Random (Full)" },
];

function createMenu(item: ContextMenuCreateProperties) {
  browser.contextMenus.create({
    ...item,
    contexts: item.contexts ?? MENU_CONTEXTS,
  });
}

function createSeparator(id: string, parentId?: string) {
  createMenu({ id, type: "separator", parentId });
}

function formatCheckedTitle(title: string, checked: boolean) {
  return checked ? `✓ ${title}` : title;
}

function createPresetItems(
  parentId: string,
  presets: PresetMenuItem[],
  idPrefix: string,
  titleForPreset: (preset: PresetMenuItem) => string
) {
  for (const preset of presets) {
    createMenu({
      id: `${idPrefix}${preset.id}`,
      parentId,
      title: titleForPreset(preset),
    });
  }
}

function createRandomItems(
  parentId: string,
  idPrefix: string,
  titleForItem: (item: (typeof RANDOM_MENU_ITEMS)[number]) => string
) {
  for (const item of RANDOM_MENU_ITEMS) {
    createMenu({
      id: `${idPrefix}${item.id}`,
      parentId,
      title: titleForItem(item),
    });
  }
}

function createPresetMenuGroup({
  parentId,
  builtInPresets,
  customPresets,
  idPrefix,
  titleForPreset,
  titleForRandom,
}: {
  parentId: string;
  builtInPresets: PresetMenuItem[];
  customPresets: PresetMenuItem[];
  idPrefix: string;
  titleForPreset: (preset: PresetMenuItem) => string;
  titleForRandom: (item: (typeof RANDOM_MENU_ITEMS)[number]) => string;
}) {
  createPresetItems(parentId, builtInPresets, idPrefix, titleForPreset);

  if (customPresets.length > 0) {
    createSeparator(`separator-${parentId}-custom`, parentId);
    createPresetItems(parentId, customPresets, idPrefix, titleForPreset);
  }

  createSeparator(`separator-${parentId}-random`, parentId);
  createRandomItems(parentId, idPrefix, titleForRandom);
}

function splitPresets(presets: PresetMenuItem[]) {
  const builtInPresets: PresetMenuItem[] = [];
  const customPresets: PresetMenuItem[] = [];

  for (const preset of presets) {
    if (preset.id.startsWith("custom-")) {
      customPresets.push(preset);
    } else {
      builtInPresets.push(preset);
    }
  }

  return { builtInPresets, customPresets };
}

function resetScreensaverState() {
  lockedWindowId = null;
  passwordProtectionEnabled = false;
  multiMonitorWindowIds = [];
}

async function closeWindows(windowIds: number[]) {
  if (windowIds.length === 0) return;
  await Promise.allSettled(
    windowIds.map((windowId) => browser.windows.remove(windowId))
  );
}

async function stopScreensaver(options: { skipWindowId?: number } = {}) {
  const windowIdsToClose = multiMonitorWindowIds.filter(
    (windowId) => windowId !== options.skipWindowId
  );

  // Clear state before closing windows to avoid re-entrancy in onRemoved.
  resetScreensaverState();
  await closeWindows(windowIdsToClose);

  // Update context menus to hide "Change Running Preset"
  void createContextMenus();
}

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
      await stopScreensaver();
      return;
    }
  }
);

browser.windows.onRemoved.addListener(async (windowId) => {
  // Check if this is one of the multi-monitor windows
  if (multiMonitorWindowIds.includes(windowId)) {
    await stopScreensaver({ skipWindowId: windowId });
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
    const result = await browser.storage.local.get(["screensaverPasswordHash"]);

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
      const createdWindows = await Promise.allSettled(
        displays.map((display) => {
          const bounds = display.bounds;
          return browser.windows.create({
            url: `${screensaverUrl}?multiMonitor=true`,
            type: "popup",
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            state: "normal",
            focused: false,
          });
        })
      );
      const windowIds = createdWindows.flatMap((result) =>
        result.status === "fulfilled" && typeof result.value.id === "number"
          ? [result.value.id]
          : []
      );

      if (windowIds.length > 0) {
        multiMonitorWindowIds = windowIds;
        try {
          await browser.runtime.sendMessage({
            type: "SCREENSAVER_STARTED",
            windowId: windowIds[0],
            passwordProtectionEnabled: Boolean(passwordHash),
            multiMonitorWindowIds: windowIds,
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
async function loadAllPresets(): Promise<PresetMenuItem[]> {
  try {
    const customPresets = await getCustomPresets();
    const customPresetMetadata = customPresets.map((preset) => ({
      id: preset.id,
      name: preset.name,
    }));
    return [...BUILT_IN_PRESET_METADATA, ...customPresetMetadata];
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
    const { builtInPresets, customPresets } = splitPresets(allPresets);

    const rootMenus: ContextMenuCreateProperties[] = [
      { id: "start-screensaver", title: "Start Screensaver" },
      { id: "separator-1", type: "separator" },
      { id: "open-settings", title: "Settings" },
      { id: "open-about", title: "About" },
      { id: "separator-2", type: "separator" },
      { id: "quick-start", title: "Quick Start with Preset" },
      { id: "separator-3", type: "separator" },
      { id: "set-default", title: "Set as Default" },
    ];

    for (const menu of rootMenus) {
      createMenu(menu);
    }

    createPresetMenuGroup({
      parentId: "quick-start",
      builtInPresets,
      customPresets,
      idPrefix: "preset-",
      titleForPreset: (preset) => preset.name,
      titleForRandom: (item) => item.title,
    });

    createPresetMenuGroup({
      parentId: "set-default",
      builtInPresets,
      customPresets,
      idPrefix: "default-",
      titleForPreset: (preset) =>
        formatCheckedTitle(preset.name, currentDefault === preset.id),
      titleForRandom: (item) =>
        formatCheckedTitle(item.title, currentDefault === item.id),
    });

    // Change Running Preset menu (only if screensaver is running)
    if (isScreensaverRunning()) {
      createSeparator("separator-4");
      createMenu({ id: "change-running", title: "Change Running Preset" });
      createPresetMenuGroup({
        parentId: "change-running",
        builtInPresets,
        customPresets,
        idPrefix: "change-",
        titleForPreset: (preset) => preset.name,
        titleForRandom: (item) => item.title,
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
    const menuItemId = info.menuItemId;
    if (menuItemId === "start-screensaver") {
      const result = await browser.storage.local.get(["multiMonitor"]);
      const multiMonitor = Boolean(result.multiMonitor);
      void startScreensaver(multiMonitor);
    } else if (menuItemId === "open-settings") {
      await browser.runtime.openOptionsPage();
    } else if (menuItemId === "open-about") {
      await browser.tabs.create({
        url: browser.runtime.getURL("src/about.html"),
      });
    } else if (typeof menuItemId !== "string") {
      return;
    } else if (menuItemId.startsWith("preset-")) {
      // Quick Start: Extract preset ID, save it, and start screensaver
      const presetId = menuItemId.replace("preset-", "");
      await browser.storage.local.set({ selectedGradient: presetId });

      const result = await browser.storage.local.get(["multiMonitor"]);
      const multiMonitor = Boolean(result.multiMonitor);
      void startScreensaver(multiMonitor);
    } else if (menuItemId.startsWith("default-")) {
      // Set as Default: Extract preset ID and save it (don't start screensaver)
      const presetId = menuItemId.replace("default-", "");
      await browser.storage.local.set({ selectedGradient: presetId });

      // Recreate menus to update the checkmark
      void createContextMenus();

      logger.info(`Default preset set to: ${presetId}`);
    } else if (menuItemId.startsWith("change-")) {
      // Change Running Preset: Extract preset ID and save it
      // The main.tsx listener will automatically apply the change
      const presetId = menuItemId.replace("change-", "");
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

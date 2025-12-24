import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import { ScreensaverCanvas } from "./components/canvas";
import { GRADIENT_PRESETS, type GradientPreset } from "./types/gradients";

function Screensaver() {
  const [preset, setPreset] = useState<GradientPreset>(GRADIENT_PRESETS[0]);

  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const [message] = args;
      if (
        typeof message === "string" &&
        message.includes(".dampingFactor has been deprecated")
      ) {
        return;
      }
      originalWarn(...args);
    };

    // Load saved settings
    (async () => {
      const result = await browser.storage.local.get("selectedGradient");
      if (result.selectedGradient) {
        const savedPreset = GRADIENT_PRESETS.find(
          (p) => p.id === result.selectedGradient
        );
        if (savedPreset) {
          setPreset(savedPreset);
        }
      }
    })();

    // Listen for settings changes
    const listener = (changes: {
      [key: string]: browser.Storage.StorageChange;
    }) => {
      if (changes.selectedGradient) {
        const newPreset = GRADIENT_PRESETS.find(
          (p) => p.id === changes.selectedGradient.newValue
        );
        if (newPreset) {
          setPreset(newPreset);
        }
      }
    };

    browser.storage.onChanged.addListener(listener);

    // Close screensaver with Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      console.warn = originalWarn;
      browser.storage.onChanged.removeListener(listener);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return <ScreensaverCanvas preset={preset} />;
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<Screensaver />);
}

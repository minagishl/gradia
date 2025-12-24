import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import { Button } from "./components/Button";
import { GRADIENT_PRESETS } from "./types/gradients";

function Popup() {
  const [selectedGradient, setSelectedGradient] = useState(
    GRADIENT_PRESETS[0].id
  );

  useEffect(() => {
    (async () => {
      const result = await browser.storage.local.get("selectedGradient");
      if (result.selectedGradient) {
        setSelectedGradient(result.selectedGradient as string);
      }
    })();
  }, []);

  const handleGradientChange = async (gradientId: string) => {
    setSelectedGradient(gradientId);
    await browser.storage.local.set({ selectedGradient: gradientId });
  };

  const openScreensaver = () => {
    const screensaverUrl = browser.runtime.getURL("src/main.html");
    browser.windows.create({
      url: screensaverUrl,
      type: "popup",
      state: "fullscreen",
    });
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <label htmlFor="gradientPreset" className="mb-2 block text-sm">
          Gradient Preset
        </label>
        <select
          id="gradientPreset"
          value={selectedGradient}
          onChange={(e) => handleGradientChange(e.target.value)}
          className="box-border h-8 w-full rounded border border-gray-300 px-2 text-sm"
        >
          {GRADIENT_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button onClick={openScreensaver} variant="primary">
          Start Screensaver
        </Button>
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<Popup />);
}

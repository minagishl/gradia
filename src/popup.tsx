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
    <div style={{ padding: "16px" }}>
      <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>
        Screensaver Settings
      </h2>

      <div style={{ marginBottom: "16px" }}>
        <label
          htmlFor="gradientPreset"
          style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}
        >
          Gradient Preset
        </label>
        <select
          id="gradientPreset"
          value={selectedGradient}
          onChange={(e) => handleGradientChange(e.target.value)}
          style={{
            width: "100%",
            height: "32px",
            padding: "0 8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
            fontSize: "14px",
          }}
        >
          {GRADIENT_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
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

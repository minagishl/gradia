import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
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
    <Card className="min-h-48 rounded-none">
      <CardHeader>
        <CardTitle>Gradia</CardTitle>
        <CardDescription>
          Select a gradient preset and start the screensaver.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            openScreensaver();
          }}
          className="space-y-6"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="gradientPreset">Gradient Preset</FieldLabel>
              <Select
                value={selectedGradient}
                onValueChange={handleGradientChange}
              >
                <SelectTrigger id="gradientPreset" className="w-full">
                  <SelectValue placeholder="Select a gradient" />
                </SelectTrigger>
                <SelectContent>
                  {GRADIENT_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Choose which gradient preset to use in the screensaver.
              </FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <Button type="submit" className="w-full cursor-pointer">
                Start
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<Popup />);
}

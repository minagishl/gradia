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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { hashPassword } from "@/lib/password";
import { GRADIENT_PRESETS, type GradientPreset } from "./lib/preset";
import { getAllPresets, isCustomPreset } from "./lib/gradients";
import { Settings } from "lucide-react";

function Popup() {
  const [selectedGradient, setSelectedGradient] = useState(
    GRADIENT_PRESETS[0].id
  );
  const [password, setPassword] = useState("");
  const [hasConfiguredPassword, setHasConfiguredPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [multiMonitor, setMultiMonitor] = useState(false);
  const [customPresets, setCustomPresets] = useState<GradientPreset[]>([]);

  useEffect(() => {
    (async () => {
      // Load custom presets
      const allPresets = await getAllPresets();
      const customOnly = allPresets.filter((p) => isCustomPreset(p.id));
      setCustomPresets(customOnly);

      const result = await browser.storage.local.get([
        "selectedGradient",
        "screensaverPasswordHash",
        "multiMonitor",
      ]);

      if (result.selectedGradient) {
        setSelectedGradient(result.selectedGradient as string);
      }

      if (typeof result.screensaverPasswordHash === "string") {
        setHasConfiguredPassword(true);
      }

      if (typeof result.multiMonitor === "boolean") {
        setMultiMonitor(result.multiMonitor);
      }
    })();

    // Listen for custom preset changes
    const listener = (
      changes: { [key: string]: browser.Storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "sync" && changes.customGradientPresets) {
        (async () => {
          const allPresets = await getAllPresets();
          const customOnly = allPresets.filter((p) => isCustomPreset(p.id));
          setCustomPresets(customOnly);
        })();
      }
    };

    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  const handleGradientChange = async (gradientId: string) => {
    setSelectedGradient(gradientId);
    await browser.storage.local.set({ selectedGradient: gradientId });
  };

  const handleStartScreensaver = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      const trimmedPassword = password.trim();
      let passwordHash: string | null = null;

      if (trimmedPassword.length > 0) {
        passwordHash = await hashPassword(trimmedPassword);
      }

      await browser.storage.local.set({
        selectedGradient,
        screensaverPasswordHash: passwordHash,
        screensaverPasswordProtectionEnabled: Boolean(passwordHash),
        multiMonitor,
      });

      await browser.runtime.sendMessage({
        type: "START_SCREENSAVER",
        passwordProtectionEnabled: Boolean(passwordHash),
        multiMonitor,
      });

      if (passwordHash) {
        setHasConfiguredPassword(true);
        setPassword("");
      } else {
        setHasConfiguredPassword(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="min-h-48 rounded-none">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Gradia</CardTitle>
            <CardDescription>
              Select a gradient preset and start the screensaver.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => browser.runtime.openOptionsPage()}
            className="shrink-0"
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await handleStartScreensaver();
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
                  <SelectGroup>
                    <SelectLabel>Built-in Presets</SelectLabel>
                    {GRADIENT_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  {customPresets.length > 0 && (
                    <>
                      <SelectSeparator />
                      <SelectGroup>
                        <SelectLabel>Custom Presets</SelectLabel>
                        {customPresets.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  )}

                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Random Presets</SelectLabel>
                    <SelectItem value="random-preset">
                      Random (Preset)
                    </SelectItem>
                    <SelectItem value="random-full">Random (Full)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Choose which gradient preset to use in the screensaver.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="screensaverPassword">
                Exit Password (optional)
              </FieldLabel>
              <Input
                id="screensaverPassword"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave empty to disable password protection"
              />
              <FieldDescription>
                When a password is set, leaving fullscreen requires this
                password. Starting with an empty password clears any existing
                password.
              </FieldDescription>
              {hasConfiguredPassword && password.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  A password is currently configured. Submitting with an empty
                  password will remove it for the next session.
                </p>
              )}
            </Field>
            <Field orientation="horizontal">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="multiMonitor"
                  checked={multiMonitor}
                  onCheckedChange={(checked) =>
                    setMultiMonitor(checked === true)
                  }
                />
                <Label htmlFor="multiMonitor" className="text-sm font-normal">
                  Start on all monitors
                </Label>
              </div>
            </Field>
            <Field orientation="horizontal">
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Starting..." : "Start"}
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

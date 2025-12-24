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
import { Input } from "@/components/ui/input";
import { hashPassword } from "@/lib/password";
import { GRADIENT_PRESETS } from "./types/gradients";

function Popup() {
  const [selectedGradient, setSelectedGradient] = useState(
    GRADIENT_PRESETS[0].id
  );
  const [password, setPassword] = useState("");
  const [hasConfiguredPassword, setHasConfiguredPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await browser.storage.local.get([
        "selectedGradient",
        "screensaverPasswordHash",
      ]);

      if (result.selectedGradient) {
        setSelectedGradient(result.selectedGradient as string);
      }

      if (typeof result.screensaverPasswordHash === "string") {
        setHasConfiguredPassword(true);
      }
    })();
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
      });

      const screensaverUrl = browser.runtime.getURL("src/main.html");
      const createdWindow = await browser.windows.create({
        url: screensaverUrl,
        type: "popup",
        state: "fullscreen",
      });

      await browser.runtime.sendMessage({
        type: "SCREENSAVER_STARTED",
        windowId: createdWindow.id,
        passwordProtectionEnabled: Boolean(passwordHash),
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
        <CardTitle>Gradia</CardTitle>
        <CardDescription>
          Select a gradient preset and start the screensaver.
        </CardDescription>
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
                  {GRADIENT_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                                    <SelectItem value="random">Random</SelectItem>
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
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isSaving}
              >
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

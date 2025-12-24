import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScreensaverCanvas } from "./components/canvas";
import {
  GRADIENT_PRESETS,
  type GradientPreset,
  generateRandomPreset,
} from "./lib/gradients";
import { hashPassword } from "./lib/password";

function Screensaver() {
  const [preset, setPreset] = useState<GradientPreset>(GRADIENT_PRESETS[0]);
  const [isPasswordProtectionEnabled, setIsPasswordProtectionEnabled] =
    useState(false);
  const [storedPasswordHash, setStoredPasswordHash] = useState<string | null>(
    null
  );
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

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

    (async () => {
      const result = await browser.storage.local.get([
        "selectedGradient",
        "screensaverPasswordHash",
        "screensaverPasswordProtectionEnabled",
      ]);

      if (result.selectedGradient) {
        if (result.selectedGradient === "random") {
          setPreset(generateRandomPreset());
        } else {
          const savedPreset = GRADIENT_PRESETS.find(
            (p) => p.id === result.selectedGradient
          );
          if (savedPreset) {
            setPreset(savedPreset);
          }
        }
      }

      const hashValue =
        typeof result.screensaverPasswordHash === "string"
          ? result.screensaverPasswordHash
          : null;
      const enabled =
        Boolean(result.screensaverPasswordProtectionEnabled) &&
        Boolean(hashValue);

      setStoredPasswordHash(hashValue);
      setIsPasswordProtectionEnabled(enabled);
    })();

    // Listen for settings changes
    const listener = (changes: {
      [key: string]: browser.Storage.StorageChange;
    }) => {
      if (changes.selectedGradient) {
        if (changes.selectedGradient.newValue === "random") {
          setPreset(generateRandomPreset());
        } else {
          const newPreset = GRADIENT_PRESETS.find(
            (p) => p.id === changes.selectedGradient.newValue
          );
          if (newPreset) {
            setPreset(newPreset);
          }
        }
      }
    };

    browser.storage.onChanged.addListener(listener);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      e.preventDefault();
      e.stopPropagation();

      if (!isPasswordProtectionEnabled) {
        window.close();
        return;
      }

      setPasswordError(null);
      setPasswordInput("");
      setIsPromptOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      console.warn = originalWarn;
      browser.storage.onChanged.removeListener(listener);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPasswordProtectionEnabled]);

  const handleUnlock = async () => {
    if (!storedPasswordHash) {
      window.close();
      return;
    }

    const value = passwordInput.trim();
    if (!value) {
      setPasswordError("Password is required.");
      return;
    }

    const hash = await hashPassword(value);
    if (hash !== storedPasswordHash) {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    await browser.runtime.sendMessage({ type: "UNLOCK_SCREENSAVER" });
    window.close();
  };

  return (
    <div className="fixed inset-0 bg-black">
      <ScreensaverCanvas preset={preset} />

      <Dialog
        open={isPromptOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsPromptOpen(false);
            setPasswordInput("");
            setPasswordError(null);
          }
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Unlock screensaver</DialogTitle>
            <DialogDescription>
              Enter the password to exit fullscreen.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="unlockPassword">Password</FieldLabel>
              <Input
                id="unlockPassword"
                type="password"
                autoComplete="current-password"
                value={passwordInput}
                onChange={(event) => {
                  setPasswordInput(event.target.value);
                  if (passwordError) {
                    setPasswordError(null);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleUnlock();
                  }
                }}
              />
              <FieldDescription>
                This password was configured when starting the screensaver.
              </FieldDescription>
              {passwordError && (
                <p className="text-destructive mt-1 text-sm">{passwordError}</p>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsPromptOpen(false);
                setPasswordInput("");
                setPasswordError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleUnlock();
              }}
            >
              Unlock and exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<Screensaver />);
}

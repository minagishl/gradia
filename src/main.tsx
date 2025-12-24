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
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  const [isDebugOpen, setIsDebugOpen] = useState(false);

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

    // KONAMI code sequence: ↑↑↓↓←→←→BA
    const konamiSequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "KeyB",
      "KeyA",
    ];
    let konamiIndex = 0;
    let konamiTimeout: number | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for KONAMI code
      if (konamiSequence[konamiIndex] === e.code) {
        konamiIndex++;
        if (konamiTimeout) {
          clearTimeout(konamiTimeout);
        }
        konamiTimeout = window.setTimeout(() => {
          konamiIndex = 0;
        }, 2000);

        if (konamiIndex === konamiSequence.length) {
          konamiIndex = 0;
          if (konamiTimeout) {
            clearTimeout(konamiTimeout);
          }
          setIsDebugOpen(true);
          return;
        }
      } else {
        konamiIndex = 0;
        if (konamiTimeout) {
          clearTimeout(konamiTimeout);
        }
      }

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
      if (konamiTimeout) {
        clearTimeout(konamiTimeout);
      }
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

      <Dialog
        open={isDebugOpen}
        onOpenChange={(open) => {
          setIsDebugOpen(open);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto">
          <DialogHeader>
            <DialogTitle>Debug Menu</DialogTitle>
            <DialogDescription>
              Current gradient preset information
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Accordion
                type="single"
                collapsible
                className="w-full cursor-pointer"
              >
                <AccordionItem value="json">
                  <AccordionTrigger>Current Preset (JSON)</AccordionTrigger>
                  <AccordionContent>
                    <Textarea
                      id="debugInfo"
                      readOnly
                      value={JSON.stringify(preset, null, 2)}
                      className="min-h-[400px] resize-none font-mono text-xs"
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <FieldDescription>
                Complete preset configuration in JSON format
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Preset Details</FieldLabel>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>ID:</strong> {preset.id}
                </div>
                <div>
                  <strong>Name:</strong> {preset.name}
                </div>
                <div>
                  <strong>Type:</strong> {preset.props.type}
                </div>
                <div>
                  <strong>Colors:</strong> {preset.props.color1},{" "}
                  {preset.props.color2}, {preset.props.color3}
                </div>
                <div>
                  <strong>Camera Distance:</strong> {preset.props.cDistance}
                </div>
                <div>
                  <strong>Camera Zoom:</strong> {preset.props.cameraZoom}
                </div>
                <div>
                  <strong>Camera Angles:</strong> Azimuth:{" "}
                  {preset.props.cAzimuthAngle}°, Polar:{" "}
                  {preset.props.cPolarAngle}°
                </div>
                <div>
                  <strong>Position:</strong> X: {preset.props.positionX}, Y:{" "}
                  {preset.props.positionY}, Z: {preset.props.positionZ}
                </div>
                <div>
                  <strong>Rotation:</strong> X: {preset.props.rotationX}°, Y:{" "}
                  {preset.props.rotationY}°, Z: {preset.props.rotationZ}°
                </div>
                <div>
                  <strong>Brightness:</strong> {preset.props.brightness}
                </div>
                <div>
                  <strong>Grain:</strong> {preset.props.grain}
                </div>
                <div>
                  <strong>Light Type:</strong> {preset.props.lightType}
                </div>
                <div>
                  <strong>Environment:</strong> {preset.props.envPreset}
                </div>
              </div>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(preset, null, 2));
              }}
            >
              Copy JSON
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsDebugOpen(false);
              }}
            >
              Close
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

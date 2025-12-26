import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Shield, User } from "lucide-react";
import { BUILT_IN_PRESET_METADATA } from "@/lib/preset";

function AboutPage() {
  const version = browser.runtime.getManifest().version;
  const author = "Minagishl";
  const githubUrl = "https://github.com/minagishl/gradia";
  const licenseUrl = `${githubUrl}/blob/main/LICENSE`;

  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 p-4 pb-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <img
              src="/src/assets/icon128.png"
              alt="Gradia Logo"
              className="size-16"
            />
            <div className="flex h-16 flex-1 flex-col justify-center">
              <div className="flex items-center gap-2">
                <CardTitle>Gradia</CardTitle>
                <Badge variant="outline">v{version}</Badge>
              </div>
              <CardDescription className="mt-2 text-left">
                A lightweight Chrome extension screensaver built with React,
                Vite, and Canvas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">About</h3>
            <p className="text-muted-foreground text-sm">
              Gradia is a beautiful screensaver extension that transforms your
              browser into an animated gradient display. With{" "}
              {BUILT_IN_PRESET_METADATA.length} built-in presets and support for
              custom gradients, you can create stunning visual experiences while
              your browser is idle.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Features</h3>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>
                {BUILT_IN_PRESET_METADATA.length} beautiful built-in gradient
                presets
              </li>
              <li>Create and manage custom gradient presets</li>
              <li>Multi-monitor support</li>
              <li>Password protection option</li>
              <li>Random gradient generation (from presets or fully random)</li>
              <li>Keyboard shortcut activation (Ctrl+Shift+S / Cmd+Shift+S)</li>
              <li>Context menu quick access</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Developer & Support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="text-muted-foreground size-4" />
            <span className="text-sm">Created by {author}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openLink(githubUrl)}
              className="gap-1"
            >
              <Github className="size-4" />
              View on GitHub
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => openLink(licenseUrl)}
              className="gap-1"
            >
              <Shield className="size-4" />
              MIT License
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credits & Acknowledgments</CardTitle>
          <CardDescription>
            Built with these amazing technologies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>
              <a
                href="https://www.shadergradient.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Shader Gradient
              </a>{" "}
              - Beautiful shader-based gradients
            </li>
            <li>
              <a
                href="https://react.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                React
              </a>{" "}
              - UI framework
            </li>
            <li>
              <a
                href="https://vitejs.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Vite
              </a>{" "}
              - Build tool
            </li>
            <li>
              <a
                href="https://tailwindcss.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Tailwind CSS
              </a>{" "}
              - Styling
            </li>
            <li>
              <a
                href="https://ui.shadcn.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                shadcn/ui
              </a>{" "}
              - UI components
            </li>
            <li>
              <a
                href="https://lucide.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Lucide
              </a>{" "}
              - Icons
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-muted-foreground pt-4 text-center text-xs">
        <p>
          &copy; {new Date().getFullYear()} {author}. All rights reserved.
        </p>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<AboutPage />);
}

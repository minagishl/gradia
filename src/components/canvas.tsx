import { useEffect, useState } from "react";
import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import type { GradientPreset } from "../lib/preset";

interface ScreensaverCanvasProps {
  preset: GradientPreset;
}

// Calculate the pixel density based on the screen size and the base pixel density
function calculatePixelDensity(
  basePixelDensity: number,
  width: number,
  height: number
): number {
  const isPortrait = height > width;
  const aspectRatio = Math.max(width, height) / Math.min(width, height);

  if (isPortrait && aspectRatio > 1.5) {
    return Math.max(basePixelDensity * 1.5, 1.5);
  }

  return basePixelDensity;
}

export const ScreensaverCanvas = ({ preset }: ScreensaverCanvasProps) => {
  const [pixelDensity, setPixelDensity] = useState(
    calculatePixelDensity(
      preset.canvas.pixelDensity,
      window.innerWidth,
      window.innerHeight
    )
  );

  useEffect(() => {
    const updatePixelDensity = () => {
      const newDensity = calculatePixelDensity(
        preset.canvas.pixelDensity,
        window.innerWidth,
        window.innerHeight
      );
      setPixelDensity(newDensity);
    };

    updatePixelDensity();
    window.addEventListener("resize", updatePixelDensity);
    window.addEventListener("orientationchange", updatePixelDensity);

    return () => {
      window.removeEventListener("resize", updatePixelDensity);
      window.removeEventListener("orientationchange", updatePixelDensity);
    };
  }, [preset.canvas.pixelDensity]);

  return (
    <ShaderGradientCanvas
      style={{
        width: "100dvw",
        height: "100dvh",
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        touchAction: "none",
      }}
      pixelDensity={pixelDensity}
      fov={preset.canvas.fov}
    >
      <ShaderGradient {...preset.props} />
    </ShaderGradientCanvas>
  );
};

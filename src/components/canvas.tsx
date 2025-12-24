import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";
import type { GradientPreset } from "../types/gradients";

interface ScreensaverCanvasProps {
  preset: GradientPreset;
}

export const ScreensaverCanvas = ({ preset }: ScreensaverCanvasProps) => {
  return (
    <ShaderGradientCanvas
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        touchAction: "none",
      }}
      pixelDensity={preset.canvas.pixelDensity}
      fov={preset.canvas.fov}
    >
      <ShaderGradient {...preset.props} />
    </ShaderGradientCanvas>
  );
};

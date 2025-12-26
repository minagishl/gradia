import { GRADIENT_PRESETS, type GradientPreset } from "./preset";

// Helper function to generate a random color in hex format
function randomColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// Helper function to generate a random number in a range
function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Helper function to generate a random integer in a range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Select a random preset from existing presets
export function getRandomPresetFromExisting() {
  const randomIndex = randomInt(0, GRADIENT_PRESETS.length - 1);
  return GRADIENT_PRESETS[randomIndex];
}

// Generate a random gradient preset
export function generateRandomPreset(): GradientPreset {
  const types = ["plane", "sphere", "waterPlane"] as const;
  const envPresets = ["city", "dawn"] as const;
  const lightTypes = ["3d", "env"] as const;
  const grainOptions = ["on", "off"] as const;

  const type = types[randomInt(0, types.length - 1)];
  const envPreset = envPresets[randomInt(0, envPresets.length - 1)];
  const lightType = lightTypes[randomInt(0, lightTypes.length - 1)];
  const grain = grainOptions[randomInt(0, grainOptions.length - 1)];

  // Use safer ranges based on existing presets that avoid black areas
  // Most working presets use cDistance 2.6-3.9 and cameraZoom 1-9
  let cDistance: number;
  let cameraZoom: number;
  let cPolarAngle: number;
  let positionY: number;
  let cAzimuthAngle: number;

  // Adjust settings based on type to avoid black areas
  if (type === "sphere") {
    cDistance = randomRange(2.6, 3.9);
    cameraZoom = randomRange(1, 9);
    cPolarAngle = randomInt(80, 100);
    positionY = randomRange(0, 0.5);
    cAzimuthAngle = randomInt(170, 190); // Most sphere presets use 180
  } else if (type === "waterPlane") {
    cDistance = randomRange(2.6, 4.4);
    cameraZoom = randomRange(1, 9);
    cPolarAngle = randomInt(70, 95);
    positionY = randomRange(0, 1.0);
    cAzimuthAngle = randomInt(170, 190);
  } else {
    // plane
    cDistance = randomRange(2.6, 3.9);
    cameraZoom = randomRange(1, 9);
    cPolarAngle = randomInt(80, 100);
    positionY = randomRange(0, 0.5);
    cAzimuthAngle = randomInt(170, 190);
  }

  return {
    id: "random",
    name: "Random",
    canvas: { pixelDensity: 1, fov: 45 },
    props: {
      animate: "on",
      axesHelper: "off",
      brightness: randomRange(0.8, 1.5),
      cAzimuthAngle,
      cDistance,
      cPolarAngle,
      cameraZoom,
      color1: randomColor(),
      color2: randomColor(),
      color3: randomColor(),
      destination: "onCanvas",
      embedMode: "off",
      envPreset,
      format: "gif",
      frameRate: 10,
      gizmoHelper: "hide",
      grain,
      lightType,
      positionX: randomRange(-1.4, 0.3),
      positionY,
      positionZ: randomRange(-0.3, 0),
      range: "disabled",
      rangeEnd: 40,
      rangeStart: 0,
      reflection: randomRange(0.1, 0.5),
      rotationX: randomInt(0, 90),
      rotationY: randomInt(0, 180),
      rotationZ: randomInt(0, 180),
      shader: "defaults",
      type,
      uAmplitude: randomRange(0, 7),
      uDensity: randomRange(0.8, 2),
      uFrequency: randomRange(0, 5.5),
      uSpeed: randomRange(0.1, 0.8),
      uStrength: randomRange(0.4, 5),
      uTime: 0,
      wireframe: false,
    },
  };
}

/**
 * Get all gradient presets (built-in + custom)
 */
export async function getAllPresets() {
  const { getCustomPresets } = await import("./custom-presets");
  const { GRADIENT_PRESETS } = await import("./preset");
  const customPresets = await getCustomPresets();
  return [...GRADIENT_PRESETS, ...customPresets];
}

/**
 * Check if a preset ID is a custom preset
 */
export function isCustomPreset(id: string): boolean {
  return id.startsWith("custom-");
}

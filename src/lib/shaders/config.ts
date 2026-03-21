/**
 * Fullscreen shader preset config definitions.
 */

export type GlassShaderConfig = {
  effect: "glass";
  backdrop: { color1: string; color2: string; color3: string };
  distortion?: number;
  chromaticAberration?: number;
  speed?: number;
  waviness?: number;
  frequency?: number;
  rods?: number;
};

export type GlitterClothShaderConfig = {
  effect: "glitter-cloth";
  color?: string;
  speed?: number;
  brightness?: number;
  blendStrength?: number;
  noiseScale?: number;
  vignetteStrength?: number;
  vignettePower?: number;
  vignetteOpacity?: number;
};

export type LavaLampShaderConfig = {
  effect: "lava-lamp";
  color?: string;
  fresnelColor?: string;
  speed?: number;
  fresnelPower?: number;
  radius?: number;
  smoothness?: number;
};

export type NeuralNoiseShaderConfig = {
  effect: "neural-noise";
  speed?: number;
  color?: string;
};

export type PlasmaGridShaderConfig = {
  effect: "plasma-grid";
  color: string;
  highlightColor: string;
};

export type SpecularBandShaderConfig = {
  effect: "specular-band";
  color?: string;
  backgroundColor?: string;
  speed?: number;
  distortion?: number;
  hueShift?: number;
  intensity?: number;
};

export type ShaderConfig =
  | GlassShaderConfig
  | GlitterClothShaderConfig
  | LavaLampShaderConfig
  | NeuralNoiseShaderConfig
  | PlasmaGridShaderConfig
  | SpecularBandShaderConfig;

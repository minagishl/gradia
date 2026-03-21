import clipSpaceVert from "./glsl/clip-space.vert?raw";
import glassBackdropFrag from "./glsl/glass-backdrop.frag?raw";
import glassPaneFrag from "./glsl/glass-pane.frag?raw";
import glitterClothFrag from "./glsl/glitter-cloth.frag?raw";
import lavaLampFrag from "./glsl/lava-lamp.frag?raw";
import neuralNoiseFrag from "./glsl/neural-noise.frag?raw";
import plasmaGridFrag from "./glsl/plasma-grid.frag?raw";
import specularBandFrag from "./glsl/specular-band.frag?raw";

export const shaders = {
  clipSpaceVert,
  glassBackdropFrag,
  glassPaneFrag,
  glitterClothFrag,
  lavaLampFrag,
  neuralNoiseFrag,
  plasmaGridFrag,
  specularBandFrag,
} as const;

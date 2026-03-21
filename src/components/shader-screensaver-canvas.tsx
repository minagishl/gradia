import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ShaderConfig } from "@/lib/shaders/config";
import { shaders } from "@/lib/shaders/shader-imports";

type ShaderScreensaverCanvasProps = {
  config: ShaderConfig;
  pixelDensity: number;
};

function GlassEffect({
  config,
}: {
  config: Extract<ShaderConfig, { effect: "glass" }>;
}) {
  const { size } = useThree();
  const glassMatRef = useRef<THREE.ShaderMaterial>(null);

  const glassUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uColorA: { value: new THREE.Color(config.backdrop.color1) },
      uColorB: { value: new THREE.Color(config.backdrop.color2) },
      uColorC: { value: new THREE.Color(config.backdrop.color3) },
      uDistortion: { value: 0.55 },
      uChromaticAberration: { value: 0.006 },
      uWaviness: { value: 0.045 },
      uFrequency: { value: 6 },
      uRods: { value: 4.5 },
    }),
    [config.backdrop.color1, config.backdrop.color2, config.backdrop.color3]
  );

  useLayoutEffect(() => {
    glassUniforms.uColorA.value.set(config.backdrop.color1);
    glassUniforms.uColorB.value.set(config.backdrop.color2);
    glassUniforms.uColorC.value.set(config.backdrop.color3);
  }, [
    glassUniforms,
    config.backdrop.color1,
    config.backdrop.color2,
    config.backdrop.color3,
  ]);

  useFrame((_, delta) => {
    const w = Math.max(1, size.width);
    const h = Math.max(1, size.height);

    const g = glassMatRef.current;
    if (g) {
      g.uniforms.uTime.value += delta * (config.speed ?? 0.55);
      g.uniforms.uResolution.value.set(w, h);
      g.uniforms.uColorA.value.set(config.backdrop.color1);
      g.uniforms.uColorB.value.set(config.backdrop.color2);
      g.uniforms.uColorC.value.set(config.backdrop.color3);
      g.uniforms.uDistortion.value = config.distortion ?? 0.55;
      g.uniforms.uChromaticAberration.value =
        config.chromaticAberration ?? 0.006;
      g.uniforms.uWaviness.value = config.waviness ?? 0.045;
      g.uniforms.uFrequency.value = config.frequency ?? 6;
      g.uniforms.uRods.value = config.rods ?? 4.5;
    }
  });

  const result = (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={glassMatRef}
        depthTest={false}
        depthWrite={false}
        fragmentShader={shaders.glassPaneFrag}
        vertexShader={shaders.clipSpaceVert}
        uniforms={glassUniforms}
      />
    </mesh>
  );
  return result;
}

function GlitterClothEffect({
  config,
}: {
  config: Extract<ShaderConfig, { effect: "glitter-cloth" }>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const primary = useMemo(() => new THREE.Color(), []);
  const accent = useMemo(() => new THREE.Color(), []);
  const shadow = useMemo(() => new THREE.Color(), []);
  const color = config.color ?? "#ff6900";

  useLayoutEffect(() => {
    primary.set(color);
    const hsl = { h: 0, s: 0, l: 0 };
    primary.getHSL(hsl);
    accent.setHSL(
      (hsl.h + 0.04) % 1,
      THREE.MathUtils.clamp(hsl.s * 1.1, 0, 1),
      THREE.MathUtils.clamp(hsl.l * 1.1 + 0.04, 0, 1)
    );
    shadow.setHSL(
      hsl.h,
      THREE.MathUtils.clamp(hsl.s * 0.55, 0, 1),
      THREE.MathUtils.clamp(hsl.l * 0.45, 0, 1)
    );
    const m = matRef.current;
    if (m) {
      m.uniforms.uPrimaryColor.value.copy(primary);
      m.uniforms.uAccentColor.value.copy(accent);
      m.uniforms.uShadowColor.value.copy(shadow);
      m.uniforms.uSpeed.value = config.speed ?? 1;
      m.uniforms.uBrightness.value = config.brightness ?? 1;
      m.uniforms.uBlendStrength.value = config.blendStrength ?? 0.02;
      m.uniforms.uNoiseScale.value = config.noiseScale ?? 4;
      m.uniforms.uVignetteStrength.value = config.vignetteStrength ?? 15;
      m.uniforms.uVignettePower.value = config.vignettePower ?? 0.25;
      m.uniforms.uVignetteOpacity.value = config.vignetteOpacity ?? 1;
    }
  }, [
    accent,
    color,
    config.brightness,
    config.blendStrength,
    config.noiseScale,
    config.speed,
    config.vignetteOpacity,
    config.vignettePower,
    config.vignetteStrength,
    primary,
    shadow,
  ]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uPrimaryColor: { value: primary },
      uAccentColor: { value: accent },
      uShadowColor: { value: shadow },
      uSpeed: { value: config.speed ?? 1 },
      uBrightness: { value: config.brightness ?? 1 },
      uBlendStrength: { value: config.blendStrength ?? 0.02 },
      uNoiseScale: { value: config.noiseScale ?? 4 },
      uVignetteStrength: { value: config.vignetteStrength ?? 15 },
      uVignettePower: { value: config.vignettePower ?? 0.25 },
      uVignetteOpacity: { value: config.vignetteOpacity ?? 1 },
    }),
    [
      accent,
      config.brightness,
      config.blendStrength,
      config.noiseScale,
      config.speed,
      config.vignetteOpacity,
      config.vignettePower,
      config.vignetteStrength,
      primary,
      shadow,
      size.height,
      size.width,
    ]
  );

  useFrame((_, delta) => {
    const m = matRef.current;
    if (m) {
      m.uniforms.uTime.value += delta;
      m.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        depthTest={false}
        depthWrite={false}
        fragmentShader={shaders.glitterClothFrag}
        vertexShader={shaders.clipSpaceVert}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function LavaLampEffect({
  config,
}: {
  config: Extract<ShaderConfig, { effect: "lava-lamp" }>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const resolutionUniform = useMemo(() => new THREE.Vector4(), []);
  const colorUniform = useMemo(() => new THREE.Color(), []);
  const fresnelUniform = useMemo(() => new THREE.Color(), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: resolutionUniform },
      uColor: { value: colorUniform },
      uFresnelColor: { value: fresnelUniform },
      uFresnelPower: { value: config.fresnelPower ?? 3 },
      uRadius: { value: config.radius ?? 1 },
      uSmoothness: { value: config.smoothness ?? 0.1 },
    }),
    [
      colorUniform,
      config.fresnelPower,
      config.radius,
      config.smoothness,
      fresnelUniform,
      resolutionUniform,
    ]
  );

  useLayoutEffect(() => {
    colorUniform.set(config.color ?? "#18181b");
    fresnelUniform.set(config.fresnelColor ?? "#ff6900");
    const m = matRef.current;
    if (m) {
      m.uniforms.uColor.value.copy(colorUniform);
      m.uniforms.uFresnelColor.value.copy(fresnelUniform);
      m.uniforms.uFresnelPower.value = config.fresnelPower ?? 3;
      m.uniforms.uRadius.value = config.radius ?? 1;
      m.uniforms.uSmoothness.value = config.smoothness ?? 0.1;
    }
  }, [
    colorUniform,
    config.color,
    config.fresnelColor,
    config.fresnelPower,
    config.radius,
    config.smoothness,
    fresnelUniform,
  ]);

  useFrame((_, delta) => {
    const m = matRef.current;
    if (m) {
      const width = size.width;
      const height = size.height;
      const imageAspect = 1;
      let a1: number;
      let a2: number;
      if (height / width > imageAspect) {
        a1 = (width / height) * imageAspect;
        a2 = 1;
      } else {
        a1 = 1;
        a2 = height / width / imageAspect;
      }
      resolutionUniform.set(width, height, a1, a2);
      m.uniforms.uTime.value += delta * (config.speed ?? 1);
      m.uniforms.uResolution.value.copy(resolutionUniform);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthTest={false}
        depthWrite={false}
        fragmentShader={shaders.lavaLampFrag}
        vertexShader={shaders.clipSpaceVert}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function NeuralNoiseEffect({
  config,
}: {
  config: Extract<ShaderConfig, { effect: "neural-noise" }>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const tint = useMemo(
    () => new THREE.Color(config.color ?? "#ffffff"),
    [config.color]
  );
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uTint: { value: tint },
    }),
    [size.height, size.width, tint]
  );

  useFrame((_, delta) => {
    const m = matRef.current;
    if (m) {
      m.uniforms.uTime.value += delta * (config.speed ?? 0.5);
      m.uniforms.uResolution.value.set(size.width, size.height);
      m.uniforms.uTint.value.copy(tint);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthTest={false}
        depthWrite={false}
        fragmentShader={shaders.neuralNoiseFrag}
        vertexShader={shaders.clipSpaceVert}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function PlasmaGridEffect({
  config,
}: {
  config: Extract<ShaderConfig, { effect: "plasma-grid" }>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const resolutionUniform = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const baseColorUniform = useMemo(() => new THREE.Vector3(), []);
  const gradientColorUniform = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    const base = new THREE.Color(config.color);
    const gradient = new THREE.Color(config.highlightColor);
    baseColorUniform.set(base.r, base.g, base.b);
    gradientColorUniform.set(gradient.r, gradient.g, gradient.b);
  }, [
    baseColorUniform,
    config.color,
    config.highlightColor,
    gradientColorUniform,
  ]);

  useLayoutEffect(() => {
    resolutionUniform.set(size.width, size.height, 1);
  }, [resolutionUniform, size.height, size.width]);

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: resolutionUniform },
      u_baseColor: { value: baseColorUniform },
      u_gradientColor: { value: gradientColorUniform },
    }),
    [baseColorUniform, gradientColorUniform, resolutionUniform]
  );

  useFrame((_, delta) => {
    const m = matRef.current;
    if (m) {
      m.uniforms.u_time.value += delta * 0.5;
      m.uniforms.u_resolution.value.set(size.width, size.height, 1);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthTest={false}
        depthWrite={false}
        fragmentShader={shaders.plasmaGridFrag}
        vertexShader={shaders.clipSpaceVert}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function SpecularBandEffect({
  config,
}: {
  config: Extract<ShaderConfig, { effect: "specular-band" }>;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();
  const resolutionUniform = useMemo(() => new THREE.Vector2(1, 1), []);
  const primaryColorUniform = useMemo(() => new THREE.Color(), []);
  const backgroundColorUniform = useMemo(() => new THREE.Color(), []);

  useLayoutEffect(() => {
    resolutionUniform.set(size.width, size.height);
  }, [resolutionUniform, size.height, size.width]);

  useLayoutEffect(() => {
    primaryColorUniform.set(config.color ?? "#ff6900");
    backgroundColorUniform.set(config.backgroundColor ?? "#000000");
    const m = matRef.current;
    if (m) {
      m.uniforms.uColor.value.copy(primaryColorUniform);
      m.uniforms.uBackgroundColor.value.copy(backgroundColorUniform);
      m.uniforms.uSpeed.value = config.speed ?? 1;
      m.uniforms.uDistortion.value = config.distortion ?? 0.2;
      m.uniforms.uHueShift.value = config.hueShift ?? 30;
      m.uniforms.uIntensity.value = config.intensity ?? 1;
    }
  }, [
    backgroundColorUniform,
    config.backgroundColor,
    config.color,
    config.distortion,
    config.hueShift,
    config.intensity,
    config.speed,
    primaryColorUniform,
  ]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: resolutionUniform },
      uColor: { value: primaryColorUniform },
      uBackgroundColor: { value: backgroundColorUniform },
      uSpeed: { value: config.speed ?? 1 },
      uDistortion: { value: config.distortion ?? 0.2 },
      uHueShift: { value: config.hueShift ?? 30 },
      uIntensity: { value: config.intensity ?? 1 },
    }),
    [
      backgroundColorUniform,
      config.distortion,
      config.hueShift,
      config.intensity,
      config.speed,
      primaryColorUniform,
      resolutionUniform,
    ]
  );

  useFrame((_, delta) => {
    const m = matRef.current;
    if (m) {
      m.uniforms.uTime.value += delta;
      m.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        depthTest={false}
        depthWrite={false}
        fragmentShader={shaders.specularBandFrag}
        vertexShader={shaders.clipSpaceVert}
        uniforms={uniforms}
      />
    </mesh>
  );
}

function MotionScene({ config }: { config: ShaderConfig }) {
  switch (config.effect) {
    case "glass":
      return <GlassEffect config={config} />;
    case "glitter-cloth":
      return <GlitterClothEffect config={config} />;
    case "lava-lamp":
      return <LavaLampEffect config={config} />;
    case "neural-noise":
      return <NeuralNoiseEffect config={config} />;
    case "plasma-grid":
      return <PlasmaGridEffect config={config} />;
    case "specular-band":
      return <SpecularBandEffect config={config} />;
  }
}

export function ShaderScreensaverCanvas({
  config,
  pixelDensity,
}: ShaderScreensaverCanvasProps) {
  const dpr = Math.min(
    typeof window !== "undefined" ? window.devicePixelRatio : 1,
    2
  );
  const effectiveDpr = Math.max(pixelDensity * dpr, 1);

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1, near: 0.1, far: 10 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      dpr={[1, effectiveDpr]}
      style={{
        width: "100dvw",
        height: "100dvh",
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        touchAction: "none",
      }}
    >
      <color attach="background" args={["#000000"]} />
      <Suspense fallback={null}>
        <MotionScene config={config} />
      </Suspense>
    </Canvas>
  );
}

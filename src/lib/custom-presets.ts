import { z } from "zod";
import browser from "webextension-polyfill";
import type { GradientPreset } from "./preset";

// Storage key for custom presets
const CUSTOM_PRESETS_KEY = "customGradientPresets";

// Zod schema for ShaderGradientProps validation
const shaderGradientPropsSchema = z.object({
  animate: z.enum(["on", "off"]).optional(),
  axesHelper: z.string().optional(),
  brightness: z.number().min(0).max(5).optional(),
  cAzimuthAngle: z.number().optional(),
  cDistance: z.number().optional(),
  cPolarAngle: z.number().optional(),
  cameraZoom: z.number().optional(),
  color1: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/i)
    .optional(),
  color2: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/i)
    .optional(),
  color3: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/i)
    .optional(),
  bgColor1: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/i)
    .optional(),
  bgColor2: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/i)
    .optional(),
  destination: z.string().optional(),
  embedMode: z.string().optional(),
  envPreset: z.string().optional(),
  format: z.string().optional(),
  frameRate: z.number().optional(),
  fov: z.number().optional(),
  gizmoHelper: z.string().optional(),
  grain: z.enum(["on", "off"]).optional(),
  lightType: z.string().optional(),
  pixelDensity: z.number().optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  positionZ: z.number().optional(),
  range: z.string().optional(),
  rangeEnd: z.number().optional(),
  rangeStart: z.number().optional(),
  reflection: z.number().optional(),
  rotationX: z.number().optional(),
  rotationY: z.number().optional(),
  rotationZ: z.number().optional(),
  shader: z.string().optional(),
  type: z.string().optional(),
  uAmplitude: z.number().optional(),
  uDensity: z.number().optional(),
  uFrequency: z.number().optional(),
  uSpeed: z.number().optional(),
  uStrength: z.number().optional(),
  uTime: z.number().optional(),
  wireframe: z.boolean().optional(),
});

// Zod schema for GradientPreset validation
const gradientPresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  canvas: z.object({
    pixelDensity: z.number().positive(),
    fov: z.number().positive(),
  }),
  props: shaderGradientPropsSchema,
});

// Schema for array of presets (for import validation)
const customPresetsArraySchema = z.array(gradientPresetSchema);

/**
 * Get all custom gradient presets from storage
 */
export async function getCustomPresets(): Promise<GradientPreset[]> {
  try {
    const result = await browser.storage.sync.get(CUSTOM_PRESETS_KEY);
    const presets = result[CUSTOM_PRESETS_KEY];

    if (!presets || !Array.isArray(presets)) {
      return [];
    }

    // Validate the stored data
    const parsed = customPresetsArraySchema.safeParse(presets);
    return parsed.success ? (parsed.data as GradientPreset[]) : [];
  } catch (error) {
    console.error("Failed to get custom presets:", error);
    return [];
  }
}

/**
 * Save a custom gradient preset
 */
export async function saveCustomPreset(preset: GradientPreset): Promise<void> {
  try {
    // Validate the preset
    const validated = gradientPresetSchema.parse(preset) as GradientPreset;

    // Get existing presets
    const existingPresets = await getCustomPresets();

    // Check if preset with same ID exists (update) or add new
    const index = existingPresets.findIndex((p) => p.id === validated.id);
    if (index >= 0) {
      existingPresets[index] = validated;
    } else {
      existingPresets.push(validated);
    }

    // Check storage quota (approximate)
    const dataSize = JSON.stringify(existingPresets).length;
    if (dataSize > 90000) {
      // Leave some margin below 100KB
      throw new Error(
        "Storage quota exceeded. Please delete some presets before adding new ones."
      );
    }

    // Save to storage
    await browser.storage.sync.set({
      [CUSTOM_PRESETS_KEY]: existingPresets,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.issues.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
}

/**
 * Delete a custom gradient preset
 */
export async function deleteCustomPreset(id: string): Promise<void> {
  try {
    const existingPresets = await getCustomPresets();
    const filteredPresets = existingPresets.filter((p) => p.id !== id);

    await browser.storage.sync.set({
      [CUSTOM_PRESETS_KEY]: filteredPresets,
    });
  } catch (error) {
    console.error("Failed to delete custom preset:", error);
    throw error;
  }
}

/**
 * Validate and import presets from JSON string
 * Returns array of valid presets, throws error if validation fails
 */
export function validateAndImportPresets(json: string): GradientPreset[] {
  try {
    const parsed = JSON.parse(json);

    // Support both single preset and array of presets
    const presetsArray = Array.isArray(parsed) ? parsed : [parsed];

    // Validate all presets
    const validated = customPresetsArraySchema.parse(
      presetsArray
    ) as GradientPreset[];

    // Ensure all presets have custom- prefix
    return validated.map((preset) => ({
      ...preset,
      id: preset.id.startsWith("custom-")
        ? preset.id
        : `custom-${Date.now()}-${preset.id}`,
    }));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format");
    }
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      throw new Error(`Validation errors:\n${errors.join("\n")}`);
    }
    throw error;
  }
}

/**
 * Export presets as JSON string
 */
export function exportPresetsAsJSON(presets: GradientPreset[]): string {
  return JSON.stringify(presets, null, 2);
}

/**
 * Generate a unique ID for custom preset
 */
export function generateCustomPresetId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `custom-${timestamp}-${random}`;
}

/**
 * Duplicate an existing preset with a new ID and name
 */
export function duplicatePreset(preset: GradientPreset): GradientPreset {
  return {
    ...preset,
    id: generateCustomPresetId(),
    name: `${preset.name} (Copy)`,
  };
}

/**
 * Check if there's enough quota for new presets
 */
export async function checkStorageQuota(
  newPresets: GradientPreset[]
): Promise<{ hasSpace: boolean; estimatedSize: number }> {
  const existingPresets = await getCustomPresets();
  const combined = [...existingPresets, ...newPresets];
  const estimatedSize = JSON.stringify(combined).length;

  return {
    hasSpace: estimatedSize < 90000, // Leave margin below 100KB
    estimatedSize,
  };
}

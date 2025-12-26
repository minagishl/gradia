import { useState } from "react";
import type { GradientPreset } from "@/lib/preset";
import { GRADIENT_PRESETS } from "@/lib/preset";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { generateCustomPresetId } from "@/lib/custom-presets";

interface PresetEditorFormProps {
  initialPreset?: GradientPreset;
  onSave: (preset: GradientPreset) => void;
  onCancel: () => void;
  mode: "create" | "edit";
}

export function PresetEditorForm({
  initialPreset,
  onSave,
  onCancel,
  mode,
}: PresetEditorFormProps) {
  const [formData, setFormData] = useState<GradientPreset>(
    initialPreset || {
      id: generateCustomPresetId(),
      name: "",
      canvas: { pixelDensity: 1, fov: 45 },
      props: {
        animate: "on",
        brightness: 1.2,
        cAzimuthAngle: 180,
        cDistance: 3.6,
        cPolarAngle: 90,
        cameraZoom: 1,
        color1: "#ff5005",
        color2: "#dbba95",
        color3: "#d0bce1",
        type: "plane",
        grain: "on",
        lightType: "3d",
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        uSpeed: 0.4,
        uStrength: 4,
        uDensity: 1.3,
        uFrequency: 5.5,
        uAmplitude: 1,
        reflection: 0.1,
        wireframe: false,
      },
    }
  );

  const [copyFromPreset, setCopyFromPreset] = useState<string | undefined>(
    undefined
  );

  // Handle copying from existing preset
  const handleCopyFromPreset = (presetId: string) => {
    setCopyFromPreset(presetId);
    if (presetId && mode === "create") {
      const sourcePreset = GRADIENT_PRESETS.find((p) => p.id === presetId);
      if (sourcePreset) {
        setFormData({
          ...sourcePreset,
          id: generateCustomPresetId(),
          name: `${sourcePreset.name} (Copy)`,
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (path: string, value: unknown) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const newData = { ...prev };
      let current: Record<string, unknown> = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...(current[key] as Record<string, unknown>) };
        current = current[key] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === "create" && (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="copyFrom">
              Copy from existing preset (optional)
            </FieldLabel>
            <Select value={copyFromPreset} onValueChange={handleCopyFromPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Start from scratch" />
              </SelectTrigger>
              <SelectContent>
                {GRADIENT_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Optionally start with an existing preset and customize it
            </FieldDescription>
          </Field>
        </FieldGroup>
      )}

      <Accordion type="multiple" defaultValue={["basic"]} className="w-full">
        <AccordionItem value="basic">
          <AccordionTrigger>Basic Information</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Preset Name *</FieldLabel>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  maxLength={50}
                />
                <FieldDescription>
                  A descriptive name for your preset
                </FieldDescription>
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="canvas">
          <AccordionTrigger>Canvas Settings</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="pixelDensity">Pixel Density</FieldLabel>
                <Input
                  id="pixelDensity"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="3"
                  value={formData.canvas.pixelDensity}
                  onChange={(e) =>
                    updateField(
                      "canvas.pixelDensity",
                      parseFloat(e.target.value)
                    )
                  }
                />
                <FieldDescription>
                  1 is standard, higher = sharper (slower)
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="fov">Field of View (FOV)</FieldLabel>
                <Input
                  id="fov"
                  type="number"
                  min="10"
                  max="120"
                  value={formData.canvas.fov}
                  onChange={(e) =>
                    updateField("canvas.fov", parseInt(e.target.value, 10))
                  }
                />
                <FieldDescription>
                  Camera field of view in degrees
                </FieldDescription>
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="colors">
          <AccordionTrigger>Colors</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="color1">Color 1</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="color1"
                    type="color"
                    value={formData.props.color1}
                    onChange={(e) =>
                      updateField("props.color1", e.target.value)
                    }
                    className="h-10 w-20"
                  />
                  <Input
                    type="text"
                    value={formData.props.color1}
                    onChange={(e) =>
                      updateField("props.color1", e.target.value)
                    }
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="color2">Color 2</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="color2"
                    type="color"
                    value={formData.props.color2}
                    onChange={(e) =>
                      updateField("props.color2", e.target.value)
                    }
                    className="h-10 w-20"
                  />
                  <Input
                    type="text"
                    value={formData.props.color2}
                    onChange={(e) =>
                      updateField("props.color2", e.target.value)
                    }
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="color3">Color 3</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id="color3"
                    type="color"
                    value={formData.props.color3}
                    onChange={(e) =>
                      updateField("props.color3", e.target.value)
                    }
                    className="h-10 w-20"
                  />
                  <Input
                    type="text"
                    value={formData.props.color3}
                    onChange={(e) =>
                      updateField("props.color3", e.target.value)
                    }
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1"
                  />
                </div>
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="camera">
          <AccordionTrigger>Camera Settings</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="cDistance">Distance</FieldLabel>
                <Input
                  id="cDistance"
                  type="number"
                  step="0.1"
                  value={formData.props.cDistance}
                  onChange={(e) =>
                    updateField("props.cDistance", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="cameraZoom">Zoom</FieldLabel>
                <Input
                  id="cameraZoom"
                  type="number"
                  step="0.1"
                  value={formData.props.cameraZoom}
                  onChange={(e) =>
                    updateField("props.cameraZoom", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="cPolarAngle">Polar Angle</FieldLabel>
                <Input
                  id="cPolarAngle"
                  type="number"
                  min="0"
                  max="180"
                  value={formData.props.cPolarAngle}
                  onChange={(e) =>
                    updateField(
                      "props.cPolarAngle",
                      parseInt(e.target.value, 10)
                    )
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="cAzimuthAngle">Azimuth Angle</FieldLabel>
                <Input
                  id="cAzimuthAngle"
                  type="number"
                  min="0"
                  max="360"
                  value={formData.props.cAzimuthAngle}
                  onChange={(e) =>
                    updateField(
                      "props.cAzimuthAngle",
                      parseInt(e.target.value, 10)
                    )
                  }
                />
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="position">
          <AccordionTrigger>Position</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="positionX">X</FieldLabel>
                <Input
                  id="positionX"
                  type="number"
                  step="0.1"
                  value={formData.props.positionX}
                  onChange={(e) =>
                    updateField("props.positionX", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="positionY">Y</FieldLabel>
                <Input
                  id="positionY"
                  type="number"
                  step="0.1"
                  value={formData.props.positionY}
                  onChange={(e) =>
                    updateField("props.positionY", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="positionZ">Z</FieldLabel>
                <Input
                  id="positionZ"
                  type="number"
                  step="0.1"
                  value={formData.props.positionZ}
                  onChange={(e) =>
                    updateField("props.positionZ", parseFloat(e.target.value))
                  }
                />
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="rotation">
          <AccordionTrigger>Rotation</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="rotationX">X</FieldLabel>
                <Input
                  id="rotationX"
                  type="number"
                  min="0"
                  max="360"
                  value={formData.props.rotationX}
                  onChange={(e) =>
                    updateField("props.rotationX", parseInt(e.target.value, 10))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="rotationY">Y</FieldLabel>
                <Input
                  id="rotationY"
                  type="number"
                  min="0"
                  max="360"
                  value={formData.props.rotationY}
                  onChange={(e) =>
                    updateField("props.rotationY", parseInt(e.target.value, 10))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="rotationZ">Z</FieldLabel>
                <Input
                  id="rotationZ"
                  type="number"
                  min="0"
                  max="360"
                  value={formData.props.rotationZ}
                  onChange={(e) =>
                    updateField("props.rotationZ", parseInt(e.target.value, 10))
                  }
                />
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shader">
          <AccordionTrigger>Shader Settings</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Select
                  value={formData.props.type}
                  onValueChange={(value) => updateField("props.type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plane">Plane</SelectItem>
                    <SelectItem value="sphere">Sphere</SelectItem>
                    <SelectItem value="waterPlane">Water Plane</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="lightType">Light Type</FieldLabel>
                <Select
                  value={formData.props.lightType}
                  onValueChange={(value) =>
                    updateField("props.lightType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3d">3D</SelectItem>
                    <SelectItem value="env">Environment</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="grain">Grain</FieldLabel>
                <Select
                  value={formData.props.grain}
                  onValueChange={(value) => updateField("props.grain", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on">On</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="animation">
          <AccordionTrigger>Animation Settings</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="animate">Animate</FieldLabel>
                <Select
                  value={formData.props.animate}
                  onValueChange={(value) => updateField("props.animate", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on">On</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="uSpeed">Speed</FieldLabel>
                <Input
                  id="uSpeed"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.props.uSpeed}
                  onChange={(e) =>
                    updateField("props.uSpeed", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="uStrength">Strength</FieldLabel>
                <Input
                  id="uStrength"
                  type="number"
                  step="0.1"
                  value={formData.props.uStrength}
                  onChange={(e) =>
                    updateField("props.uStrength", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="uDensity">Density</FieldLabel>
                <Input
                  id="uDensity"
                  type="number"
                  step="0.1"
                  value={formData.props.uDensity}
                  onChange={(e) =>
                    updateField("props.uDensity", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="uFrequency">Frequency</FieldLabel>
                <Input
                  id="uFrequency"
                  type="number"
                  step="0.1"
                  value={formData.props.uFrequency}
                  onChange={(e) =>
                    updateField("props.uFrequency", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="uAmplitude">Amplitude</FieldLabel>
                <Input
                  id="uAmplitude"
                  type="number"
                  step="0.1"
                  value={formData.props.uAmplitude}
                  onChange={(e) =>
                    updateField("props.uAmplitude", parseFloat(e.target.value))
                  }
                />
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="brightness">Brightness</FieldLabel>
                <Input
                  id="brightness"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.props.brightness}
                  onChange={(e) =>
                    updateField("props.brightness", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="reflection">Reflection</FieldLabel>
                <Input
                  id="reflection"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.props.reflection}
                  onChange={(e) =>
                    updateField("props.reflection", parseFloat(e.target.value))
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="wireframe">Wireframe</FieldLabel>
                <Select
                  value={formData.props.wireframe ? "true" : "false"}
                  onValueChange={(value) =>
                    updateField("props.wireframe", value === "true")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Off</SelectItem>
                    <SelectItem value="true">On</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {mode === "create" ? "Create" : "Save"} Preset
        </Button>
      </div>
    </form>
  );
}

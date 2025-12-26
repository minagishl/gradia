import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import browser from "webextension-polyfill";
import type { GradientPreset } from "@/lib/preset";
import {
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  exportPresetsAsJSON,
  validateAndImportPresets,
  duplicatePreset,
} from "@/lib/custom-presets";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Plus, Upload, Download, Edit, Copy, Trash2 } from "lucide-react";
import { PresetEditorForm } from "@/components/preset-editor-form";

function OptionsPage() {
  const [customPresets, setCustomPresets] = useState<GradientPreset[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<GradientPreset | null>(
    null
  );
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState("");
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null);

  // Load custom presets on mount
  useEffect(() => {
    const loadPresets = async () => {
      const presets = await getCustomPresets();
      setCustomPresets(presets);
    };

    loadPresets();

    // Listen for storage changes
    const listener = (
      changes: { [key: string]: browser.Storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "sync" && changes.customGradientPresets) {
        loadPresets();
      }
    };

    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
  }, []);

  const loadCustomPresets = async () => {
    const presets = await getCustomPresets();
    setCustomPresets(presets);
  };

  const handleCreatePreset = async (preset: GradientPreset) => {
    try {
      await saveCustomPreset(preset);
      setIsCreateDialogOpen(false);
      await loadCustomPresets();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create preset");
    }
  };

  const handleEditPreset = async (preset: GradientPreset) => {
    try {
      await saveCustomPreset(preset);
      setIsEditDialogOpen(false);
      setSelectedPreset(null);
      await loadCustomPresets();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update preset");
    }
  };

  const handleDuplicate = async (preset: GradientPreset) => {
    try {
      const duplicated = duplicatePreset(preset);
      await saveCustomPreset(duplicated);
      await loadCustomPresets();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Failed to duplicate preset"
      );
    }
  };

  const handleDelete = async () => {
    if (!presetToDelete) return;

    try {
      await deleteCustomPreset(presetToDelete);
      setIsDeleteDialogOpen(false);
      setPresetToDelete(null);
      await loadCustomPresets();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete preset");
    }
  };

  const handleExport = (preset: GradientPreset) => {
    const json = exportPresetsAsJSON([preset]);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${preset.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const json = exportPresetsAsJSON(customPresets);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gradia-custom-presets.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    try {
      setImportError("");
      const presets = validateAndImportPresets(importJson);

      // Save all imported presets
      for (const preset of presets) {
        await saveCustomPreset(preset);
      }

      setIsImportDialogOpen(false);
      setImportJson("");
      await loadCustomPresets();
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Failed to import presets"
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportJson(text);
    };
    reader.readAsText(file);
  };

  const openEditDialog = (preset: GradientPreset) => {
    setSelectedPreset(preset);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (presetId: string) => {
    setPresetToDelete(presetId);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-4 pb-16">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Custom Gradient Presets</CardTitle>
              <CardDescription className="mt-2">
                Create and manage your own gradient presets
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-1"
              >
                <Plus className="size-4" />
                Create Preset
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsImportDialogOpen(true)}
                className="gap-1"
              >
                <Upload className="size-4" />
                Import
              </Button>
              {customPresets.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportAll}
                  className="gap-1"
                >
                  <Download className="size-4" />
                  Export All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customPresets.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No custom presets yet</p>
              <p className="text-sm">
                Create your first custom gradient preset to get started
              </p>
              <Button
                className="mt-4 gap-1"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="size-4" />
                Create Preset
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {customPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="border-border flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{preset.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          Custom
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        <div
                          className="size-4 rounded border"
                          style={{ backgroundColor: preset.props.color1 }}
                        />
                        <div
                          className="size-4 rounded border"
                          style={{ backgroundColor: preset.props.color2 }}
                        />
                        <div
                          className="size-4 rounded border"
                          style={{ backgroundColor: preset.props.color3 }}
                        />
                        <span className="text-muted-foreground ml-2 text-xs">
                          {preset.props.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(preset)}
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDuplicate(preset)}
                    >
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleExport(preset)}
                    >
                      <Download className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openDeleteDialog(preset.id)}
                    >
                      <Trash2 className="text-destructive size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {customPresets.length > 0 && (
            <p className="text-muted-foreground mt-4 text-sm">
              {customPresets.length} custom preset
              {customPresets.length !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Preset</DialogTitle>
            <DialogDescription>
              Create a new gradient preset with custom colors and settings
            </DialogDescription>
          </DialogHeader>
          <PresetEditorForm
            mode="create"
            onSave={handleCreatePreset}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Custom Preset</DialogTitle>
            <DialogDescription>
              Modify the settings for this gradient preset
            </DialogDescription>
          </DialogHeader>
          {selectedPreset && (
            <PresetEditorForm
              mode="edit"
              initialPreset={selectedPreset}
              onSave={handleEditPreset}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedPreset(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Presets</DialogTitle>
            <DialogDescription>
              Import custom presets from a JSON file or paste JSON directly
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fileUpload">Upload File</FieldLabel>
              <Input
                id="fileUpload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="jsonInput">Or Paste JSON</FieldLabel>
              <Textarea
                id="jsonInput"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='[{"id": "custom-...", "name": "My Preset", ...}]'
                className="font-mono text-xs"
                rows={10}
              />
            </Field>
          </FieldGroup>

          {importError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {importError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportJson("");
                setImportError("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importJson.trim()}>
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete preset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The preset will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPresetToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<OptionsPage />);
}

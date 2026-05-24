"use client";

import { useState, useRef } from "react";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui";

interface Props {
  currentUrl: string;
  onChange: (url: string) => void;
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/svg+xml";

export function LogoUploader({ currentUrl, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error("La imagen excede 2 MB. Reduce el tamaño e intenta de nuevo.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `logo-${Date.now()}.${ext}`;

      const { error: upError } = await supabase.storage
        .from("logos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (upError) {
        toast.error(`Error al subir: ${upError.message}`);
        return;
      }

      const { data } = supabase.storage.from("logos").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Logo cargado. Recuerda guardar la configuración.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    if (!confirm("¿Quitar el logo actual?")) return;
    onChange("");
    toast.info("Logo removido. Recuerda guardar la configuración.");
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="logo-upload"
      />
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-[var(--muted)] shrink-0 overflow-hidden">
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentUrl}
              alt="Logo actual"
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <ImageIcon
              size={36}
              className="text-[var(--muted-foreground)]"
              aria-label="Sin logo"
            />
          )}
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <label htmlFor="logo-upload" className="inline-block">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full sm:w-auto justify-center"
            >
              <Upload size={16} /> {uploading ? "Subiendo..." : currentUrl ? "Cambiar logo" : "Subir logo"}
            </Button>
          </label>
          {currentUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
              className="text-[var(--destructive)] justify-center sm:justify-start"
            >
              <Trash2 size={14} /> Quitar logo
            </Button>
          )}
          <p className="text-xs text-[var(--muted-foreground)]">
            PNG, JPG, WebP o SVG. Máximo 2 MB. Recomendado: fondo transparente y proporción horizontal.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileCheck2, X } from "lucide-react";
import { uploadToCloudinary } from "@/lib/upload";
import { cn } from "@/lib/utils";

type FileUploadProps = {
  folder: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  accept?: string;
  hint?: string;
};

export function FileUpload({
  folder,
  value,
  onChange,
  accept = "image/*,application/pdf",
  hint = "PNG, JPG, or PDF up to 10MB",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, folder);
      onChange(url);
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed — try again");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-sand-deep px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
          <FileCheck2 className="size-4 shrink-0 text-success" />
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="truncate text-pangong hover:underline"
          >
            Document uploaded
          </a>
        </span>
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="shrink-0 text-ink-muted hover:text-ink"
          aria-label="Remove file"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      className={cn(
        "flex w-full flex-col items-center gap-1.5 rounded-control border border-dashed border-border bg-paper px-4 py-6 text-center transition-colors hover:border-pangong hover:bg-pangong-tint/30",
        uploading && "opacity-70",
      )}
    >
      {uploading ? (
        <Loader2 className="size-5 animate-spin text-pangong" />
      ) : (
        <UploadCloud className="size-5 text-pangong" />
      )}
      <span className="text-sm font-medium text-ink">
        {uploading ? "Uploading…" : "Click to upload"}
      </span>
      <span className="text-xs text-ink-muted">{hint}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
    </button>
  );
}

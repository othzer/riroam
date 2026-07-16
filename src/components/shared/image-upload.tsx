"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, ImagePlus, X } from "lucide-react";
import { uploadToCloudinary } from "@/lib/upload";
import { cn } from "@/lib/utils";

function useUpload(folder: string) {
  const [uploading, setUploading] = useState(false);
  async function upload(file: File): Promise<string | null> {
    setUploading(true);
    try {
      return await uploadToCloudinary(file, folder);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed — try again");
      return null;
    } finally {
      setUploading(false);
    }
  }
  return { uploading, upload };
}

/** Round avatar picker — same upload path as the cover picker, circular crop. */
export function AvatarUpload({
  folder,
  value,
  fallback,
  onChange,
}: {
  folder: string;
  value?: string;
  fallback: string;
  onChange: (url: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useUpload(folder);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) onChange(url);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-border bg-pangong-tint">
        {value ? (
          <Image src={value} alt="" fill className="object-cover" sizes="80px" />
        ) : (
          <span className="flex size-full items-center justify-center font-heading text-xl font-bold text-pangong-deep">
            {fallback}
          </span>
        )}
      </div>
      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:border-pangong hover:text-pangong disabled:opacity-60"
        >
          {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
          {uploading ? "Uploading…" : value ? "Change photo" : "Add photo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[11.5px] text-ink-muted transition-colors hover:text-danger"
          >
            Remove photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

/** Single cover image (16:10). */
export function SingleImageUpload({
  folder,
  value,
  onChange,
}: {
  folder: string;
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useUpload(folder);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) onChange(url);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (value) {
    return (
      <div className="group relative aspect-[16/10] w-full max-w-sm overflow-hidden rounded-control border border-border">
        <Image src={value} alt="Cover" fill className="object-cover" sizes="384px" />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="absolute right-2 top-2 rounded-full bg-ink/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Remove image"
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
      className="flex aspect-[16/10] w-full max-w-sm flex-col items-center justify-center gap-1.5 rounded-control border border-dashed border-border bg-paper text-center transition-colors hover:border-pangong hover:bg-pangong-tint/30"
    >
      {uploading ? (
        <Loader2 className="size-5 animate-spin text-pangong" />
      ) : (
        <ImagePlus className="size-5 text-pangong" />
      )}
      <span className="text-sm font-medium text-ink">
        {uploading ? "Uploading…" : "Add cover image"}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </button>
  );
}

/** Gallery of images. */
export function MultiImageUpload({
  folder,
  value,
  onChange,
  max = 8,
}: {
  folder: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useUpload(folder);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const room = max - value.length;
    const next = [...value];
    for (const file of files.slice(0, room)) {
      const url = await upload(file);
      if (url) next.push(url);
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {value.map((url, i) => (
        <div
          key={url}
          className="group relative aspect-square overflow-hidden rounded-control border border-border"
        >
          <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
          <button
            type="button"
            onClick={() => onChange(value.filter((u) => u !== url))}
            className="absolute right-1 top-1 rounded-full bg-ink/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Remove image"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}

      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-1 rounded-control border border-dashed border-border bg-paper text-center transition-colors hover:border-pangong hover:bg-pangong-tint/30",
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-pangong" />
          ) : (
            <ImagePlus className="size-5 text-pangong" />
          )}
          <span className="text-xs text-ink-muted">Add</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </button>
      )}
    </div>
  );
}

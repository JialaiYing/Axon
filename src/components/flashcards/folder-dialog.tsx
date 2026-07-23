"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderCoverTile } from "@/components/flashcards/folder-cover-tile";
import type { FlashcardFolder } from "@/types";

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

export type FolderDialogInput = {
  title: string;
  imageDataUrl?: string;
};

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, dialog edits this folder instead of creating. */
  folder?: FlashcardFolder | null;
  onCreate?: (input: FolderDialogInput) => void;
  onSave?: (id: string, input: FolderDialogInput) => void;
}

export function FolderDialog({
  open,
  onOpenChange,
  folder = null,
  onCreate,
  onSave,
}: FolderDialogProps) {
  const isEdit = Boolean(folder);
  const [title, setTitle] = React.useState("");
  const [imageDataUrl, setImageDataUrl] = React.useState<string | undefined>(undefined);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    if (folder) {
      setTitle(folder.title);
      setImageDataUrl(folder.imageDataUrl);
      setImageError(null);
    } else {
      setTitle("");
      setImageDataUrl(undefined);
      setImageError(null);
    }
  }, [open, folder]);

  function handleFile(file: File | undefined) {
    setImageError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be under 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setImageDataUrl(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const input: FolderDialogInput = {
      title: title.trim(),
      imageDataUrl,
    };
    if (isEdit && folder && onSave) {
      onSave(folder.id, input);
    } else {
      onCreate?.(input);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit folder" : "New folder"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the name or cover image. Changes show in the library grid and list."
              : "Folders group your flashcard sets and appear in the library gallery."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center rounded-md border border-border/50 bg-transparent px-4 py-6 light:border-border">
            <FolderCoverTile
              title={title || "Untitled"}
              imageSrc={imageDataUrl}
              setCount={isEdit ? undefined : 0}
              size="lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-title">Title</Label>
            <Input
              id="folder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Organic Chemistry"
              autoFocus
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label>Cover image (optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-3.5 w-3.5" />
                {imageDataUrl ? "Replace image" : "Upload image"}
              </Button>
              {imageDataUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setImageDataUrl(undefined)}
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </Button>
              )}
            </div>
            {imageError && <p className="text-xs text-danger">{imageError}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()} className="cursor-pointer">
              {isEdit ? "Save changes" : "Create folder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** @deprecated Use FolderDialog — kept as alias for existing imports during migrate. */
export const CreateFolderDialog = FolderDialog;

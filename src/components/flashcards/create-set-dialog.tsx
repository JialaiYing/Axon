"use client";

import * as React from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FlashcardFolder } from "@/types";

const NO_FOLDER = "__none__";

interface CreateSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FlashcardFolder[];
  /** Preselects a folder (e.g. when creating from inside a folder view). */
  defaultFolderId?: string;
  onCreate: (input: {
    title: string;
    subject: string;
    description?: string;
    folderId?: string;
  }) => void;
}

export function CreateSetDialog({
  open,
  onOpenChange,
  folders,
  defaultFolderId,
  onCreate,
}: CreateSetDialogProps) {
  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [folderId, setFolderId] = React.useState<string>(defaultFolderId ?? NO_FOLDER);

  React.useEffect(() => {
    if (open) setFolderId(defaultFolderId ?? NO_FOLDER);
  }, [open, defaultFolderId]);

  function reset() {
    setTitle("");
    setSubject("");
    setDescription("");
    setFolderId(defaultFolderId ?? NO_FOLDER);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      subject: subject.trim() || "General",
      description: description.trim() || undefined,
      folderId: folderId === NO_FOLDER ? undefined : folderId,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New flashcard set</DialogTitle>
          <DialogDescription>Add cards to the set after creating it.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="set-title">Title</Label>
            <Input
              id="set-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Alkene Reactions"
              autoFocus
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="set-subject">Subject</Label>
            <Input
              id="set-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Chemistry"
              maxLength={40}
            />
          </div>

          <div className="space-y-2">
            <Label>Folder</Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="No folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_FOLDER}>No folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="set-description">Description (optional)</Label>
            <Textarea
              id="set-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this set cover?"
              rows={2}
              maxLength={200}
            />
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
              Create set
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

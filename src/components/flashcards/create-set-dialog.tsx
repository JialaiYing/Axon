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
import { Plus } from "lucide-react";
import type { FlashcardFolder } from "@/types";

const NO_FOLDER = "__none__";
const CREATE_FOLDER = "__create__";

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
  /** Creates a folder inline from the dropdown and returns it so it can be selected. */
  onCreateFolder: (title: string) => FlashcardFolder;
}

export function CreateSetDialog({
  open,
  onOpenChange,
  folders,
  defaultFolderId,
  onCreate,
  onCreateFolder,
}: CreateSetDialogProps) {
  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [folderId, setFolderId] = React.useState<string>(defaultFolderId ?? NO_FOLDER);
  const [creatingFolder, setCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const newFolderInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setFolderId(defaultFolderId ?? NO_FOLDER);
      setCreatingFolder(false);
      setNewFolderName("");
    }
  }, [open, defaultFolderId]);

  function reset() {
    setTitle("");
    setSubject("");
    setDescription("");
    setFolderId(defaultFolderId ?? NO_FOLDER);
    setCreatingFolder(false);
    setNewFolderName("");
  }

  function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const folder = onCreateFolder(name);
    setFolderId(folder.id);
    setCreatingFolder(false);
    setNewFolderName("");
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
            <Select
              value={folderId}
              onValueChange={(value) => {
                if (value === CREATE_FOLDER) {
                  // Keep the current selection; open the inline creation row instead.
                  setCreatingFolder(true);
                  requestAnimationFrame(() => newFolderInputRef.current?.focus());
                  return;
                }
                setFolderId(value);
              }}
            >
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
                <div className="my-1 border-t border-border" />
                <SelectItem value={CREATE_FOLDER} className="text-accent focus:text-accent">
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> New folder
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {creatingFolder && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-wash p-2">
                <Input
                  ref={newFolderInputRef}
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateFolder();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setCreatingFolder(false);
                      setNewFolderName("");
                    }
                  }}
                  placeholder="Folder name"
                  maxLength={60}
                  className="h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!newFolderName.trim()}
                  className="shrink-0 cursor-pointer"
                  onClick={handleCreateFolder}
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0 cursor-pointer"
                  onClick={() => {
                    setCreatingFolder(false);
                    setNewFolderName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
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

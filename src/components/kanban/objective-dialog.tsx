"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ObjectiveForm } from "@/components/kanban/objective-form";
import type { ObjectiveInput } from "@/hooks/use-objectives";
import type { Objective, ObjectiveStatus } from "@/types";

interface ObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  defaultStatus?: ObjectiveStatus;
  objective?: Objective;
  onSubmit: (input: ObjectiveInput) => void;
}

export function ObjectiveDialog({
  open,
  onOpenChange,
  mode,
  defaultStatus,
  objective,
  onSubmit,
}: ObjectiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New objective" : "Edit objective"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new task to your study workflow."
              : "Update the details for this objective."}
          </DialogDescription>
        </DialogHeader>

        <ObjectiveForm
          key={objective?.id ?? "new"}
          defaultStatus={defaultStatus}
          initialValues={objective}
          submitLabel={mode === "create" ? "Create objective" : "Save changes"}
          onCancel={() => onOpenChange(false)}
          onSubmit={(input) => {
            onSubmit(input);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

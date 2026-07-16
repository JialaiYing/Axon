"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  KANBAN_COLUMNS,
  PRIORITY_OPTIONS,
  OBJECTIVE_COLORS,
} from "@/constants/kanban";
import type { ObjectiveInput } from "@/hooks/use-objectives";
import type { Objective } from "@/types";

const objectiveSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Keep it under 120 characters"),
  description: z.string().max(500).optional(),
  subject: z.string().min(1, "Subject is required").max(60),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in-progress", "done"]),
  dueDate: z.string().optional(),
  estimatedStudyTime: z
    .union([z.coerce.number().int().min(0).max(1440), z.nan()])
    .optional()
    .transform((v) => (Number.isNaN(v) ? undefined : v)),
  progress: z.coerce.number().int().min(0).max(100),
  labels: z.string().max(200).optional(),
  color: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type ObjectiveFormValues = z.infer<typeof objectiveSchema>;

interface ObjectiveFormProps {
  defaultStatus?: Objective["status"];
  initialValues?: Objective;
  onSubmit: (input: ObjectiveInput) => void;
  onCancel: () => void;
  submitLabel: string;
}

export function ObjectiveForm({
  defaultStatus = "todo",
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
}: ObjectiveFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      description: initialValues?.description ?? "",
      subject: initialValues?.subject ?? "",
      priority: initialValues?.priority ?? "medium",
      status: initialValues?.status ?? defaultStatus,
      dueDate: initialValues?.dueDate?.slice(0, 10) ?? "",
      estimatedStudyTime: initialValues?.estimatedStudyTime,
      progress: initialValues?.progress ?? 0,
      labels: initialValues?.labels?.join(", ") ?? "",
      color: initialValues?.color ?? OBJECTIVE_COLORS[0],
      notes: initialValues?.notes ?? "",
    },
  });

  const selectedColor = watch("color");
  const progress = watch("progress");

  const submit = handleSubmit((values) => {
    onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      subject: values.subject.trim(),
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
      estimatedStudyTime: values.estimatedStudyTime,
      progress: values.progress,
      labels: values.labels
        ? values.labels.split(",").map((l) => l.trim()).filter(Boolean)
        : [],
      color: values.color,
      notes: values.notes?.trim() || undefined,
    });
  });

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="e.g. Finish problem set 4" {...register("title")} />
        {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={2}
          placeholder="Optional details about this objective"
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" placeholder="e.g. Chemistry" {...register("subject")} />
          {errors.subject && <p className="text-xs text-danger">{errors.subject.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KANBAN_COLUMNS.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...register("dueDate")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="estimatedStudyTime">Est. time (minutes)</Label>
          <Input
            id="estimatedStudyTime"
            type="number"
            min={0}
            max={1440}
            placeholder="60"
            {...register("estimatedStudyTime")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="progress">Progress ({progress ?? 0}%)</Label>
          <input
            id="progress"
            type="range"
            min={0}
            max={100}
            step={5}
            {...register("progress")}
            className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface accent-accent"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="labels">Labels (comma separated)</Label>
        <Input id="labels" placeholder="reading, quiz-prep" {...register("labels")} />
      </div>

      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue("color", color)}
              aria-label={`Select color ${color}`}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform",
                selectedColor === color
                  ? "scale-110 border-foreground"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={2} placeholder="Optional notes" {...register("notes")} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

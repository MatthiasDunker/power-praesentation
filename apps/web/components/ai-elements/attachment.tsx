"use client";

import {
  createContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useContext
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AttachmentData {
  id: string;
  file: File;
}

interface AttachmentContextValue {
  data: AttachmentData;
  onRemove?: () => void;
}

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

function useAttachmentContext() {
  const context = useContext(AttachmentContext);
  if (!context) {
    throw new Error("Attachment components must be used within <Attachment>.");
  }

  return context;
}

interface AttachmentsProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "inline" | "stacked";
}

export function Attachments({ variant = "inline", className, ...props }: AttachmentsProps) {
  const variantClass =
    variant === "inline"
      ? "flex flex-wrap items-center gap-2"
      : "flex flex-col gap-2";

  return <div className={cn(variantClass, className)} {...props} />;
}

interface AttachmentProps extends HTMLAttributes<HTMLDivElement> {
  data: AttachmentData;
  onRemove?: () => void;
}

export function Attachment({ data, onRemove, className, children, ...props }: AttachmentProps) {
  return (
    <AttachmentContext.Provider value={{ data, onRemove }}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs text-zinc-800",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AttachmentContext.Provider>
  );
}

export function AttachmentPreview({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  const { data } = useAttachmentContext();
  const extension = data.file.name.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <span
      className={cn(
        "inline-flex min-w-7 items-center justify-center rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold",
        className
      )}
      {...props}
    >
      {extension}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kib = bytes / 1024;
  if (kib < 1024) {
    return `${kib.toFixed(1)} KB`;
  }

  return `${(kib / 1024).toFixed(1)} MB`;
}

export function AttachmentInfo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { data } = useAttachmentContext();

  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      <span className="max-w-[180px] truncate">{data.file.name}</span>
      <span className="text-zinc-500">({formatBytes(data.file.size)})</span>
    </div>
  );
}

export function AttachmentRemove({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onRemove } = useAttachmentContext();

  return (
    <Button
      className={cn("h-5 w-5 px-0 text-zinc-600", className)}
      onClick={onRemove}
      size="icon"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? "×"}
    </Button>
  );
}

interface AttachmentTextProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function AttachmentText({ className, children, ...props }: AttachmentTextProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {children}
    </div>
  );
}

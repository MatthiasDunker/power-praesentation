import type { CSSProperties } from "react";

export interface FooterPartialProps {
  value: unknown;
  className?: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.map((entry) => {
    if (typeof entry === "string") {
      return entry;
    }

    if (entry === null || typeof entry === "undefined") {
      return "";
    }

    return String(entry);
  });
}

export function FooterPartial({ value, className }: FooterPartialProps) {
  if (typeof value === "string") {
    return (
      <p
        className={[
          "text-sm leading-tight text-zinc-500 whitespace-pre-wrap",
          className
        ]
          .filter(Boolean)
          .join(" ")}
        data-power-partial="footer"
      >
        {value}
      </p>
    );
  }

  const record = asRecord(value);
  const cols = asStringArray(record?.cols);

  if (cols && cols.length > 0) {
    return (
      <div
        className={[
          "grid items-end gap-3 text-sm leading-tight text-zinc-500",
          className
        ]
          .filter(Boolean)
          .join(" ")}
        data-power-partial="footer"
        style={{
          gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`
        } as CSSProperties}
      >
        {cols.map((column, index) => (
          <span
            className={index === cols.length - 1 ? "text-right" : "text-left"}
            key={`${index}-${column.slice(0, 12)}`}
          >
            {column}
          </span>
        ))}
      </div>
    );
  }

  const text = typeof record?.text === "string" ? record.text : undefined;

  if (!text) {
    return null;
  }

  return (
    <p
      className={[
        "text-sm leading-tight text-zinc-500 whitespace-pre-wrap",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      data-power-partial="footer"
    >
      {text}
    </p>
  );
}

import ReactMarkdown from "react-markdown";

interface BasicMarkdownProps {
  markdown: string;
}

export function BasicMarkdown({ markdown }: BasicMarkdownProps) {
  return (
    <ReactMarkdown
      components={{
        p: ({ className, ...props }) => (
          <p
            className={["typo-body size-medium tint-c-text", className]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
        ),
        ul: ({ className, ...props }) => (
          <ul
            className={[
              "typo-body size-medium tint-c-text list-inside list-disc",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...props}
          />
        ),
      }}
      skipHtml
    >
      {markdown}
    </ReactMarkdown>
  );
}

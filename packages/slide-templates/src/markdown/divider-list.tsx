import ReactMarkdown from "react-markdown";
import Paragraph from "./components/paragraph";

function DividerList({
  className,
  node,
  ...props
}: {
  className?: string;
  node?: any;
}) {
  return (
    <ul
      className={["list-none max-w-180", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

function DividerListItem({
  className,
  node,
  ...props
}: {
  className?: string;
  node?: any;
}) {
  return (
    <li
      className={[
        "block-list-divider typo-body size-medium tint-c-text py-gutter",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

interface DividerListProps {
  markdown: string;
}

export function DividerListMarkdown({ markdown }: DividerListProps) {
  return (
    <ReactMarkdown
      components={{
        p: Paragraph,
        ul: DividerList,
        li: DividerListItem,
      }}
      skipHtml
    >
      {markdown}
    </ReactMarkdown>
  );
}

export { DividerListMarkdown as DividerList };

import ReactMarkdown from "react-markdown";
import Paragraph from "./components/paragraph";
import List from "./components/list";
import ListItem from "./components/list-item";

interface InfoBoxProps {
  markdown: string;
  stretch?: boolean;
}

export function InfoBox({ markdown, stretch = false }: InfoBoxProps) {
  return (
    <aside
      className={[
        "theme-sand tint-bgc-full p-gutter space-y-[var(--spacing-gutter)]",
        stretch ? "h-full" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ReactMarkdown
        components={{
          p: Paragraph,
          ul: List,
          li: ListItem,
        }}
        skipHtml
      >
        {markdown}
      </ReactMarkdown>
    </aside>
  );
}

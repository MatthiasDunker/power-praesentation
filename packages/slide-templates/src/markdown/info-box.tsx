import ReactMarkdown from "react-markdown";
import Paragraph from "./components/paragraph";
import List from "./components/list";
import ListItem from "./components/list-item";

interface InfoBoxProps {
  markdown: string;
}

export function InfoBox({ markdown }: InfoBoxProps) {
  return (
    <aside className="theme-sand tint-bgc-full p-gutter space-y-[var(--spacing-gutter)]">
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

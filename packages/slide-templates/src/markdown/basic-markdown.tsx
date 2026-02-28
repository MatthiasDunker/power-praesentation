import ReactMarkdown from "react-markdown";

interface BasicMarkdownProps {
  markdown: string;
}

export function BasicMarkdown({ markdown }: BasicMarkdownProps) {
  return <ReactMarkdown skipHtml>{markdown}</ReactMarkdown>;
}

import { Fragment } from "react";
import type { ReactNode } from "react";

interface BasicMarkdownProps {
  markdown: string;
}

function inlineFormat(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
}

export function BasicMarkdown({ markdown }: BasicMarkdownProps) {
  const lines = markdown.split(/\r?\n/);
  const elements: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) {
      return;
    }

    elements.push(
      <ul key={key}>
        {listBuffer.map((item, index) => (
          <li key={`${key}-${index}`}>{inlineFormat(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const key = `line-${index}`;

    if (!trimmed) {
      flushList(`list-${index}`);
      return;
    }

    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      listBuffer.push(listMatch[1]);
      return;
    }

    flushList(`list-${index}`);

    if (trimmed.startsWith("# ")) {
      elements.push(<h1 key={key}>{inlineFormat(trimmed.slice(2))}</h1>);
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(<h2 key={key}>{inlineFormat(trimmed.slice(3))}</h2>);
      return;
    }

    elements.push(<p key={key}>{inlineFormat(trimmed)}</p>);
  });

  flushList("list-tail");

  return <Fragment>{elements}</Fragment>;
}

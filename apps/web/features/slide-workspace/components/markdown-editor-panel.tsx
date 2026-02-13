"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface MarkdownEditorPanelProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

export function MarkdownEditorPanel({ markdown, onChange }: MarkdownEditorPanelProps) {
  return (
    <Card className="min-h-[72vh] print:hidden">
      <CardHeader>
        <CardTitle>Deck markdown</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          aria-label="Deck markdown editor"
          className="min-h-[64vh] resize-y font-mono text-xs leading-6"
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          value={markdown}
        />
      </CardContent>
    </Card>
  );
}

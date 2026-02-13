"use client";

import type {
  DeckDocument,
  GenerationTaskId,
  InferredContext,
  OutlineItem,
  RuleSet
} from "@power/contracts";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep
} from "@/components/ai-elements/chain-of-thought";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskState {
  id: GenerationTaskId;
  status: "pending" | "running" | "completed" | "error";
  message: string;
}

type ChainStepStatus = "pending" | "active" | "complete" | "error";

interface GenerationThreadPanelProps {
  tasks: TaskState[];
  error: string | null;
  deck: DeckDocument | null;
  inferredContext: InferredContext | null;
  ruleset: RuleSet | null;
  outline: OutlineItem[];
}

function statusVariant(status: TaskState["status"]): "default" | "success" | "warning" | "error" {
  if (status === "completed") {
    return "success";
  }

  if (status === "running") {
    return "warning";
  }

  if (status === "error") {
    return "error";
  }

  return "default";
}

function taskStepStatus(status: TaskState["status"]): ChainStepStatus {
  if (status === "completed") {
    return "complete";
  }

  if (status === "running") {
    return "active";
  }

  return status;
}

export function GenerationThreadPanel({
  tasks,
  error,
  deck,
  inferredContext,
  ruleset,
  outline
}: GenerationThreadPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Generation Chain</span>
          {deck ? <Badge variant="success">Deck ready</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChainOfThought defaultOpen>
          <ChainOfThoughtHeader>Pipeline tasks</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            {tasks.map((task) => (
              <ChainOfThoughtStep key={task.id} label={task.message} status={taskStepStatus(task.status)}>
                <div className="flex items-center justify-between gap-2">
                  <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
                    {task.id}
                  </code>
                  <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                </div>
              </ChainOfThoughtStep>
            ))}
          </ChainOfThoughtContent>
        </ChainOfThought>

        <ChainOfThought defaultOpen={Boolean(deck)}>
          <ChainOfThoughtHeader>Artifacts</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            <ChainOfThoughtStep
              label="Inferred context"
              status={inferredContext ? "complete" : "pending"}
            >
              <pre className="max-h-40 overflow-auto rounded-md border border-zinc-200 bg-white p-2 text-xs">
                {inferredContext ? JSON.stringify(inferredContext, null, 2) : "pending"}
              </pre>
            </ChainOfThoughtStep>

            <ChainOfThoughtStep label="Ruleset" status={ruleset ? "complete" : "pending"}>
              <pre className="max-h-40 overflow-auto rounded-md border border-zinc-200 bg-white p-2 text-xs">
                {ruleset ? JSON.stringify(ruleset, null, 2) : "pending"}
              </pre>
            </ChainOfThoughtStep>

            <ChainOfThoughtStep label="Outline" status={outline.length > 0 ? "complete" : "pending"}>
              <pre className="max-h-40 overflow-auto rounded-md border border-zinc-200 bg-white p-2 text-xs">
                {outline.length > 0 ? JSON.stringify(outline, null, 2) : "pending"}
              </pre>
            </ChainOfThoughtStep>
          </ChainOfThoughtContent>
        </ChainOfThought>

        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

        {deck ? (
          <p className="text-sm text-zinc-700">
            Generated {deck.slides.length} slides in deck <code className="rounded bg-zinc-100 px-1.5 py-0.5">{deck.deckId}</code>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

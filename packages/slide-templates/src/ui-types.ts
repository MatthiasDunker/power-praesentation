import type { ReactNode } from "react";
import type { SlideTemplateDefinition } from "./types";

export interface SlideTemplateModule<TProps = unknown>
  extends SlideTemplateDefinition<TProps> {
  rootClassName: string;
  render: (props: TProps) => ReactNode;
}

export type SlideTemplateModuleRegistry = Record<string, SlideTemplateModule<unknown>>;

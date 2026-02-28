import type { ReactNode } from "react";
import type { SlideTemplateDefinition } from "./types";

export interface SlideTemplateSlots {
  footer?: ReactNode;
}

export interface SlideTemplateModule<TProps = unknown>
  extends SlideTemplateDefinition<TProps> {
  rootClassName: string;
  render: (props: TProps, slots?: SlideTemplateSlots) => ReactNode;
}

export type SlideTemplateModuleRegistry = Record<string, SlideTemplateModule<unknown>>;

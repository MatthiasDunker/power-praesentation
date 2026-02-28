import type { CoreTemplateId } from "@power/contracts";
import type { SlideTemplateModule } from "../../ui-types";
import { decodeMetricHighlight } from "./decode";
import { MetricHighlightTemplate } from "./render";
import { metricHighlightContainerRules } from "./spec";
import { baseTemplateRootClassName } from "../shared";

export const metricHighlightTemplateModule: SlideTemplateModule = {
  id: "metric-highlight" satisfies CoreTemplateId,
  containerRules: metricHighlightContainerRules,
  decode: decodeMetricHighlight,
  rootClassName: `${baseTemplateRootClassName} [&_h2]:text-[62px] [&_li]:text-[36px]`,
  render: (props, slots) => MetricHighlightTemplate(props as never, slots)
};

import * as React from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

// Simple design-system wrappers aligning naming with shadcn-like API
export const ResizablePanelGroup = PanelGroup;
export const ResizablePanel = Panel;
export const ResizableHandle: React.FC<React.ComponentProps<typeof PanelResizeHandle>> = (props) => (
  <PanelResizeHandle className="bg-border hover:bg-muted transition-colors" {...props} />
);
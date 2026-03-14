import {
  X,
  Filter,
  Database,
  List,
  MoreHorizontal,
  Plus,
  Check,
  Circle,
  AlertTriangle,
} from "lucide-react";
import type { WorkflowNode } from "./workflow-canvas";

interface DetailPanelProps {
  node: WorkflowNode;
  onClose: () => void;
}

function StatusIndicator({ status }: { status?: string }) {
  if (status === "completed") {
    return (
      <div className="flex items-center gap-1.5 text-emerald-600" style={{ fontSize: "13px" }}>
        <Check className="w-3.5 h-3.5" />
        Completed
      </div>
    );
  }
  if (status === "running") {
    return (
      <div className="flex items-center gap-1.5 text-amber-600" style={{ fontSize: "13px" }}>
        <Circle className="w-3.5 h-3.5 animate-pulse" />
        Running
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "13px" }}>
      <Circle className="w-3.5 h-3.5" />
      Pending
    </div>
  );
}

export function DetailPanel({ node, onClose }: DetailPanelProps) {
  const Icon = node.icon;

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0 h-full overflow-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <StatusIndicator status={node.status} />
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${node.iconBg}`}
          >
            <Icon className={`w-4 h-4 ${node.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground">{node.title}</h3>
            <span className="text-muted-foreground" style={{ fontSize: "13px" }}>
              {node.category}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-4 border-b border-border">
        <label className="text-muted-foreground mb-1 block" style={{ fontSize: "12px" }}>
          Description
        </label>
        <p className="text-foreground" style={{ fontSize: "14px" }}>
          {node.description}
        </p>
      </div>

      {/* Configuration */}
      <div className="px-5 py-4 border-b border-border">
        <label className="text-muted-foreground mb-3 block" style={{ fontSize: "12px" }}>
          Configuration
        </label>

        {node.type === "condition" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-foreground" style={{ fontSize: "13px" }}>
                Status equals "Skill"
              </span>
            </div>
            <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>
              <Plus className="w-3.5 h-3.5" />
              Add condition
            </button>
          </div>
        )}

        {node.type === "trigger" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
              <Icon className={`w-3.5 h-3.5 ${node.iconColor}`} />
              <span className="text-foreground" style={{ fontSize: "13px" }}>
                Listen for voice input events
              </span>
            </div>
          </div>
        )}

        {node.type === "action" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-2 bg-secondary rounded-lg">
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${node.iconColor}`} />
                <span className="text-foreground" style={{ fontSize: "13px" }}>
                  Target: {node.category}
                </span>
              </div>
              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        )}

        {node.type === "branch" && (
          <div className="space-y-2">
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="px-3 py-2.5 bg-secondary border-b border-border flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-foreground" style={{ fontSize: "13px" }}>
                  Branch conditions
                </span>
              </div>

              {node.branchLabels?.map((label, i) => (
                <div
                  key={i}
                  className="px-3 py-2.5 flex items-center justify-between border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${i === 0 ? "bg-blue-400" : "bg-violet-400"}`}
                    />
                    <span className="text-foreground" style={{ fontSize: "13px" }}>
                      {label}
                    </span>
                  </div>
                  <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next step */}
      <div className="px-5 py-4">
        <label className="text-muted-foreground mb-3 block" style={{ fontSize: "12px" }}>
          Next step
        </label>

        {node.children && node.children.length > 0 ? (
          <div className="space-y-2">
            {node.children.map((childId, i) => (
              <div
                key={childId}
                className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                <span className="text-foreground flex-1" style={{ fontSize: "13px" }}>
                  {node.branchLabels?.[i] || `Step ${childId}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 border border-dashed border-border rounded-xl text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>
            <Plus className="w-3.5 h-3.5" />
            Add a step
          </button>
        )}
      </div>
    </aside>
  );
}
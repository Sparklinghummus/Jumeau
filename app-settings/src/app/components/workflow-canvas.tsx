import { useState } from "react";
import {
  Mic,
  CheckSquare,
  GitBranch,
  Database,
  List,
  AlertTriangle,
  MessageSquare,
  Play,
  Plus,
  Mail,
  Sheet,
  Slack,
  NotebookPen,
  FolderOpen,
  Calendar,
  Table2,
  Cloud,
} from "lucide-react";
import { motion } from "motion/react";
import type { PersistedWorkflowNode } from "../lib/live-workflows";

export interface WorkflowNode {
  id: string;
  type: "trigger" | "condition" | "action" | "branch";
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  category: string;
  description: string;
  status?: "completed" | "running" | "pending";
  children?: string[];
  branchLabels?: string[];
}

const initialNodes: WorkflowNode[] = [
  {
    id: "1",
    type: "trigger",
    icon: Mic,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    title: "Voice input received",
    category: "Voice",
    description: "Trigger when a new voice memo is captured.",
    status: "completed",
    children: ["2"],
  },
  {
    id: "2",
    type: "condition",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-100",
    title: 'Is type "Skill"?',
    category: "Condition",
    description: 'Continue if the context type is "Skill".',
    status: "completed",
    children: ["3"],
  },
  {
    id: "3",
    type: "action",
    icon: MessageSquare,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    title: "Classify & enrich context",
    category: "AI",
    description: "Use AI to classify and enrich the voice context.",
    status: "running",
    children: ["4"],
  },
  {
    id: "4",
    type: "branch",
    icon: GitBranch,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    title: "Route by category",
    category: "Condition",
    description: "Branch based on the classified category.",
    status: "pending",
    children: ["5", "6"],
    branchLabels: ["Technical skill", "Soft skill"],
  },
  {
    id: "5",
    type: "action",
    icon: Database,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    title: 'Add to "Technical" tracker',
    category: "Records",
    description: 'Add entry to "Technical" skill tracker.',
    status: "pending",
  },
  {
    id: "6",
    type: "action",
    icon: List,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    title: 'Add to "Soft Skills" list',
    category: "Lists",
    description: 'Add entry to "Soft Skills" list.',
    status: "pending",
  },
];

interface WorkflowCanvasProps {
  onSelectNode: (node: WorkflowNode | null) => void;
  selectedNodeId: string | null;
  nodes?: PersistedWorkflowNode[];
  entryNodeId?: string | null;
}

function getIntegrationVisual(integration: string) {
  switch (integration) {
    case "gmail":
      return { icon: Mail, iconColor: "text-red-600", iconBg: "bg-red-100", category: "Integrations" };
    case "google-sheets":
      return { icon: Sheet, iconColor: "text-emerald-600", iconBg: "bg-emerald-100", category: "Integrations" };
    case "slack":
      return { icon: Slack, iconColor: "text-fuchsia-600", iconBg: "bg-fuchsia-100", category: "Integrations" };
    case "notion":
      return { icon: NotebookPen, iconColor: "text-slate-700", iconBg: "bg-slate-100", category: "Integrations" };
    case "google-drive":
      return { icon: FolderOpen, iconColor: "text-blue-600", iconBg: "bg-blue-100", category: "Integrations" };
    case "calendar":
      return { icon: Calendar, iconColor: "text-orange-600", iconBg: "bg-orange-100", category: "Integrations" };
    case "airtable":
      return { icon: Table2, iconColor: "text-cyan-600", iconBg: "bg-cyan-100", category: "Integrations" };
    case "amazon-s3":
      return { icon: Cloud, iconColor: "text-amber-700", iconBg: "bg-amber-100", category: "Integrations" };
    default:
      return null;
  }
}

function toCanvasNode(node: PersistedWorkflowNode): WorkflowNode {
  if (node.type === "trigger") {
    return {
      id: node.id,
      type: node.type,
      icon: Mic,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      title: node.title,
      category: node.category || "Voice",
      description: node.description,
      status: node.status,
      children: node.children,
    };
  }

  if (node.type === "condition") {
    return {
      id: node.id,
      type: node.type,
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-100",
      title: node.title,
      category: node.category || "Condition",
      description: node.description,
      status: node.status,
      children: node.children,
    };
  }

  if (node.type === "branch") {
    return {
      id: node.id,
      type: node.type,
      icon: GitBranch,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100",
      title: node.title,
      category: node.category || "Condition",
      description: node.description,
      status: node.status,
      children: node.children,
      branchLabels: node.branchLabels,
    };
  }

  const integration = String(node.params?.integration || "").toLowerCase();
  const integrationVisual = getIntegrationVisual(integration);
  if (integrationVisual) {
    return {
      id: node.id,
      type: node.type,
      icon: integrationVisual.icon,
      iconColor: integrationVisual.iconColor,
      iconBg: integrationVisual.iconBg,
      title: node.title,
      category: node.category || integrationVisual.category,
      description: node.description,
      status: node.status,
      children: node.children,
    };
  }

  if (node.category === "AI") {
    return {
      id: node.id,
      type: node.type,
      icon: MessageSquare,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      title: node.title,
      category: node.category,
      description: node.description,
      status: node.status,
      children: node.children,
    };
  }

  if (node.category === "Records") {
    return {
      id: node.id,
      type: node.type,
      icon: Database,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      title: node.title,
      category: node.category,
      description: node.description,
      status: node.status,
      children: node.children,
    };
  }

  if (node.category === "Lists") {
    return {
      id: node.id,
      type: node.type,
      icon: List,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100",
      title: node.title,
      category: node.category,
      description: node.description,
      status: node.status,
      children: node.children,
    };
  }

  return {
    id: node.id,
    type: node.type,
    icon: CheckSquare,
    iconColor: "text-slate-600",
    iconBg: "bg-slate-100",
    title: node.title,
    category: node.category || "Actions",
    description: node.description,
    status: node.status,
    children: node.children,
  };
}

function findEntryNodeId(nodes: WorkflowNode[], entryNodeId?: string | null) {
  if (entryNodeId && nodes.some((node) => node.id === entryNodeId)) {
    return entryNodeId;
  }

  return nodes.find((node) => node.type === "trigger")?.id || nodes[0]?.id || null;
}

function buildLinearChain(nodeMap: Record<string, WorkflowNode>, startNodeId: string | null) {
  const chain: string[] = [];
  const visited = new Set<string>();
  let currentNodeId = startNodeId;

  while (currentNodeId && !visited.has(currentNodeId)) {
    const node = nodeMap[currentNodeId];
    if (!node) {
      break;
    }

    chain.push(currentNodeId);
    visited.add(currentNodeId);

    if (node.type === "branch" || !node.children?.length) {
      break;
    }

    currentNodeId = node.children[0] || null;
  }

  return chain;
}

function StatusDot({ status }: { status?: string }) {
  if (status === "completed") {
    return (
      <span className="flex items-center gap-1.5" style={{ fontSize: "12px" }}>
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-emerald-600">Done</span>
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="flex items-center gap-1.5" style={{ fontSize: "12px" }}>
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-amber-600">Running</span>
      </span>
    );
  }
  return null;
}

function NodeCard({
  node,
  isSelected,
  onClick,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = node.icon;

  const isStart = node.type === "trigger";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={`relative bg-card rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md group
        ${isStart ? "w-[200px]" : "w-[320px]"}
        ${isSelected
          ? "border-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.12)]"
          : "border-border hover:border-foreground/15"
        }`}
    >
      {/* Port dots */}
      {!isStart && (
        <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-border bg-card" />
      )}
      <div className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-border bg-card group-hover:border-emerald-400 transition-colors" />

      <div className={`flex items-center gap-3 ${isStart ? "px-4 py-3.5" : "px-5 pt-4 pb-2"}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${node.iconBg}`}>
          {isStart ? (
            <Play className={`w-4 h-4 ${node.iconColor}`} />
          ) : (
            <Icon className={`w-4 h-4 ${node.iconColor}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-foreground block truncate">{node.title}</span>
          {!isStart && (
            <span className="text-muted-foreground block truncate" style={{ fontSize: "13px" }}>
              {node.category}
            </span>
          )}
        </div>
      </div>

      {!isStart && (
        <div className="px-5 pb-3 flex items-center justify-between">
          <p className="text-muted-foreground truncate flex-1" style={{ fontSize: "13px" }}>
            {node.description}
          </p>
          <StatusDot status={node.status} />
        </div>
      )}
    </motion.div>
  );
}

function AddNodeButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full border-2 border-dashed border-border bg-card flex items-center justify-center text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 transition-colors"
    >
      <Plus className="w-3.5 h-3.5" />
    </button>
  );
}

function HorizontalConnector({ label }: { label?: string }) {
  return (
    <div className="flex items-center relative">
      <div className="w-16 h-px bg-border" />
      {label && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="px-2 py-0.5 bg-card border border-border rounded-md text-muted-foreground" style={{ fontSize: "11px" }}>
            {label}
          </span>
        </div>
      )}
    </div>
  );
}

function VerticalConnector() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-12 bg-border" />
    </div>
  );
}

export function WorkflowCanvas({
  onSelectNode,
  selectedNodeId,
  nodes,
  entryNodeId,
}: WorkflowCanvasProps) {
  const resolvedNodes = nodes?.length ? nodes.map(toCanvasNode) : initialNodes;
  const nodeMap = Object.fromEntries(resolvedNodes.map((n) => [n.id, n]));

  const startNodeId = findEntryNodeId(resolvedNodes, entryNodeId);
  const linearChain = buildLinearChain(nodeMap, startNodeId);
  const branchCandidate = linearChain.length ? nodeMap[linearChain[linearChain.length - 1]] : null;
  const branchNode = branchCandidate?.type === "branch" ? branchCandidate : null;

  return (
    <div
      className="flex-1 overflow-auto flex flex-col items-center justify-start pt-20 pb-32"
      style={{
        backgroundImage:
          "radial-gradient(circle, #d4d0ca 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelectNode(null);
      }}
    >
      {/* Main horizontal flow */}
      <div className="flex items-center gap-0">
        {linearChain.map((nodeId, idx) => {
          const node = nodeMap[nodeId];
          if (!node) return null;

          return (
            <div key={node.id} className="flex items-center">
              {idx > 0 && <HorizontalConnector />}
              <NodeCard
                node={node}
                isSelected={selectedNodeId === node.id}
                onClick={() => onSelectNode(node)}
              />
            </div>
          );
        })}
      </div>

      {/* Branch section */}
      {branchNode && branchNode.children && branchNode.children.length > 1 && (
        <div className="flex flex-col items-center mt-0">
          {/* Vertical line from branch node */}
          <VerticalConnector />

          {/* Branch split */}
          <div className="relative flex items-start gap-16">
            {/* Horizontal connecting bar */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
              style={{ width: "calc(100% - 80px)" }}
            />

            {branchNode.children.map((childId, i) => {
              const child = nodeMap[childId];
              if (!child) return null;

              return (
                <div key={childId} className="flex flex-col items-center">
                  {/* Branch label */}
                  <div className="-mt-3 mb-2">
                    <span className="px-2.5 py-1 bg-card border border-border rounded-lg text-muted-foreground" style={{ fontSize: "12px" }}>
                      {branchNode.branchLabels?.[i] || (i === 0 ? "True" : "False")}
                    </span>
                  </div>

                  <VerticalConnector />

                  <NodeCard
                    node={child}
                    isSelected={selectedNodeId === child.id}
                    onClick={() => onSelectNode(child)}
                  />

                  {/* End dot */}
                  <div className="flex flex-col items-center mt-3">
                    <div className="w-px h-6 bg-border" />
                    <AddNodeButton />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

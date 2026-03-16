import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Mic,
  GitBranch,
  Database,
  List,
  AlertTriangle,
  MessageSquare,
  Play,
  Plus,
  Sparkles,
  Square,
  StickyNote,
  Search,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Shuffle,
  Send,
  Filter,
  ZoomIn,
  ZoomOut,
  CheckSquare,
} from "lucide-react";
import { motion } from "motion/react";

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

export interface WorkflowCanvasHandle {
  addBlock: (blockId: string) => void;
}

// Registry mapping block IDs from the sidebar to WorkflowNode visual properties
const BLOCK_NODE_MAP: Record<
  string,
  Omit<WorkflowNode, "id" | "status" | "children" | "branchLabels">
> = {
  "voice-input": {
    type: "trigger",
    icon: Mic,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    title: "Voice Input",
    category: "Voice",
    description: "Trigger on new voice memo.",
  },
  classify: {
    type: "action",
    icon: Sparkles,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    title: "Classify",
    category: "AI",
    description: "Classify voice context with AI.",
  },
  end: {
    type: "action",
    icon: Square,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    title: "End",
    category: "Core",
    description: "End the workflow.",
  },
  note: {
    type: "action",
    icon: StickyNote,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    title: "Note",
    category: "Core",
    description: "Add a note to the pipeline.",
  },
  "ai-enrich": {
    type: "action",
    icon: MessageSquare,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    title: "AI Enrich",
    category: "AI",
    description: "Enrich data with AI.",
  },
  "file-search": {
    type: "action",
    icon: Search,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    title: "File Search",
    category: "Tools",
    description: "Search files and documents.",
  },
  guardrails: {
    type: "condition",
    icon: ShieldCheck,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    title: "Guardrails",
    category: "Tools",
    description: "Apply safety guardrails.",
  },
  filter: {
    type: "condition",
    icon: Filter,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    title: "Filter",
    category: "Tools",
    description: "Filter data by condition.",
  },
  "if-else": {
    type: "branch",
    icon: GitBranch,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-100",
    title: "If / else",
    category: "Logic",
    description: "Branch based on condition.",
  },
  while: {
    type: "action",
    icon: RefreshCw,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-100",
    title: "While",
    category: "Logic",
    description: "Repeat while condition is true.",
  },
  approval: {
    type: "action",
    icon: UserCheck,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-100",
    title: "User Approval",
    category: "Logic",
    description: "Wait for user approval.",
  },
  transform: {
    type: "action",
    icon: Shuffle,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    title: "Transform",
    category: "Data",
    description: "Transform data shape.",
  },
  "set-state": {
    type: "action",
    icon: Database,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    title: "Set State",
    category: "Data",
    description: "Set workflow state variable.",
  },
  send: {
    type: "action",
    icon: Send,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    title: "Send Output",
    category: "Data",
    description: "Send output to destination.",
  },
};

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

// Map a live canvas node (from background.js) to a WorkflowNode for display
function mapLiveNode(liveNode: {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  status?: string;
}): WorkflowNode {
  const typeConfig: Record<
    string,
    { icon: React.ElementType; iconColor: string; iconBg: string }
  > = {
    trigger: { icon: Play, iconColor: "text-blue-600", iconBg: "bg-blue-100" },
    condition: {
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-100",
    },
    action: {
      icon: MessageSquare,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
    },
    branch: {
      icon: GitBranch,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100",
    },
    step: {
      icon: CheckSquare,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
  };
  const cfg = typeConfig[liveNode.type ?? "step"] ?? typeConfig.step;
  const rawStatus = liveNode.status ?? "pending";
  const status: WorkflowNode["status"] =
    rawStatus === "done" || rawStatus === "completed"
      ? "completed"
      : rawStatus === "running"
        ? "running"
        : "pending";

  return {
    id: liveNode.id,
    type:
      liveNode.type === "step"
        ? "action"
        : ((liveNode.type as WorkflowNode["type"]) ?? "action"),
    icon: cfg.icon,
    iconColor: cfg.iconColor,
    iconBg: cfg.iconBg,
    title: liveNode.title ?? "Step",
    category: liveNode.type ?? "Step",
    description: liveNode.description ?? "",
    status,
  };
}

interface WorkflowCanvasProps {
  onSelectNode: (node: WorkflowNode | null) => void;
  selectedNodeId: string | null;
  /** When true, shows the live workflow state from the extension instead of blueprint */
  showLive?: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

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
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      // Prevents pan from starting when clicking a node
      onMouseDown={(e) => e.stopPropagation()}
      data-node-card
      className={`relative bg-card rounded-2xl border-2 cursor-pointer transition-all hover:shadow-md group
        ${isStart ? "w-[200px]" : "w-[320px]"}
        ${
          isSelected
            ? "border-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.12)]"
            : "border-border hover:border-foreground/15"
        }`}
    >
      {!isStart && (
        <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-border bg-card" />
      )}
      <div className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-border bg-card group-hover:border-emerald-400 transition-colors" />

      <div
        className={`flex items-center gap-3 ${isStart ? "px-4 py-3.5" : "px-5 pt-4 pb-2"}`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${node.iconBg}`}
        >
          {isStart ? (
            <Play className={`w-4 h-4 ${node.iconColor}`} />
          ) : (
            <Icon className={`w-4 h-4 ${node.iconColor}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-foreground block truncate">{node.title}</span>
          {!isStart && (
            <span
              className="text-muted-foreground block truncate"
              style={{ fontSize: "13px" }}
            >
              {node.category}
            </span>
          )}
        </div>
      </div>

      {!isStart && (
        <div className="px-5 pb-3 flex items-center justify-between">
          <p
            className="text-muted-foreground truncate flex-1"
            style={{ fontSize: "13px" }}
          >
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
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseDown={(e) => e.stopPropagation()}
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
          <span
            className="px-2 py-0.5 bg-card border border-border rounded-md text-muted-foreground"
            style={{ fontSize: "11px" }}
          >
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

// ─── Main canvas component ────────────────────────────────────────────────────

export const WorkflowCanvas = forwardRef<
  WorkflowCanvasHandle,
  WorkflowCanvasProps
>(({ onSelectNode, selectedNodeId, showLive = false }, ref) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [liveNodes, setLiveNodes] = useState<WorkflowNode[]>([]);

  // Pan / zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Zoom via mouse wheel ──────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.25), 2.5));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Pan via mouse drag on background ─────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan when clicking on the background, not on node cards
    const target = e.target as HTMLElement;
    if (target.closest("[data-node-card]")) return;
    isPanning.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const stopPanning = useCallback(() => {
    isPanning.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  }, []);

  // ── Add block (called from sidebar click or drop) ─────────────────────────
  const addBlock = useCallback((blockId: string) => {
    const props = BLOCK_NODE_MAP[blockId];
    if (!props) return;

    setNodes((prev) => {
      const newNode: WorkflowNode = {
        ...props,
        id: `node_${Date.now()}`,
        status: "pending",
      };

      // Walk the linear chain to find insertion point (before first branch)
      const visited = new Set<string>();
      let current: string | undefined = prev[0]?.id;
      let lastLinearId: string | undefined;
      let branchNodeId: string | undefined;

      while (current) {
        const node = prev.find((n) => n.id === current);
        if (!node || visited.has(current)) break;
        visited.add(current);

        if (node.children && node.children.length > 1) {
          branchNodeId = node.id;
          break;
        } else if (node.children && node.children.length === 1) {
          lastLinearId = node.id;
          current = node.children[0];
        } else {
          lastLinearId = node.id;
          break;
        }
      }

      if (branchNodeId && lastLinearId) {
        // Insert between lastLinear → newNode → branchNode
        newNode.children = [branchNodeId];
        return [
          ...prev.map((n) =>
            n.id === lastLinearId ? { ...n, children: [newNode.id] } : n
          ),
          newNode,
        ];
      } else if (lastLinearId) {
        // Append to end of chain
        return [
          ...prev.map((n) =>
            n.id === lastLinearId ? { ...n, children: [newNode.id] } : n
          ),
          newNode,
        ];
      }

      return [...prev, newNode];
    });
  }, []);

  useImperativeHandle(ref, () => ({ addBlock }));

  // ── Drag & drop handlers ──────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the container entirely
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const blockId = e.dataTransfer.getData("text/plain");
    if (blockId) addBlock(blockId);
  };

  // ── Live canvas state sync from background.js ─────────────────────────────
  useEffect(() => {
    const isChromeExt =
      typeof chrome !== "undefined" && chrome.runtime?.id != null;
    if (!isChromeExt) return;

    // Request current state on mount
    chrome.runtime
      .sendMessage({ type: "GET_LIVE_CANVAS_STATE" })
      .then((resp: { state?: { workflows?: unknown[] } }) => {
        applyLiveState(resp?.state);
      })
      .catch(() => {});

    // Listen for real-time updates
    const listener = (message: {
      type?: string;
      state?: { workflows?: { id: string; nodes?: unknown[] }[] };
    }) => {
      if (message.type === "SYNC_CANVAS_STATE") {
        applyLiveState(message.state);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  function applyLiveState(state?: {
    currentWorkflowId?: string | null;
    workflows?: { id: string; nodes?: unknown[] }[];
  }) {
    if (!state?.workflows?.length) return;
    // Use the most recent workflow (last in array)
    const workflow = state.workflows[state.workflows.length - 1] as {
      nodes?: {
        id: string;
        type?: string;
        title?: string;
        description?: string;
        status?: string;
      }[];
    };
    if (!workflow?.nodes?.length) return;

    const mapped = workflow.nodes.map(mapLiveNode);
    // Build simple linear children chain for display
    for (let i = 0; i < mapped.length - 1; i++) {
      mapped[i].children = [mapped[i + 1].id];
    }
    setLiveNodes(mapped);
  }

  // ── Layout computation ────────────────────────────────────────────────────
  const displayNodes = showLive && liveNodes.length > 0 ? liveNodes : nodes;
  const nodeMap = Object.fromEntries(displayNodes.map((n) => [n.id, n]));

  // Walk first-child chain to build linear part
  const linearChain: string[] = [];
  {
    const visited = new Set<string>();
    let cur: string | undefined = displayNodes[0]?.id;
    while (cur && nodeMap[cur] && !visited.has(cur)) {
      visited.add(cur);
      linearChain.push(cur);
      const n = nodeMap[cur];
      cur =
        n.children && n.children.length === 1 ? n.children[0] : undefined;
    }
  }

  const lastLinearNode =
    linearChain.length > 0 ? nodeMap[linearChain[linearChain.length - 1]] : null;
  const hasBranches =
    lastLinearNode?.children && lastLinearNode.children.length > 1;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative select-none"
      style={{
        backgroundImage: "radial-gradient(circle, #d4d0ca 1px, transparent 1px)",
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        cursor: "grab",
        outline: isDragOver ? "2px solid rgba(52,211,153,0.35)" : "none",
        outlineOffset: "-2px",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPanning}
      onMouseLeave={stopPanning}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("[data-node-card]")) return;
        onSelectNode(null);
      }}
    >
      {/* Transformed canvas content */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            pointerEvents: "auto",
          }}
          className="flex flex-col items-center py-20"
        >
          {/* Live badge */}
          {showLive && liveNodes.length > 0 && (
            <div className="mb-6 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 flex items-center gap-1.5" style={{ fontSize: "12px" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live run
            </div>
          )}

          {/* Empty state hint while dragging */}
          {isDragOver && displayNodes.length === 0 && (
            <div className="text-muted-foreground" style={{ fontSize: "13px" }}>
              Drop here to add the first block
            </div>
          )}

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
          {hasBranches && lastLinearNode?.children && (
            <div className="flex flex-col items-center mt-0">
              <VerticalConnector />

              <div className="relative flex items-start gap-16">
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
                  style={{ width: "calc(100% - 80px)" }}
                />

                {lastLinearNode.children.map((childId, i) => {
                  const child = nodeMap[childId];
                  if (!child) return null;
                  return (
                    <div key={childId} className="flex flex-col items-center">
                      <div className="-mt-3 mb-2">
                        <span
                          className="px-2.5 py-1 bg-card border border-border rounded-lg text-muted-foreground"
                          style={{ fontSize: "12px" }}
                        >
                          {lastLinearNode.branchLabels?.[i] ??
                            (i === 0 ? "True" : "False")}
                        </span>
                      </div>

                      <VerticalConnector />

                      <NodeCard
                        node={child}
                        isSelected={selectedNodeId === child.id}
                        onClick={() => onSelectNode(child)}
                      />

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
      </div>

      {/* Drop overlay hint */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-end justify-center pb-20 pointer-events-none">
          <div className="bg-card border-2 border-dashed border-emerald-400 rounded-2xl px-6 py-3 text-emerald-600 shadow-sm" style={{ fontSize: "13px" }}>
            Drop to add block to pipeline
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-0.5 bg-card border border-border rounded-lg p-1 shadow-sm">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setZoom((z) => Math.min(z * 1.2, 2.5))}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="px-2 py-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground tabular-nums"
          style={{ fontSize: "11px", minWidth: "36px" }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setZoom((z) => Math.max(z * 0.8, 0.25))}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

WorkflowCanvas.displayName = "WorkflowCanvas";

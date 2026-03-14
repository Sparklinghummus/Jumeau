import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { WorkflowCanvas } from "../workflow-canvas";
import { DetailPanel } from "../detail-panel";
import { BuilderPanel } from "../builder-panel";
import type { WorkflowNode } from "../workflow-canvas";
import {
  GitBranch,
  Star,
  Share2,
  ChevronLeft,
  MoreHorizontal,
  Play,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function WorkflowsPage() {
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "runs">("editor");
  const [showBuilder, setShowBuilder] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="border-b border-border px-5 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/workflows")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground">Voice Capture Pipeline</span>
          <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded-md border border-border" style={{ fontSize: "12px" }}>
            Draft
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Center toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 mr-4">
            <button
              onClick={() => setActiveTab("editor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "editor"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontSize: "13px" }}
            >
              <Pencil className="w-3 h-3" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab("runs")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "runs"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontSize: "13px" }}
            >
              <Play className="w-3 h-3" />
              Runs
            </button>
          </div>

          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-all" style={{ fontSize: "13px" }}>
            Publish
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Builder panel toggle + panel */}
        <AnimatePresence mode="wait">
          {showBuilder && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 224, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden shrink-0"
            >
              <BuilderPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Canvas toolbar */}
          <div className="px-3 py-2 flex items-center gap-2 border-b border-border shrink-0">
            <button
              onClick={() => setShowBuilder(!showBuilder)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={showBuilder ? "Hide builder" : "Show builder"}
            >
              {showBuilder ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "13px" }}>
              <Mic className="w-3.5 h-3.5" />
              <span>6 blocks · 2 branches</span>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 cursor-pointer hover:text-amber-500 transition-colors" />
              <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <WorkflowCanvas
            onSelectNode={setSelectedNode}
            selectedNodeId={selectedNode?.id ?? null}
          />
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden shrink-0"
            >
              <DetailPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
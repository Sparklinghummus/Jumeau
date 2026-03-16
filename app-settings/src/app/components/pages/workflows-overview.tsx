import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  GitBranch,
  Mic,
  MessageSquare,
  Filter,
  Database,
  Sparkles,
  Clock,
  MoreHorizontal,
  Plus,
  Search,
  Play,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  FileText,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import {
  countWorkflowBranches,
  formatRelativeTime,
  readLiveCanvasState,
  subscribeToLiveCanvasState,
  type PersistedWorkflow,
} from "../../lib/live-workflows";

interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  status: "active" | "draft" | "paused";
  nodeCount: number;
  lastEdited: string;
  lastRun?: string;
  runCount: number;
  successRate?: number;
  tags: string[];
}

const workflows: WorkflowSummary[] = [
  {
    id: "voice-capture",
    name: "Voice Capture Pipeline",
    description: "Captures voice memos, classifies them, and routes to the appropriate skill or note tracker.",
    icon: Mic,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    status: "active",
    nodeCount: 6,
    lastEdited: "2 hours ago",
    lastRun: "30 min ago",
    runCount: 47,
    successRate: 94,
    tags: ["Voice", "AI"],
  },
  {
    id: "skill-enrichment",
    name: "Skill Enrichment",
    description: "Enriches captured skills with AI context, adds proficiency scoring, and updates the skill tracker.",
    icon: Sparkles,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    status: "active",
    nodeCount: 4,
    lastEdited: "1 day ago",
    lastRun: "3 hours ago",
    runCount: 23,
    successRate: 100,
    tags: ["AI", "Skills"],
  },
  {
    id: "context-summary",
    name: "Daily Context Summary",
    description: "Aggregates all captured context from the day and generates a structured summary.",
    icon: FileText,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    status: "active",
    nodeCount: 5,
    lastEdited: "3 days ago",
    lastRun: "Yesterday",
    runCount: 12,
    successRate: 92,
    tags: ["Summary", "Scheduled"],
  },
  {
    id: "team-sync",
    name: "Team Context Sync",
    description: "Shares relevant context updates with team members based on their roles and projects.",
    icon: Users,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    status: "draft",
    nodeCount: 3,
    lastEdited: "5 days ago",
    runCount: 0,
    tags: ["Team", "Sync"],
  },
  {
    id: "note-classifier",
    name: "Note Auto-Classifier",
    description: "Automatically categorizes and tags incoming notes using AI classification.",
    icon: MessageSquare,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-100",
    status: "paused",
    nodeCount: 4,
    lastEdited: "1 week ago",
    lastRun: "5 days ago",
    runCount: 31,
    successRate: 87,
    tags: ["Notes", "AI"],
  },
  {
    id: "voice-to-action",
    name: "Voice to Action Items",
    description: "Extracts action items from voice memos and creates trackable tasks automatically.",
    icon: Zap,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    status: "draft",
    nodeCount: 2,
    lastEdited: "2 weeks ago",
    runCount: 0,
    tags: ["Voice", "Tasks"],
  },
];

function StatusBadge({ status }: { status: WorkflowSummary["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200" style={{ fontSize: "12px" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border" style={{ fontSize: "12px" }}>
        <Circle className="w-3 h-3" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200" style={{ fontSize: "12px" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Paused
    </span>
  );
}

function getWorkflowVisual(workflow: PersistedWorkflow) {
  const hasVoiceTrigger = workflow.nodes.some((node) => node.type === "trigger" && node.category === "Voice");
  const hasAiAction = workflow.nodes.some((node) => node.category === "AI");
  const hasIntegration = workflow.nodes.some((node) => node.category === "Integrations");

  if (hasVoiceTrigger) {
    return { icon: Mic, iconColor: "text-blue-600", iconBg: "bg-blue-100", tags: ["Voice"] };
  }

  if (hasAiAction) {
    return { icon: Sparkles, iconColor: "text-amber-600", iconBg: "bg-amber-100", tags: ["AI"] };
  }

  if (hasIntegration) {
    return { icon: Zap, iconColor: "text-violet-600", iconBg: "bg-violet-100", tags: ["Integrations"] };
  }

  return { icon: GitBranch, iconColor: "text-emerald-600", iconBg: "bg-emerald-100", tags: ["Workflow"] };
}

function toWorkflowSummary(workflow: PersistedWorkflow): WorkflowSummary {
  const visual = getWorkflowVisual(workflow);
  const hasRunningNode = workflow.nodes.some((node) => node.status === "running");
  const status: WorkflowSummary["status"] =
    workflow.status === "archived" ? "paused" : workflow.status === "published" || hasRunningNode ? "active" : "draft";

  const dynamicTags = Array.from(
    new Set([
      ...visual.tags,
      ...workflow.nodes
        .map((node) => node.category)
        .filter((category) => category === "AI" || category === "Voice" || category === "Integrations"),
    ]),
  ).slice(0, 3);

  return {
    id: workflow.id,
    name: workflow.title,
    description: workflow.summary || workflow.goal || "Workflow captured from the sidepanel.",
    icon: visual.icon,
    iconColor: visual.iconColor,
    iconBg: visual.iconBg,
    status,
    nodeCount: workflow.nodes.length,
    lastEdited: formatRelativeTime(workflow.updatedAt),
    lastRun: hasRunningNode ? "now" : undefined,
    runCount: countWorkflowBranches(workflow),
    successRate: undefined,
    tags: dynamicTags.length ? dynamicTags : ["Workflow"],
  };
}

export function WorkflowsOverview() {
  const navigate = useNavigate();
  const [liveWorkflows, setLiveWorkflows] = useState<PersistedWorkflow[]>([]);

  useEffect(() => {
    let isMounted = true;

    readLiveCanvasState().then((state) => {
      if (isMounted) {
        setLiveWorkflows(state.workflows);
      }
    });

    const unsubscribe = subscribeToLiveCanvasState((state) => {
      setLiveWorkflows(state.workflows);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const workflowItems = liveWorkflows.length ? liveWorkflows.map(toWorkflowSummary) : workflows;

  const activeCount = workflowItems.filter((w) => w.status === "active").length;
  const totalRuns = workflowItems.reduce((sum, w) => sum + w.runCount, 0);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 pt-12 pb-16">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-foreground mb-1">Workflows</h1>
              <p className="text-muted-foreground">
                {workflowItems.length} workflows · {activeCount} active · {totalRuns} total runs
              </p>
            </div>
            <button
              onClick={() => navigate("/workflows/new")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              New workflow
            </button>
          </div>

          {/* Search & filter bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-card border border-border rounded-xl">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search workflows..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center bg-secondary rounded-xl p-0.5">
              <button className="px-3 py-1.5 rounded-lg bg-card text-foreground shadow-sm" style={{ fontSize: "13px" }}>
                All
              </button>
              <button className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>
                Active
              </button>
              <button className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>
                Drafts
              </button>
            </div>
          </div>

          {/* Workflow cards */}
          <div className="flex flex-col gap-3">
            {workflowItems.map((wf, i) => (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/workflows/${wf.id}`)}
                className="bg-card border border-border rounded-2xl p-5 hover:border-foreground/12 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${wf.iconBg}`}>
                    <wf.icon className={`w-5 h-5 ${wf.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-foreground truncate">{wf.name}</span>
                      <StatusBadge status={wf.status} />
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-1" style={{ fontSize: "14px" }}>
                      {wf.description}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "13px" }}>
                        <GitBranch className="w-3.5 h-3.5" />
                        {wf.nodeCount} blocks
                      </span>
                      {wf.runCount > 0 && (
                        <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "13px" }}>
                          <Play className="w-3.5 h-3.5" />
                          {wf.runCount} runs
                        </span>
                      )}
                      {wf.successRate !== undefined && (
                        <span className="flex items-center gap-1.5 text-emerald-600" style={{ fontSize: "13px" }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {wf.successRate}%
                        </span>
                      )}
                      {wf.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-secondary text-muted-foreground rounded-md border border-border"
                          style={{ fontSize: "12px" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "12px" }}>
                      <Clock className="w-3 h-3" />
                      {wf.lastEdited}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

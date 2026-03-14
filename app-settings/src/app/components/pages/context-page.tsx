import { useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Brain,
  GitBranch,
  StickyNote,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Code2,
  Users,
  Target,
  Layers,
  MessageSquare,
  ArrowUpRight,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { motion } from "motion/react";

/* ── Mock data representing "what we know about you" ── */

const radarData = [
  { subject: "Frontend", value: 92 },
  { subject: "Backend", value: 68 },
  { subject: "Architecture", value: 74 },
  { subject: "Leadership", value: 60 },
  { subject: "DevOps", value: 52 },
  { subject: "Communication", value: 78 },
];

interface ContextNode {
  id: string;
  label: string;
  type: "skill" | "topic" | "tool" | "trait";
  strength: number; // 0-100
  x: number; // percent
  y: number; // percent
  connections: string[];
}

const contextNodes: ContextNode[] = [
  { id: "react", label: "React", type: "skill", strength: 92, x: 42, y: 28, connections: ["typescript", "frontend", "system-design"] },
  { id: "typescript", label: "TypeScript", type: "skill", strength: 88, x: 60, y: 22, connections: ["react", "nodejs", "graphql"] },
  { id: "nodejs", label: "Node.js", type: "skill", strength: 75, x: 72, y: 40, connections: ["typescript", "graphql", "docker"] },
  { id: "graphql", label: "GraphQL", type: "tool", strength: 62, x: 80, y: 26, connections: ["nodejs", "typescript"] },
  { id: "frontend", label: "Frontend Dev", type: "topic", strength: 90, x: 28, y: 42, connections: ["react", "system-design"] },
  { id: "system-design", label: "System Design", type: "topic", strength: 72, x: 38, y: 58, connections: ["react", "frontend", "leadership"] },
  { id: "docker", label: "Docker", type: "tool", strength: 55, x: 68, y: 60, connections: ["nodejs", "devops"] },
  { id: "devops", label: "DevOps", type: "topic", strength: 50, x: 78, y: 72, connections: ["docker"] },
  { id: "leadership", label: "Leadership", type: "trait", strength: 65, x: 22, y: 68, connections: ["system-design", "communication"] },
  { id: "communication", label: "Communication", type: "trait", strength: 78, x: 35, y: 78, connections: ["leadership"] },
  { id: "sprint-planning", label: "Sprint Planning", type: "topic", strength: 70, x: 52, y: 72, connections: ["leadership", "system-design"] },
];

const typeColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  skill: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "#3b82f6" },
  topic: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "#10b981" },
  tool: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "#f59e0b" },
  trait: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700", dot: "#8b5cf6" },
};

const workingTraits = [
  { label: "Deep Focus Builder", description: "You prefer long, uninterrupted coding sessions. Most captures happen in 2-3 hour blocks.", icon: Target },
  { label: "Visual Thinker", description: "You frequently reference diagrams and system flows. Architecture notes dominate your captures.", icon: Layers },
  { label: "Async Communicator", description: "Notes suggest a strong preference for written over verbal communication in team settings.", icon: MessageSquare },
  { label: "Iterative Learner", description: "Skills updates show a pattern of revisiting and deepening knowledge rather than breadth-first.", icon: TrendingUp },
];

const topInsights = [
  { text: "React and TypeScript are your dominant skill pair — 34 captures reference them together.", time: "Updated 2h ago" },
  { text: "System Design has been your fastest growing area — 3 new notes this week.", time: "Updated 5h ago" },
  { text: "Your workflows mostly handle voice-to-context pipelines — consider adding team sync workflows.", time: "Updated 1d ago" },
  { text: "You haven't captured any DevOps context in 3 weeks — skill may need a refresh.", time: "Updated 2d ago" },
];

const stats = [
  { label: "Total Captures", value: "127", change: "+12 this week", icon: Brain, color: "text-blue-600", bg: "bg-blue-100" },
  { label: "Skills Tracked", value: "14", change: "+2 this month", icon: Sparkles, color: "text-violet-600", bg: "bg-violet-100" },
  { label: "Workflows", value: "6", change: "3 active", icon: GitBranch, color: "text-emerald-600", bg: "bg-emerald-100" },
  { label: "Notes", value: "43", change: "+5 this week", icon: StickyNote, color: "text-amber-600", bg: "bg-amber-100" },
];

/* ── Components ── */

function ContextGraph({ hoveredNode, onHover }: { hoveredNode: string | null; onHover: (id: string | null) => void }) {
  const nodeMap = Object.fromEntries(contextNodes.map((n) => [n.id, n]));

  // Pre-compute unique edges
  const edges: { from: ContextNode; to: ContextNode; key: string }[] = [];
  const seenEdges = new Set<string>();
  for (const node of contextNodes) {
    for (const targetId of node.connections) {
      const edgeKey = [node.id, targetId].sort().join("-");
      if (!seenEdges.has(edgeKey) && nodeMap[targetId]) {
        seenEdges.add(edgeKey);
        edges.push({ from: node, to: nodeMap[targetId], key: edgeKey });
      }
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* SVG connections */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {edges.map(({ from, to, key }) => {
          const isHighlighted =
            hoveredNode === from.id || hoveredNode === to.id;

          return (
            <line
              key={key}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke={isHighlighted ? "#a3a3a3" : "#e5e2dd"}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeDasharray={isHighlighted ? "none" : "4 4"}
              style={{ transition: "all 0.2s" }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {contextNodes.map((node, i) => {
        const colors = typeColors[node.type];
        const isHovered = hoveredNode === node.id;
        const isConnected = hoveredNode
          ? nodeMap[hoveredNode]?.connections.includes(node.id)
          : false;
        const isFaded = hoveredNode !== null && !isHovered && !isConnected;

        const size = 8 + (node.strength / 100) * 16; // 8-24px radius

        return (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: isFaded ? 0.3 : 1, scale: 1 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="absolute flex flex-col items-center gap-1 cursor-pointer"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: isHovered ? 10 : 1,
            }}
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(null)}
          >
            <div
              className={`rounded-full border-2 transition-all ${isHovered ? "shadow-lg scale-110" : ""}`}
              style={{
                width: size,
                height: size,
                backgroundColor: colors.dot,
                borderColor: isHovered ? colors.dot : "transparent",
                opacity: 0.85,
              }}
            />
            <span
              className={`whitespace-nowrap px-1.5 py-0.5 rounded-md transition-all ${
                isHovered
                  ? `${colors.bg} ${colors.text} ${colors.border} border`
                  : "text-muted-foreground"
              }`}
              style={{ fontSize: "12px" }}
            >
              {node.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

export function ContextPage() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 rounded-2xl bg-foreground text-background flex items-center justify-center">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-foreground">Your Context Graph</h1>
                    <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
                      Everything Jumo knows about how you work
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground" style={{ fontSize: "13px" }}>
                  Last synced 2 min ago
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-card border border-border rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="text-foreground mb-0.5" style={{ fontSize: "24px" }}>
                  {stat.value}
                </div>
                <span className="text-muted-foreground" style={{ fontSize: "13px" }}>
                  {stat.label}
                </span>
                <div className="mt-1">
                  <span className="text-emerald-600" style={{ fontSize: "12px" }}>
                    {stat.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Main content: Graph + Radar */}
          <div className="grid grid-cols-5 gap-6 mb-8">
            {/* Context Graph */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="col-span-3 bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-foreground">Context Map</span>
                  <p className="text-muted-foreground mt-0.5" style={{ fontSize: "13px" }}>
                    How your skills, topics, and tools connect
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {Object.entries(typeColors).map(([type, colors]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.dot }} />
                      <span className="text-muted-foreground capitalize" style={{ fontSize: "12px" }}>
                        {type}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="relative rounded-xl overflow-hidden"
                style={{
                  height: 360,
                  backgroundImage: "radial-gradient(circle, #e5e2dd 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <ContextGraph hoveredNode={hoveredNode} onHover={setHoveredNode} />
              </div>
            </motion.div>

            {/* Radar chart */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="col-span-2 bg-card border border-border rounded-2xl p-5"
            >
              <div className="mb-2">
                <span className="text-foreground">Skill Radar</span>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "13px" }}>
                  Your proficiency landscape
                </p>
              </div>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="70%">
                    <PolarGrid stroke="#e5e2dd" gridType="circle" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#9c9488", fontSize: 12 }}
                    />
                    <Radar
                      name="proficiency"
                      dataKey="value"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "12px" }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Current proficiency
                </span>
              </div>
            </motion.div>
          </div>

          {/* Working traits + Insights */}
          <div className="grid grid-cols-2 gap-6">
            {/* Working Style */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-foreground">Working Style</span>
              </div>
              <div className="flex flex-col gap-3">
                {workingTraits.map((trait, i) => (
                  <motion.div
                    key={trait.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <trait.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-foreground block" style={{ fontSize: "14px" }}>
                        {trait.label}
                      </span>
                      <span className="text-muted-foreground" style={{ fontSize: "13px" }}>
                        {trait.description}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Insights */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-foreground">Latest Insights</span>
              </div>
              <div className="flex flex-col gap-2">
                {topInsights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    <div className="flex-1">
                      <span className="text-foreground block" style={{ fontSize: "14px" }}>
                        {insight.text}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1 mt-1" style={{ fontSize: "12px" }}>
                        <Clock className="w-3 h-3" />
                        {insight.time}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
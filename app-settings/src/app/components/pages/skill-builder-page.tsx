import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  Plus,
  GripVertical,
  X,
  Sparkles,
  GitBranch,
  StickyNote,
  Mic,
  Send,
  Layers,
  Code2,
  Brain,
  MessageSquare,
  Zap,
  FileText,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Pencil,
  ArrowRight,
  Shield,
  Star,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";

/* ── Available context blocks (your workflows, notes, skills) ── */

interface ContextBlock {
  id: string;
  type: "workflow" | "skill" | "note" | "instruction";
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  content?: string;
}

const availableWorkflows: ContextBlock[] = [
  {
    id: "wf-voice-capture",
    type: "workflow",
    name: "Voice Capture Pipeline",
    description: "Captures voice memos, classifies, and routes to skills or notes",
    icon: Mic,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    content: "When receiving voice input, transcribe the audio, classify the content into categories (skill, note, action item, question), and route to the appropriate handler. Apply context enrichment using previous captures.",
  },
  {
    id: "wf-skill-enrichment",
    type: "workflow",
    name: "Skill Enrichment",
    description: "Enriches skills with AI context and proficiency scoring",
    icon: Sparkles,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    content: "Take a raw skill mention, enrich it with context from previous captures, estimate proficiency level based on frequency and depth of mentions, and update the skill tracker.",
  },
  {
    id: "wf-context-summary",
    type: "workflow",
    name: "Daily Context Summary",
    description: "Aggregates daily context into structured summaries",
    icon: FileText,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    content: "At end of day, aggregate all captured context, group by topic and project, generate a structured summary with key decisions, learnings, and action items.",
  },
  {
    id: "wf-note-classifier",
    type: "workflow",
    name: "Note Auto-Classifier",
    description: "Auto-categorizes and tags incoming notes",
    icon: MessageSquare,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-100",
    content: "When a new note is created, analyze its content, assign relevant tags, determine the project/topic category, and link to related existing notes.",
  },
];

const availableSkills: ContextBlock[] = [
  {
    id: "sk-react",
    type: "skill",
    name: "React — 90%",
    description: "Frontend framework expertise including hooks, context, and patterns",
    icon: Code2,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    content: "Expert-level React developer. Proficient with hooks (useState, useEffect, useCallback, useMemo, useRef), Context API, custom hooks, component composition patterns, render optimization, and React Router. Prefers functional components.",
  },
  {
    id: "sk-typescript",
    type: "skill",
    name: "TypeScript — 85%",
    description: "Strong typing, generics, utility types, and type-safe patterns",
    icon: Code2,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    content: "Advanced TypeScript user. Comfortable with generics, conditional types, mapped types, utility types (Partial, Required, Pick, Omit), discriminated unions, and type guards. Prefers strict mode.",
  },
  {
    id: "sk-system-design",
    type: "skill",
    name: "System Design — 70%",
    description: "Architecture patterns, scalability, and technical decision-making",
    icon: Layers,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
    content: "Solid system design knowledge. Familiar with microservices, event-driven architecture, API design, caching strategies, and database selection. Growing in distributed systems.",
  },
  {
    id: "sk-leadership",
    type: "skill",
    name: "Leadership — 65%",
    description: "Team coordination, mentoring, and sprint planning",
    icon: Users,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-100",
    content: "Developing leadership skills. Experience with sprint planning, code reviews as mentoring opportunities, and cross-team coordination. Prefers async communication.",
  },
];

const availableNotes: ContextBlock[] = [
  {
    id: "nt-sprint-prefs",
    type: "note",
    name: "Sprint Planning Preferences",
    description: "How I like to structure and run sprint planning sessions",
    icon: StickyNote,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    content: "I prefer 2-week sprints. Stories should be broken down to max 3 story points. Always start planning with a quick retro of last sprint's velocity. Use t-shirt sizing for initial estimation, then refine to points.",
  },
  {
    id: "nt-code-review",
    type: "note",
    name: "Code Review Philosophy",
    description: "My approach to reviewing and receiving code reviews",
    icon: StickyNote,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    content: "Focus on architecture and patterns over style (use linters for that). Ask questions instead of making demands. Approve with minor comments rather than blocking. Review within 4 hours of PR submission.",
  },
  {
    id: "nt-debugging",
    type: "note",
    name: "Debugging Strategy",
    description: "My systematic approach to debugging complex issues",
    icon: StickyNote,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    content: "1. Reproduce consistently. 2. Isolate the layer (UI, state, API, DB). 3. Binary search through recent changes. 4. Add targeted logging, never shotgun debug. 5. Write a test that catches the bug before fixing.",
  },
];

const providers = [
  { id: "claude", name: "Claude", icon: "✦", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "gpt", name: "ChatGPT", icon: "◆", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "gemini", name: "Gemini", icon: "◈", color: "bg-blue-100 text-blue-700 border-blue-200" },
];

/* ── Stacked block component ── */

function StackedBlock({
  block,
  onRemove,
  isExpanded,
  onToggle,
}: {
  block: ContextBlock;
  onRemove: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const typeBadge = {
    workflow: { label: "Workflow", class: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    skill: { label: "Skill", class: "bg-blue-50 text-blue-600 border-blue-200" },
    note: { label: "Note", class: "bg-amber-50 text-amber-600 border-amber-200" },
    instruction: { label: "Instruction", class: "bg-violet-50 text-violet-600 border-violet-200" },
  }[block.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden group"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab shrink-0" />
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${block.iconBg}`}>
          <block.icon className={`w-4 h-4 ${block.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-foreground block truncate" style={{ fontSize: "14px" }}>
            {block.name}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-md border shrink-0 ${typeBadge.class}`} style={{ fontSize: "11px" }}>
          {typeBadge.label}
        </span>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <AnimatePresence>
        {isExpanded && block.content && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 ml-[52px]">
              <p className="text-muted-foreground" style={{ fontSize: "13px" }}>
                {block.content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Source picker section ── */

function SourceSection({
  title,
  icon: Icon,
  items,
  isOpen,
  onToggle,
  onAdd,
  addedIds,
}: {
  title: string;
  icon: React.ElementType;
  items: ContextBlock[];
  isOpen: boolean;
  onToggle: () => void;
  onAdd: (block: ContextBlock) => void;
  addedIds: Set<string>;
}) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-foreground flex-1" style={{ fontSize: "14px" }}>
          {title}
        </span>
        <span className="text-muted-foreground" style={{ fontSize: "12px" }}>
          {items.length}
        </span>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 px-1 pb-2">
              {items.map((item) => {
                const isAdded = addedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => !isAdded && onAdd(item)}
                    disabled={isAdded}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                      isAdded
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-secondary cursor-pointer"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${item.iconBg}`}>
                      <item.icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground block truncate" style={{ fontSize: "13px" }}>
                        {item.name}
                      </span>
                      <span className="text-muted-foreground block truncate" style={{ fontSize: "12px" }}>
                        {item.description}
                      </span>
                    </div>
                    {isAdded ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Page ── */

export function SkillBuilderPage() {
  const navigate = useNavigate();
  const [stack, setStack] = useState<ContextBlock[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState({ workflows: true, skills: false, notes: false });
  const [skillName, setSkillName] = useState("");
  const [skillDescription, setSkillDescription] = useState("");
  const [customInstruction, setCustomInstruction] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("claude");
  const [viewMode, setViewMode] = useState<"build" | "preview">("build");
  const [showSent, setShowSent] = useState(false);

  const addedIds = new Set(stack.map((b) => b.id));

  const addBlock = useCallback((block: ContextBlock) => {
    setStack((prev) => [...prev, block]);
  }, []);

  const removeBlock = useCallback((id: string) => {
    setStack((prev) => prev.filter((b) => b.id !== id));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addCustomInstruction = () => {
    if (!customInstruction.trim()) return;
    const block: ContextBlock = {
      id: `inst-${Date.now()}`,
      type: "instruction",
      name: "Custom Instruction",
      description: customInstruction.slice(0, 60) + (customInstruction.length > 60 ? "..." : ""),
      icon: Zap,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-100",
      content: customInstruction,
    };
    setStack((prev) => [...prev, block]);
    setCustomInstruction("");
  };

  const generatedPrompt = [
    skillName && `# ${skillName}`,
    skillDescription && `\n${skillDescription}`,
    "\n## Context & Capabilities\n",
    ...stack.map((block, i) => {
      const prefix = { workflow: "Workflow", skill: "Skill", note: "Note", instruction: "Instruction" }[block.type];
      return `### ${i + 1}. [${prefix}] ${block.name}\n${block.content || block.description}\n`;
    }),
  ]
    .filter(Boolean)
    .join("\n");

  const handleSend = () => {
    setShowSent(true);
    setTimeout(() => setShowSent(false), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="border-b border-border px-5 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/skills")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground" style={{ fontSize: "14px" }}>
            Skills
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground" style={{ fontSize: "14px" }}>
            Skill Builder
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Build / Preview toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("build")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === "build" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              style={{ fontSize: "13px" }}
            >
              <Layers className="w-3.5 h-3.5" />
              Build
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === "preview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              style={{ fontSize: "13px" }}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={stack.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-background hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Send to AI
          </button>
        </div>
      </div>

      {/* Sent toast */}
      <AnimatePresence>
        {showSent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span style={{ fontSize: "14px" }}>Skill sent to {providers.find((p) => p.id === selectedProvider)?.name}!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Context sources */}
        {viewMode === "build" && (
          <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-72 border-r border-border bg-card flex flex-col h-full shrink-0 overflow-auto"
          >
            <div className="px-4 pt-4 pb-2">
              <span className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "11px" }}>
                Context Sources
              </span>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>
                Click to add blocks to your skill stack
              </p>
            </div>

            <div className="px-2 flex-1">
              <SourceSection
                title="Workflows"
                icon={GitBranch}
                items={availableWorkflows}
                isOpen={openSections.workflows}
                onToggle={() => setOpenSections((p) => ({ ...p, workflows: !p.workflows }))}
                onAdd={addBlock}
                addedIds={addedIds}
              />
              <SourceSection
                title="Skills"
                icon={Sparkles}
                items={availableSkills}
                isOpen={openSections.skills}
                onToggle={() => setOpenSections((p) => ({ ...p, skills: !p.skills }))}
                onAdd={addBlock}
                addedIds={addedIds}
              />
              <SourceSection
                title="Notes"
                icon={StickyNote}
                items={availableNotes}
                isOpen={openSections.notes}
                onToggle={() => setOpenSections((p) => ({ ...p, notes: !p.notes }))}
                onAdd={addBlock}
                addedIds={addedIds}
              />
            </div>

            {/* Custom instruction input */}
            <div className="border-t border-border p-3">
              <span className="text-muted-foreground block mb-2" style={{ fontSize: "12px" }}>
                Add custom instruction
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomInstruction()}
                  placeholder="e.g. Always respond in bullet points..."
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/20 transition-colors"
                  style={{ fontSize: "13px" }}
                />
                <button
                  onClick={addCustomInstruction}
                  disabled={!customInstruction.trim()}
                  className="px-2.5 py-2 bg-secondary rounded-lg text-foreground hover:bg-accent transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}

        {/* Center: Stack / Preview */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-6 pt-8 pb-16">
            {viewMode === "build" ? (
              <>
                {/* Skill name & description */}
                <div className="mb-8">
                  <input
                    type="text"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    placeholder="Name your AI skill..."
                    className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/60 mb-2"
                    style={{ fontSize: "28px" }}
                  />
                  <input
                    type="text"
                    value={skillDescription}
                    onChange={(e) => setSkillDescription(e.target.value)}
                    placeholder="Describe what this skill does..."
                    className="w-full bg-transparent text-muted-foreground outline-none placeholder:text-muted-foreground/40"
                    style={{ fontSize: "15px" }}
                  />
                </div>

                {/* Provider selector */}
                <div className="mb-6">
                  <span className="text-muted-foreground block mb-2.5" style={{ fontSize: "12px" }}>
                    TARGET PROVIDER
                  </span>
                  <div className="flex items-center gap-2">
                    {providers.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProvider(p.id)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all ${
                          selectedProvider === p.id
                            ? p.color + " border"
                            : "bg-card border-border text-muted-foreground hover:border-foreground/15"
                        }`}
                        style={{ fontSize: "13px" }}
                      >
                        <span style={{ fontSize: "16px" }}>{p.icon}</span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stack */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-muted-foreground" style={{ fontSize: "12px" }}>
                      SKILL STACK · {stack.length} {stack.length === 1 ? "block" : "blocks"}
                    </span>
                    {stack.length > 0 && (
                      <button
                        onClick={() => {
                          setStack([]);
                          setExpandedIds(new Set());
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        style={{ fontSize: "12px" }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {stack.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center text-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                        <Layers className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <span className="text-foreground mb-1" style={{ fontSize: "15px" }}>
                        Start building your skill
                      </span>
                      <p className="text-muted-foreground max-w-xs" style={{ fontSize: "13px" }}>
                        Add workflows, skills, and notes from the left panel to compose a context-rich AI skill
                      </p>
                      <div className="flex items-center gap-4 mt-6">
                        <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "12px" }}>
                          <GitBranch className="w-3.5 h-3.5" /> Workflows
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "12px" }}>
                          <Sparkles className="w-3.5 h-3.5" /> Skills
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "12px" }}>
                          <StickyNote className="w-3.5 h-3.5" /> Notes
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <div className="flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: "12px" }}>
                          <Send className="w-3.5 h-3.5" /> AI
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <Reorder.Group
                      axis="y"
                      values={stack}
                      onReorder={setStack}
                      className="flex flex-col gap-2"
                    >
                      <AnimatePresence mode="popLayout">
                        {stack.map((block) => (
                          <Reorder.Item key={block.id} value={block}>
                            <StackedBlock
                              block={block}
                              onRemove={() => removeBlock(block.id)}
                              isExpanded={expandedIds.has(block.id)}
                              onToggle={() => toggleExpanded(block.id)}
                            />
                          </Reorder.Item>
                        ))}
                      </AnimatePresence>
                    </Reorder.Group>
                  )}
                </div>

                {/* Stats */}
                {stack.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground" style={{ fontSize: "12px" }}>Workflows</span>
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md" style={{ fontSize: "12px" }}>
                          {stack.filter((b) => b.type === "workflow").length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground" style={{ fontSize: "12px" }}>Skills</span>
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md" style={{ fontSize: "12px" }}>
                          {stack.filter((b) => b.type === "skill").length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground" style={{ fontSize: "12px" }}>Notes</span>
                        <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-md" style={{ fontSize: "12px" }}>
                          {stack.filter((b) => b.type === "note").length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground" style={{ fontSize: "12px" }}>Instructions</span>
                        <span className="px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-md" style={{ fontSize: "12px" }}>
                          {stack.filter((b) => b.type === "instruction").length}
                        </span>
                      </div>
                    </div>
                    <span className="text-muted-foreground" style={{ fontSize: "12px" }}>
                      ~{generatedPrompt.length.toLocaleString()} chars
                    </span>
                  </motion.div>
                )}
              </>
            ) : (
              /* Preview mode */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "11px" }}>
                      Generated Prompt Preview
                    </span>
                    <p className="text-muted-foreground mt-1" style={{ fontSize: "13px" }}>
                      This is what will be sent to {providers.find((p) => p.id === selectedProvider)?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    style={{ fontSize: "13px" }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>

                {stack.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
                      Add blocks to your skill stack to see the generated prompt
                    </p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <pre className="whitespace-pre-wrap text-foreground" style={{ fontSize: "14px", fontFamily: "inherit", lineHeight: 1.7 }}>
                      {generatedPrompt}
                    </pre>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

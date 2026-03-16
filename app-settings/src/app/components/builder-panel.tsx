import {
  Mic,
  Sparkles,
  Square,
  StickyNote,
  Search,
  ShieldCheck,
  GitBranch,
  RefreshCw,
  UserCheck,
  Shuffle,
  Database,
  MessageSquare,
  Filter,
  Send,
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

interface BuilderBlock {
  id: string;
  icon: React.ElementType;
  label: string;
  iconColor: string;
  iconBg: string;
}

interface BuilderCategory {
  label: string;
  blocks: BuilderBlock[];
}

const categories: BuilderCategory[] = [
  {
    label: "Core",
    blocks: [
      { id: "voice-input", icon: Mic, label: "Voice Input", iconColor: "text-blue-600", iconBg: "bg-blue-100" },
      { id: "classify", icon: Sparkles, label: "Classify", iconColor: "text-amber-600", iconBg: "bg-amber-100" },
      { id: "end", icon: Square, label: "End", iconColor: "text-emerald-600", iconBg: "bg-emerald-100" },
      { id: "note", icon: StickyNote, label: "Note", iconColor: "text-violet-600", iconBg: "bg-violet-100" },
    ],
  },
  {
    label: "Tools",
    blocks: [
      { id: "ai-enrich", icon: MessageSquare, label: "AI Enrich", iconColor: "text-emerald-600", iconBg: "bg-emerald-100" },
      { id: "file-search", icon: Search, label: "File Search", iconColor: "text-amber-600", iconBg: "bg-amber-100" },
      { id: "guardrails", icon: ShieldCheck, label: "Guardrails", iconColor: "text-amber-600", iconBg: "bg-amber-100" },
      { id: "filter", icon: Filter, label: "Filter", iconColor: "text-blue-600", iconBg: "bg-blue-100" },
    ],
  },
  {
    label: "Logic",
    blocks: [
      { id: "if-else", icon: GitBranch, label: "If / else", iconColor: "text-rose-500", iconBg: "bg-rose-100" },
      { id: "while", icon: RefreshCw, label: "While", iconColor: "text-rose-500", iconBg: "bg-rose-100" },
      { id: "approval", icon: UserCheck, label: "User approval", iconColor: "text-rose-500", iconBg: "bg-rose-100" },
    ],
  },
  {
    label: "Data",
    blocks: [
      { id: "transform", icon: Shuffle, label: "Transform", iconColor: "text-violet-600", iconBg: "bg-violet-100" },
      { id: "set-state", icon: Database, label: "Set state", iconColor: "text-violet-600", iconBg: "bg-violet-100" },
      { id: "send", icon: Send, label: "Send output", iconColor: "text-violet-600", iconBg: "bg-violet-100" },
    ],
  },
  {
    label: "Integrations",
    blocks: [
      { id: "gmail", icon: Mail, label: "Gmail", iconColor: "text-red-600", iconBg: "bg-red-100" },
      { id: "google-sheets", icon: Sheet, label: "Google Sheets", iconColor: "text-emerald-600", iconBg: "bg-emerald-100" },
      { id: "slack", icon: Slack, label: "Slack", iconColor: "text-fuchsia-600", iconBg: "bg-fuchsia-100" },
      { id: "notion", icon: NotebookPen, label: "Notion", iconColor: "text-slate-700", iconBg: "bg-slate-100" },
      { id: "google-drive", icon: FolderOpen, label: "Google Drive", iconColor: "text-blue-600", iconBg: "bg-blue-100" },
      { id: "calendar", icon: Calendar, label: "Calendar", iconColor: "text-orange-600", iconBg: "bg-orange-100" },
      { id: "airtable", icon: Table2, label: "Airtable", iconColor: "text-cyan-600", iconBg: "bg-cyan-100" },
      { id: "amazon-s3", icon: Cloud, label: "Amazon S3", iconColor: "text-amber-700", iconBg: "bg-amber-100" },
    ],
  },
];

interface BuilderPanelProps {
  onAddBlock?: (block: BuilderBlock) => void;
}

export function BuilderPanel({ onAddBlock }: BuilderPanelProps) {
  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col h-full shrink-0 overflow-auto">
      <div className="px-4 pt-4 pb-2">
        <span className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "11px" }}>
          Builder blocks
        </span>
      </div>

      <div className="flex flex-col px-2 pb-4">
        {categories.map((category, catIdx) => (
          <div key={category.label} className="mb-1">
            <div className="px-2 pt-4 pb-1.5">
              <span className="text-muted-foreground" style={{ fontSize: "12px" }}>
                {category.label}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              {category.blocks.map((block, blockIdx) => (
                <motion.button
                  key={block.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: catIdx * 0.06 + blockIdx * 0.03 }}
                  onClick={() => onAddBlock?.(block)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-secondary transition-colors text-left group"
                  draggable
                  onDragStart={(e) => {
                    // @ts-ignore
                    e.dataTransfer?.setData("text/plain", block.id);
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${block.iconBg} transition-transform group-hover:scale-105`}>
                    <block.icon className={`w-4 h-4 ${block.iconColor}`} />
                  </div>
                  <span className="text-foreground" style={{ fontSize: "14px" }}>
                    {block.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

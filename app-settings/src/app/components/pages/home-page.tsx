import { useNavigate } from "react-router";
import { GitBranch, StickyNote, Sparkles, Mic, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const quickActions = [
  {
    icon: GitBranch,
    label: "Workflows",
    desc: "Map out your processes",
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    to: "/workflows",
  },
  {
    icon: StickyNote,
    label: "Notes",
    desc: "Capture quick thoughts",
    color: "text-amber-600",
    bg: "bg-amber-100",
    to: "/notes",
  },
  {
    icon: Sparkles,
    label: "Skills",
    desc: "Track your expertise",
    color: "text-violet-600",
    bg: "bg-violet-100",
    to: "/skills",
  },
];

const recentActivity = [
  { id: "1", text: "Updated Voice Capture Pipeline workflow", time: "2 hours ago", icon: GitBranch },
  { id: "2", text: "Added note about sprint planning preferences", time: "5 hours ago", icon: StickyNote },
  { id: "3", text: "React skill updated to 90%", time: "1 day ago", icon: Sparkles },
  { id: "4", text: "Created new code review workflow", time: "2 days ago", icon: GitBranch },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 pt-16 pb-12">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="text-foreground mb-2">Good afternoon 👋</h1>
            <p className="text-muted-foreground">
              What would you like to capture today?
            </p>
          </motion.div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => navigate(action.to)}
                className="bg-card border border-border rounded-2xl p-5 text-left hover:border-foreground/15 hover:shadow-sm transition-all group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${action.bg}`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <h4 className="text-foreground mb-0.5">{action.label}</h4>
                <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
                  {action.desc}
                </p>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>

          {/* Recent activity */}
          <div>
            <span className="text-muted-foreground uppercase tracking-wider mb-4 block" style={{ fontSize: "12px" }}>
              Recent activity
            </span>
            <div className="flex flex-col gap-1">
              {recentActivity.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-card hover:border hover:border-border border border-transparent transition-all cursor-pointer"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground flex-1">{item.text}</span>
                  <span className="text-muted-foreground shrink-0" style={{ fontSize: "13px" }}>
                    {item.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

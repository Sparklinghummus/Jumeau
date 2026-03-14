import { useState } from "react";
import { useNavigate } from "react-router";
import { VoiceRecorder } from "../voice-recorder";
import {
  Star,
  TrendingUp,
  Clock,
  Sparkles,
  Send,
  Layers,
  ArrowRight,
  Plus,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
  lastUpdated: string;
}

const initialSkills: Skill[] = [
  { id: "1", name: "React", level: 90, category: "Frontend", lastUpdated: "2 days ago" },
  { id: "2", name: "TypeScript", level: 85, category: "Languages", lastUpdated: "1 week ago" },
  { id: "3", name: "Node.js", level: 75, category: "Backend", lastUpdated: "3 days ago" },
  { id: "4", name: "System Design", level: 70, category: "Architecture", lastUpdated: "5 days ago" },
  { id: "5", name: "GraphQL", level: 60, category: "APIs", lastUpdated: "2 weeks ago" },
  { id: "6", name: "Docker", level: 55, category: "DevOps", lastUpdated: "1 month ago" },
];

export function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const navigate = useNavigate();

  const handleTranscript = (text: string) => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: "New Skill",
      level: 50,
      category: "Uncategorized",
      lastUpdated: "just now",
    };
    setSkills((prev) => [newSkill, ...prev]);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top bar */}
      <div className="border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-foreground">
          <Sparkles className="w-4 h-4" />
          <span>Skills</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1>Skills</h1>
              <p className="text-muted-foreground mt-1">
                Track your expertise and growth areas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <VoiceRecorder onTranscript={handleTranscript} />
            </div>
          </div>

          {/* Build AI Skill CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-violet-50 via-blue-50 to-amber-50 border border-violet-200/50 rounded-2xl p-5 cursor-pointer group hover:shadow-sm transition-all"
            onClick={() => navigate("/skills/builder")}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-foreground" style={{ fontSize: "16px" }}>
                    Build an AI Skill
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-violet-100 text-violet-600 border border-violet-200" style={{ fontSize: "11px" }}>
                    New
                  </span>
                </div>
                <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
                  Combine your workflows, skills, and notes into a stackable skill package — then send it to Claude, GPT, or Gemini
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex -space-x-1">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center" style={{ fontSize: "10px" }}>✦</span>
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center" style={{ fontSize: "10px" }}>◆</span>
                  <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center" style={{ fontSize: "10px" }}>◈</span>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill, i) => (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 hover:border-foreground/15 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3>{skill.name}</h3>
                    <span className="text-muted-foreground" style={{ fontSize: "13px" }}>
                      {skill.category}
                    </span>
                  </div>
                  <Star className="w-4 h-4 text-amber-400" />
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1" style={{ fontSize: "13px" }}>
                      <TrendingUp className="w-3.5 h-3.5" /> Proficiency
                    </span>
                    <span style={{ fontSize: "13px" }}>{skill.level}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.level}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground" style={{ fontSize: "13px" }}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{skill.lastUpdated}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

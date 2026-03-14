import { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Loader2,
  FileText,
  Trash2,
  Search,
  List,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Note {
  id: string;
  text: string;
  source: "voice" | "text";
  timestamp: string;
}

const initialNotes: Note[] = [
  {
    id: "1",
    text: "I'm proficient in React, TypeScript, and Node.js. I've been working with these technologies for about 5 years now.",
    source: "voice",
    timestamp: "Mar 12, 2026 · 2:30 PM",
  },
  {
    id: "2",
    text: "My workflow for code reviews involves checking architecture first, then logic, then style. I always leave constructive feedback.",
    source: "voice",
    timestamp: "Mar 11, 2026 · 10:15 AM",
  },
  {
    id: "3",
    text: "For project planning, I prefer breaking things down into two-week sprints with clear deliverables.",
    source: "voice",
    timestamp: "Mar 10, 2026 · 4:45 PM",
  },
  {
    id: "4",
    text: "Key strength: translating complex technical concepts into simple explanations for non-technical stakeholders.",
    source: "text",
    timestamp: "Mar 9, 2026 · 9:00 AM",
  },
];

const mockTranscripts = [
  "I'm proficient in React, TypeScript, and Node.js. I've been working with these technologies for about 5 years now.",
  "My workflow for code reviews involves checking architecture first, then logic, then style.",
  "For project planning, I prefer breaking things down into two-week sprints with clear deliverables.",
  "I like to document my thought process using voice notes - it helps me think through complex problems.",
];

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      setDuration(0);
      intervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      setTimeout(() => {
        const text = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
        const newNote: Note = {
          id: Date.now().toString(),
          text,
          source: "voice",
          timestamp:
            new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) +
            " · " +
            new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
        };
        setNotes((prev) => [newNote, ...prev]);
        setIsProcessing(false);
        setDuration(0);
      }, 1500);
    } else {
      setIsRecording(true);
    }
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 pt-16 pb-12">
          {/* Heading */}
          <h2 className="text-center text-foreground mb-8">
            For quick thoughts you want to come back to
          </h2>

          {/* Voice input bar */}
          <div className="bg-card rounded-2xl border border-border shadow-sm px-5 py-4 mb-12">
            <div className="flex items-center justify-between">
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-foreground">
                      Recording... {formatTime(duration)}
                    </span>
                  </motion.div>
                ) : isProcessing ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 text-muted-foreground"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing your note...</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-muted-foreground"
                  >
                    Take a quick note with your voice
                  </motion.span>
                )}
              </AnimatePresence>

              <button
                onClick={handleMicClick}
                disabled={isProcessing}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  isRecording
                    ? "bg-red-500 text-white"
                    : isProcessing
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                {isRecording && (
                  <motion.span
                    className="absolute w-10 h-10 rounded-full bg-red-500/30"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Recents header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: "12px" }}>
              Recents
            </span>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <List className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div className="flex flex-col gap-1">
            <AnimatePresence mode="popLayout">
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group flex items-start gap-3 px-3 py-3 rounded-xl hover:bg-card hover:border hover:border-border border border-transparent transition-all cursor-pointer"
                >
                  <div className="mt-0.5 shrink-0">
                    {note.source === "voice" ? (
                      <Mic className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground line-clamp-2">{note.text}</p>
                    <span className="text-muted-foreground mt-1 block" style={{ fontSize: "13px" }}>
                      {note.timestamp}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {notes.length === 0 && (
              <p className="text-muted-foreground py-8 text-center">
                No notes found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

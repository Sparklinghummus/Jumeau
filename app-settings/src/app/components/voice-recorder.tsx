import { useState, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
}

export function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      setDuration(0);
      intervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
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

  const mockTranscripts = [
    "I'm proficient in React, TypeScript, and Node.js. I've been working with these technologies for about 5 years now.",
    "My workflow for code reviews involves checking architecture first, then logic, then style. I always leave constructive feedback.",
    "For project planning, I prefer breaking things down into two-week sprints with clear deliverables.",
    "I like to document my thought process using voice notes - it helps me think through complex problems.",
  ];

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      setTimeout(() => {
        const randomTranscript =
          mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
        onTranscript(randomTranscript);
        setIsProcessing(false);
        setDuration(0);
      }, 1500);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleToggleRecording}
        disabled={isProcessing}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? "bg-destructive text-destructive-foreground"
            : isProcessing
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {isRecording && (
          <motion.span
            className="absolute inset-0 rounded-full bg-destructive/30"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <Square className="w-4 h-4" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-muted-foreground tabular-nums">
              {formatTime(duration)}
            </span>
          </motion.div>
        )}
        {isProcessing && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-muted-foreground"
          >
            Processing...
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

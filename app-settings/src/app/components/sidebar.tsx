import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import {
  Home,
  GitBranch,
  StickyNote,
  Sparkles,
  Settings,
  HelpCircle,
  Users,
  Mic,
  Brain,
} from "lucide-react";

declare const chrome: any;

const navItems = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/context", icon: Brain, label: "Context", end: false },
  { to: "/workflows", icon: GitBranch, label: "Workflows", end: false },
  { to: "/skills", icon: Sparkles, label: "Skills", end: false },
  { to: "/notes", icon: StickyNote, label: "Notes", end: false },
];

export function Sidebar() {
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "GET_AUDIO_STATE" }, (response: any) => {
        if (response) setIsRecording(response.isRecording);
      });
      const listener = (message: any) => {
        if (message.type === "UPDATE_PILL_STATE") {
          setIsRecording(message.isActive ?? false);
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => chrome.runtime.onMessage.removeListener(listener);
    }
  }, []);

  const handleToggleRecording = () => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "TOGGLE_AUDIO" }, (response: any) => {
        if (response) setIsRecording(response.isRecording);
      });
    }
  };

  const handleSettings = () => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    }
  };

  return (
    <aside className="w-52 bg-background flex flex-col h-full shrink-0 border-r border-border">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <div className="w-1.5 h-5 bg-foreground rounded-sm" />
            <div className="w-1.5 h-3.5 bg-foreground rounded-sm" />
            <div className="w-1.5 h-5 bg-foreground rounded-sm" />
          </div>
          <span className="text-foreground"><span className="font-bold">Jumo</span></span>
          <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded" style={{ fontSize: "11px" }}>
            Pro
          </span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="px-3 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Team card */}
      <div className="mx-3 mb-4 p-3.5 bg-secondary rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-foreground" style={{ fontSize: "14px" }}>
            Build your context 🚀
          </span>
          <span className="text-muted-foreground cursor-pointer" style={{ fontSize: "14px" }}>—</span>
        </div>
        <p className="text-muted-foreground mb-3" style={{ fontSize: "13px" }}>
          Capture skills, workflows, and notes with your voice.
        </p>
        <button
          onClick={handleToggleRecording}
          className={`px-3 py-1.5 border rounded-lg transition-colors ${isRecording ? "border-red-400 bg-red-50 text-red-600" : "border-border bg-card text-foreground hover:bg-accent"}`}
          style={{ fontSize: "13px" }}
        >
          {isRecording ? "Stop recording" : "Start recording"}
        </button>
      </div>

      {/* Bottom links */}
      <div className="px-3 pb-4 flex flex-col gap-0.5">
        <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-left">
          <Users className="w-[18px] h-[18px]" />
          <span>Invite your team</span>
        </button>
        <button onClick={handleSettings} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-left">
          <Settings className="w-[18px] h-[18px]" />
          <span>Settings</span>
        </button>
        <button className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors text-left">
          <HelpCircle className="w-[18px] h-[18px]" />
          <span>Help</span>
        </button>
      </div>
    </aside>
  );
}
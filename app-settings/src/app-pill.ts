const PILL_HOST_ID = "jumeau-app-pill-root";
const HALO_ID = "jumeau-app-halo";
const HALO_STYLE_ID = "jumeau-app-halo-styles";

declare const chrome: any;

type RuntimeResponse = {
  isRecording?: boolean;
  isMuted?: boolean;
  error?: string;
};

function getChromeRuntime() {
  if (typeof chrome === "undefined" || !chrome.runtime?.id) {
    return null;
  }

  return chrome.runtime;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || target.isContentEditable;
}

function ensureHalo() {
  let halo = document.getElementById(HALO_ID);
  if (!halo) {
    if (!document.getElementById(HALO_STYLE_ID)) {
      const style = document.createElement("style");
      style.id = HALO_STYLE_ID;
      style.textContent = `
        @keyframes jumeauHaloPulse {
          0%, 100% {
            opacity: 0.55;
            box-shadow:
              0 0 0 1px rgba(168, 85, 247, 0.72),
              0 0 12px rgba(168, 85, 247, 0.22),
              0 0 28px rgba(139, 92, 246, 0.14);
          }

          50% {
            opacity: 0.95;
            box-shadow:
              0 0 0 1px rgba(196, 181, 253, 0.95),
              0 0 18px rgba(168, 85, 247, 0.34),
              0 0 42px rgba(139, 92, 246, 0.22);
          }
        }

        #${HALO_ID} {
          position: fixed;
          inset: 0;
          z-index: 2147483640;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        #${HALO_ID}.active {
          opacity: 1;
        }

        #${HALO_ID}::before {
          content: "";
          position: absolute;
          inset: 0;
          box-sizing: border-box;
          border: 2px solid rgba(168, 85, 247, 0.88);
          animation: jumeauHaloPulse 1.6s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }

    halo = document.createElement("div");
    halo.id = HALO_ID;
    document.body.appendChild(halo);
  }

  return halo;
}

function setHaloActive(isActive: boolean) {
  const halo = ensureHalo();
  halo.classList.toggle("active", isActive);
}

function mountAppPill() {
  const mountNode = document.getElementById(PILL_HOST_ID);
  if (!mountNode || mountNode.shadowRoot) {
    return;
  }

  const shadow = mountNode.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    .jumeau-container {
      position: fixed;
      left: 50%;
      bottom: 8px;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 2147483647;
      pointer-events: none;
    }

    .jumeau-tooltip {
      margin-top: 10px;
      color: #888888;
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      letter-spacing: 0.5px;
      opacity: 0;
      transition: opacity 0.3s;
      text-align: center;
      pointer-events: none;
    }

    .jumeau-container:hover .jumeau-tooltip {
      opacity: 1;
    }

    .jumeau-pill {
      background: rgba(30, 30, 30, 0.65);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(0, 0, 0, 0.5);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      height: 10px;
      min-width: 48px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      box-sizing: border-box;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
      -webkit-tap-highlight-color: transparent;
    }

    .jumeau-pill:hover,
    .jumeau-pill.active {
      height: 24px;
      min-width: 56px;
      background: rgba(40, 40, 40, 0.85);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    .jumeau-pill.active {
      background: rgba(80, 40, 140, 0.7);
      border: 1px solid rgba(180, 100, 255, 0.4);
      box-shadow:
        0 0 15px rgba(168, 85, 247, 0.4),
        0 4px 12px rgba(0, 0, 0, 0.2),
        inset 0 0 8px rgba(168, 85, 247, 0.3);
    }

    .jumeau-pill.active.muted {
      background: rgba(180, 80, 20, 0.7);
      border: 1px solid rgba(255, 120, 40, 0.4);
      box-shadow:
        0 0 15px rgba(249, 115, 22, 0.4),
        0 4px 12px rgba(0, 0, 0, 0.2),
        inset 0 0 8px rgba(249, 115, 22, 0.3);
    }

    .jumeau-pill.disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .voice-bars {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: scaleY(0.5);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .jumeau-pill:hover .voice-bars,
    .jumeau-pill.active .voice-bars {
      opacity: 1;
      transform: scaleY(1);
    }

    .bar {
      width: 3px;
      height: 3px;
      border-radius: 4px;
      background-color: rgba(255, 255, 255, 0.6);
      transition: height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.3s ease;
    }

    .jumeau-pill.active .bar {
      background-color: #d8b4fe;
      box-shadow: 0 0 4px rgba(216, 180, 254, 0.8);
      animation: bounce 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
    }

    .jumeau-pill.active.muted .bar {
      background-color: #fdba74;
      box-shadow: 0 0 4px rgba(253, 186, 116, 0.8);
      animation: none;
    }

    .jumeau-pill:hover:not(.active) .bar:nth-child(1),
    .jumeau-pill.active.muted .bar:nth-child(1) { height: 6px; }
    .jumeau-pill:hover:not(.active) .bar:nth-child(2),
    .jumeau-pill.active.muted .bar:nth-child(2) { height: 12px; }
    .jumeau-pill:hover:not(.active) .bar:nth-child(3),
    .jumeau-pill.active.muted .bar:nth-child(3) { height: 16px; }
    .jumeau-pill:hover:not(.active) .bar:nth-child(4),
    .jumeau-pill.active.muted .bar:nth-child(4) { height: 10px; }
    .jumeau-pill:hover:not(.active) .bar:nth-child(5),
    .jumeau-pill.active.muted .bar:nth-child(5) { height: 5px; }

    .jumeau-pill.active .bar:nth-child(1) { animation-delay: 0s; }
    .jumeau-pill.active .bar:nth-child(2) { animation-delay: 0.15s; }
    .jumeau-pill.active .bar:nth-child(3) { animation-delay: 0.3s; }
    .jumeau-pill.active .bar:nth-child(4) { animation-delay: 0.1s; }
    .jumeau-pill.active .bar:nth-child(5) { animation-delay: 0.25s; }

    @keyframes bounce {
      0% { height: 4px; }
      50% { height: 18px; }
      100% { height: 8px; }
    }
  `;

  const container = document.createElement("div");
  container.className = "jumeau-container";

  const pill = document.createElement("button");
  pill.type = "button";
  pill.className = "jumeau-pill";
  pill.setAttribute("aria-label", "Parler avec Gemini");
  pill.innerHTML = `
    <div class="voice-bars">
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
      <div class="bar"></div>
    </div>
  `;

  const tooltip = document.createElement("div");
  tooltip.className = "jumeau-tooltip";
  tooltip.textContent = "Option + Espace pour parler avec Gemini";

  container.appendChild(pill);
  container.appendChild(tooltip);
  shadow.appendChild(style);
  shadow.appendChild(container);

  const runtime = getChromeRuntime();
  let isConnecting = false;
  let isRuntimeInvalidated = false;
  let isUnavailable = false;

  const setPillState = (isActive: boolean, isMuted = false) => {
    pill.classList.toggle("active", isActive);
    pill.classList.toggle("muted", isActive && isMuted);
    setHaloActive(isActive);

    if (isActive) {
      tooltip.textContent = isMuted
        ? "Micro coupe. Appuyez sur M pour reactiver"
        : "Option + Espace pour arreter";
    } else {
      tooltip.textContent = isUnavailable
        ? "Disponible uniquement dans l extension Jumeau"
        : isRuntimeInvalidated
          ? "Rechargez la page pour reactiver Jumeau"
          : "Option + Espace pour parler avec Gemini";
    }
  };

  const disablePill = (message: string) => {
    isRuntimeInvalidated = true;
    isConnecting = false;
    pill.classList.add("disabled");
    pill.disabled = true;
    pill.title = message;
    tooltip.textContent = message;
    setPillState(false);
  };

  const sendRuntimeMessage = (
    message: Record<string, unknown>,
    callback: (response?: RuntimeResponse) => void,
  ) => {
    const activeRuntime = getChromeRuntime();
    if (!activeRuntime) {
      isUnavailable = true;
      disablePill("Disponible uniquement dans l extension Jumeau");
      return;
    }

    try {
      activeRuntime.sendMessage(message, callback);
    } catch (error) {
      const details = String(error ?? "");
      if (details.includes("Extension context invalidated")) {
        disablePill("Extension rechargee. Rechargez cette page.");
        return;
      }

      throw error;
    }
  };

  const toggleAudio = () => {
    if (isConnecting || isRuntimeInvalidated) {
      return;
    }

    isConnecting = true;
    sendRuntimeMessage({ type: "TOGGLE_AUDIO" }, (response) => {
      isConnecting = false;

      if (chrome.runtime.lastError) {
        const message = chrome.runtime.lastError.message || "Erreur de connexion";
        if (message.includes("Extension context invalidated")) {
          disablePill("Extension rechargee. Rechargez cette page.");
        } else {
          pill.title = message;
        }
        return;
      }

      if (!response) {
        return;
      }

      setPillState(Boolean(response.isRecording), Boolean(response.isMuted));
      pill.title = !response.isRecording && response.error ? response.error : "";
    });
  };

  if (runtime) {
    pill.addEventListener("click", toggleAudio);

    document.addEventListener("keydown", (event) => {
      if (event.altKey && event.code === "Space" && !isTypingTarget(event.target)) {
        event.preventDefault();
        toggleAudio();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (isTypingTarget(event.target) || (event.key !== "m" && event.key !== "M")) {
        return;
      }

      sendRuntimeMessage({ type: "TOGGLE_MUTE" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          return;
        }

        setPillState(pill.classList.contains("active"), Boolean(response.isMuted));
      });
    });

    const listener = (message: { type?: string; isActive?: boolean }) => {
      if (message.type === "UPDATE_PILL_STATE") {
        setPillState(Boolean(message.isActive));
      }
    };

    runtime.onMessage.addListener(listener);
    window.addEventListener("unload", () => runtime.onMessage.removeListener(listener), { once: true });

    sendRuntimeMessage({ type: "GET_AUDIO_STATE" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        return;
      }

      setPillState(Boolean(response.isRecording), Boolean(response.isMuted));
    });
  } else {
    isUnavailable = true;
    disablePill("Disponible uniquement dans l extension Jumeau");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAppPill, { once: true });
} else {
  mountAppPill();
}

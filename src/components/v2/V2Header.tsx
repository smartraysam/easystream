import React from "react";
import {
  Music,
  BookOpen,
  CheckCheck,
  Tv,
  ExternalLink,
  Settings,
} from "lucide-react";
import { AppState, LiveState } from "../../types";

interface V2HeaderProps {
  activeTab: "scripture" | "lyrics";
  isConnected: boolean;
  sessionId: string;
  state: AppState;
  liveFeedback: boolean;
  lyricSaveFeedback: string | null;
  showTypographyModal: boolean;
  onUpdateLiveState: (update: Partial<LiveState>) => void;
  onOpenDisplay: () => void;
  onOpenSettings: () => void;
}

export const V2Header: React.FC<V2HeaderProps> = ({
  activeTab,
  isConnected,
  sessionId,
  state,
  liveFeedback,
  lyricSaveFeedback,
  showTypographyModal,
  onUpdateLiveState,
  onOpenDisplay,
  onOpenSettings,
}) => {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        background: "rgba(15, 23, 42, 0.95)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        flexShrink: 0,
        zIndex: 30,
        gap: "14px",
      }}
    >
      {/* Left: Branding & Session */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background:
                activeTab === "lyrics"
                  ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                  : "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                activeTab === "lyrics"
                  ? "0 0 16px rgba(139, 92, 246, 0.4)"
                  : "0 0 16px rgba(14, 165, 233, 0.4)",
              transition: "all 0.2s ease",
            }}
          >
            {activeTab === "lyrics" ? (
              <Music size={18} color="#ffffff" />
            ) : (
              <BookOpen size={18} color="#ffffff" />
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              EasyStream{" "}
              <span
                style={{
                  color: activeTab === "lyrics" ? "#a78bfa" : "#38bdf8",
                }}
              >
                V2
              </span>
            </div>
            <div
              style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}
            >
              {activeTab === "lyrics"
                ? "Worship Lyrics Presenter"
                : "Scripture & Countdown Presenter"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 10px",
            background: "rgba(255, 255, 255, 0.04)",
            borderRadius: "999px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            fontSize: "11px",
            color: "#94a3b8",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: isConnected ? "#10b981" : "#ef4444",
              boxShadow: isConnected ? "0 0 8px #10b981" : "none",
            }}
          />
          <span>
            Session: <strong>{sessionId}</strong>
          </span>
        </div>
      </div>

      {/* Right Actions: Display Screen & Studio Switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {liveFeedback && (
          <span
            style={{
              fontSize: "12px",
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 700,
            }}
          >
            <CheckCheck size={16} /> Sent Live!
          </span>
        )}
        {lyricSaveFeedback && (
          <span
            style={{
              fontSize: "12px",
              color: "#c084fc",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: 700,
            }}
          >
            <CheckCheck size={16} /> {lyricSaveFeedback}
          </span>
        )}

        {/* Clear Text & Blackout Toggles & Typography Settings */}
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={() =>
              onUpdateLiveState({ isClearText: !state.liveState.isClearText })
            }
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              background: state.liveState.isClearText
                ? "#f59e0b"
                : "rgba(255, 255, 255, 0.06)",
              color: state.liveState.isClearText ? "#000000" : "#cbd5e1",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="Clear scripture text from display (keeps background)"
          >
            Clear Text
          </button>
          <button
            onClick={() =>
              onUpdateLiveState({ isBlackout: !state.liveState.isBlackout })
            }
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              background: state.liveState.isBlackout
                ? "#ef4444"
                : "rgba(255, 255, 255, 0.06)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            title="Blackout entire display screen"
          >
            Blackout
          </button>
        </div>

        {/* Quick Display Screen Launcher */}
        <button
          onClick={onOpenDisplay}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            padding: "6px 12px",
            borderRadius: "8px",
            background: "rgba(56, 189, 248, 0.15)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            color: "#38bdf8",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          title="Launch Fullscreen Display Window on Projector"
        >
          <Tv size={14} />
          <span>Display</span>
          <ExternalLink size={12} style={{ opacity: 0.7 }} />
        </button>

        {/* Subtle separator */}
        <div
          style={{
            width: "1px",
            height: "20px",
            background: "rgba(255, 255, 255, 0.12)",
            margin: "0 2px",
          }}
        />

        {/* General Settings (Scripture & Lyrics Formatting) Button */}
        <button
          id="v2-general-settings-button"
          onClick={onOpenSettings}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            padding: "6px 12px",
            borderRadius: "8px",
            background: showTypographyModal
              ? "rgba(56, 189, 248, 0.25)"
              : "rgba(255, 255, 255, 0.08)",
            border: showTypographyModal
              ? "1.5px solid #38bdf8"
              : "1px solid rgba(255, 255, 255, 0.18)",
            color: showTypographyModal ? "#38bdf8" : "#f1f5f9",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: showTypographyModal
              ? "0 0 12px rgba(56, 189, 248, 0.35)"
              : "none",
          }}
          title="General Settings: Scripture & Lyrics formatting, fonts, colors, and layout"
          aria-label="General Settings"
        >
          <Settings size={14} color="#38bdf8" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};


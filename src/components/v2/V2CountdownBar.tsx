import React from "react";
import { Play, Pause, RotateCcw, Minus, Plus } from "lucide-react";
import { AppState, TimerState } from "../../types";
import { TIMER_PRESETS } from "./types";

interface V2CountdownBarProps {
  state: AppState;
  currentTimerSec: number;
  formattedCountdown: string;
  isOvertime: boolean;
  isWarning: boolean;
  isCritical: boolean;
  onStartOrPauseTimer: () => void;
  onResetTimer: () => void;
  adjustTimer: (deltaSec: number) => void;
  setTimerConfig: (config: Partial<TimerState>) => void;
  customTimerMinutes: string;
  setCustomTimerMinutes: (val: string) => void;
  customTimerSeconds: string;
  setCustomTimerSeconds: (val: string) => void;
  timerTitleInput: string;
  setTimerTitleInput: (val: string) => void;
  onApplyCustomTimer: () => void;
  onSelectPreset: (sec: number, label: string) => void;
  toggleShowOnDisplay: () => void;
  quickAlertInput: string;
  setQuickAlertInput: (val: string) => void;
  isAlertActive: boolean;
  onSendPromptMessage: () => void;
  onClearPromptMessage: () => void;
}

export const V2CountdownBar: React.FC<V2CountdownBarProps> = ({
  state,
  formattedCountdown,
  isOvertime,
  isWarning,
  isCritical,
  onStartOrPauseTimer,
  onResetTimer,
  adjustTimer,
  setTimerConfig,
  customTimerMinutes,
  setCustomTimerMinutes,
  customTimerSeconds,
  setCustomTimerSeconds,
  timerTitleInput,
  setTimerTitleInput,
  onApplyCustomTimer,
  onSelectPreset,
  toggleShowOnDisplay,
  quickAlertInput,
  setQuickAlertInput,
  isAlertActive,
  onSendPromptMessage,
  onClearPromptMessage,
}) => {
  return (
    <section
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 20px",
        background: "linear-gradient(90deg, #0b1120 0%, #0f172a 100%)",
        borderBottom: "1px solid rgba(56, 189, 248, 0.15)",
        flexShrink: 0,
        gap: "14px",
        flexWrap: "wrap",
      }}
    >
      {/* Left: Timer Display & Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "rgba(0, 0, 0, 0.4)",
            padding: "3px 12px",
            borderRadius: "8px",
            border: `1.5px solid ${
              isOvertime
                ? "#ef4444"
                : isCritical
                  ? "#f97316"
                  : isWarning
                    ? "#f59e0b"
                    : "#38bdf8"
            }`,
            boxShadow: `0 0 14px ${
              isOvertime ? "rgba(239, 68, 68, 0.3)" : "rgba(56, 189, 248, 0.2)"
            }`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                color: "#94a3b8",
                textTransform: "uppercase",
              }}
            >
              COUNTDOWN
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 800,
                padding: "1px 5px",
                borderRadius: "4px",
                background:
                  state.timerState.status === "running"
                    ? "rgba(16, 185, 129, 0.2)"
                    : state.timerState.status === "paused"
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(100, 116, 139, 0.2)",
                color:
                  state.timerState.status === "running"
                    ? "#34d399"
                    : state.timerState.status === "paused"
                      ? "#fbbf24"
                      : "#94a3b8",
              }}
            >
              {state.timerState.status.toUpperCase()}
            </span>
          </div>
          <div
            style={{
              fontFamily: "Montserrat, monospace",
              fontSize: "26px",
              fontWeight: 900,
              color: isOvertime
                ? "#ef4444"
                : isCritical
                  ? "#f97316"
                  : isWarning
                    ? "#f59e0b"
                    : "#38bdf8",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formattedCountdown}
          </div>
        </div>

        {/* Transport Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={onStartOrPauseTimer}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              background:
                state.timerState.status === "running"
                  ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "12px",
              border: "none",
              cursor: "pointer",
              boxShadow:
                state.timerState.status === "running"
                  ? "0 0 12px rgba(245, 158, 11, 0.4)"
                  : "0 0 12px rgba(16, 185, 129, 0.4)",
            }}
          >
            {state.timerState.status === "running" ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}
            <span>
              {state.timerState.status === "running" ? "Pause" : "Start"}
            </span>
          </button>

          <button
            onClick={onResetTimer}
            style={{
              padding: "7px 10px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#cbd5e1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
            }}
            title="Reset countdown to duration"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {/* +1m, -1m, +5m quick adjustments */}
          <div style={{ display: "flex", gap: "4px", marginLeft: "4px" }}>
            <button
              onClick={() => adjustTimer(-60)}
              style={{
                padding: "5px 8px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94a3b8",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Subtract 1 minute"
            >
              -1m
            </button>
            <button
              onClick={() => adjustTimer(60)}
              style={{
                padding: "5px 8px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94a3b8",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Add 1 minute"
            >
              +1m
            </button>
            <button
              onClick={() => adjustTimer(300)}
              style={{
                padding: "5px 8px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#94a3b8",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
              title="Add 5 minutes"
            >
              +5m
            </button>
          </div>
        </div>
      </div>

      {/* Center: Presets & Custom Duration Input */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
          PRESETS:
        </span>
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {TIMER_PRESETS.map((p) => (
            <button
              key={p.sec}
              onClick={() => onSelectPreset(p.sec, p.label)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e2e8f0",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom MM:SS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(0, 0, 0, 0.3)",
            padding: "3px 8px",
            borderRadius: "6px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <input
            type="number"
            min="0"
            max="180"
            value={customTimerMinutes}
            onChange={(e) => setCustomTimerMinutes(e.target.value)}
            style={{
              width: "36px",
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              textAlign: "center",
              outline: "none",
            }}
            title="Minutes"
          />
          <span style={{ color: "#64748b", fontWeight: 800 }}>:</span>
          <input
            type="number"
            min="0"
            max="59"
            value={customTimerSeconds}
            onChange={(e) => setCustomTimerSeconds(e.target.value)}
            style={{
              width: "32px",
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              textAlign: "center",
              outline: "none",
            }}
            title="Seconds"
          />
          <input
            type="text"
            placeholder="Label"
            value={timerTitleInput}
            onChange={(e) => setTimerTitleInput(e.target.value)}
            style={{
              width: "110px",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              padding: "3px 6px",
              fontSize: "11px",
              color: "#ffffff",
              outline: "none",
            }}
            title="Countdown label / slot name"
          />
          <button
            onClick={onApplyCustomTimer}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              background: "#38bdf8",
              color: "#000000",
              fontSize: "11px",
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
            }}
          >
            Set
          </button>
        </div>
      </div>

      {/* Right: Display Sync Toggle, Timer Scale & Prompt Message */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Inline Timer Font Size Control */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "rgba(0, 0, 0, 0.35)",
            padding: "3px 8px",
            borderRadius: "6px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          title="Scale the countdown timer font size on the live display screen"
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: "#94a3b8",
              textTransform: "uppercase",
            }}
          >
            Size:
          </span>
          <button
            onClick={() => {
              const cur = state.timerState.fontSizeScale || 100;
              const next = Math.max(50, cur - 10);
              setTimerConfig({ fontSizeScale: next });
            }}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "4px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Decrease timer font size (-10%)"
          >
            <Minus size={11} />
          </button>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "#38bdf8",
              minWidth: "38px",
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {state.timerState.fontSizeScale || 100}%
          </span>
          <button
            onClick={() => {
              const cur = state.timerState.fontSizeScale || 100;
              const next = Math.min(250, cur + 10);
              setTimerConfig({ fontSizeScale: next });
            }}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "4px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Increase timer font size (+10%)"
          >
            <Plus size={11} />
          </button>
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 700,
            color: state.timerState.showOnDisplay ? "#38bdf8" : "#94a3b8",
          }}
          title="When active, the countdown timer appears on the top of DisplayView screen"
        >
          <input
            type="checkbox"
            checked={Boolean(state.timerState.showOnDisplay)}
            onChange={toggleShowOnDisplay}
            style={{ accentColor: "#38bdf8", cursor: "pointer" }}
          />
          <span>Show on Display</span>
        </label>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input
            type="text"
            placeholder="Live prompt (e.g. Wrap up)"
            value={quickAlertInput}
            onChange={(e) => setQuickAlertInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSendPromptMessage();
            }}
            style={{
              width: "150px",
              background: "rgba(0, 0, 0, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "11px",
              color: "#ffffff",
              outline: "none",
            }}
          />
          <button
            onClick={
              isAlertActive ? onClearPromptMessage : onSendPromptMessage
            }
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              background: isAlertActive
                ? "#ef4444"
                : "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              border: "none",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isAlertActive ? "Clear" : "Send"}
          </button>
        </div>
      </div>
    </section>
  );
};


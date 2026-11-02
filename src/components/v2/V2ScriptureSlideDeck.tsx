import React from "react";
import {
  Type,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { AppState, PresentationTheme } from "../../types";
import { FONT_FAMILIES, OnlineScriptureResult } from "./types";

interface V2ScriptureSlideDeckProps {
  scriptureResult: OnlineScriptureResult | null;
  searchQuery: string;
  selectedVersion: string;
  generatedSlides: string[];
  selectedSlideIndex: number;
  setSelectedSlideIndex: (idx: number) => void;
  state: AppState;
  onUpdateTheme?: (theme: Partial<PresentationTheme>) => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onGoLive: (slideIdx?: number) => void;
  onJumpTo: (idx: number) => void;
}

export const V2ScriptureSlideDeck: React.FC<V2ScriptureSlideDeckProps> = ({
  scriptureResult,
  searchQuery,
  selectedVersion,
  generatedSlides,
  selectedSlideIndex,
  setSelectedSlideIndex,
  state,
  onUpdateTheme,
  onPrevSlide,
  onNextSlide,
  onGoLive,
  onJumpTo,
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#090d16",
      }}
    >
      {/* Slide Deck Sub-header */}
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(15, 23, 42, 0.6)",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color: "#ffffff",
              }}
            >
              {scriptureResult?.reference || searchQuery}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "4px",
                background: "rgba(56, 189, 248, 0.15)",
                color: "#38bdf8",
              }}
            >
              {scriptureResult?.version || selectedVersion}
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            {generatedSlides.length} Slide
            {generatedSlides.length > 1 ? "s" : ""} • Click card to preview,
            double-click to project live
          </div>
        </div>

        {/* Slide Sub-Header Controls: Font Family, Text Size & Slide Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Quick Font Family Selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <Type size={13} color="#38bdf8" />
            <select
              value={state.theme.fontFamily || "Montserrat, sans-serif"}
              onChange={(e) =>
                onUpdateTheme?.({ fontFamily: e.target.value })
              }
              style={{
                background: "rgba(0, 0, 0, 0.45)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                padding: "5px 8px",
                outline: "none",
                cursor: "pointer",
              }}
              title="Select scripture font family for live screen"
            >
              {FONT_FAMILIES.map((f) => (
                <option
                  key={f.value}
                  value={f.value}
                  style={{ background: "#0f172a", color: "#ffffff" }}
                >
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Text Font Size Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(0, 0, 0, 0.45)",
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
            title="Adjust live scripture font size"
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                color: "#94a3b8",
              }}
            >
              Text:
            </span>
            <button
              onClick={() => {
                const cur = state.theme.fontSize || 44;
                const next = Math.max(24, cur - 4);
                onUpdateTheme?.({ fontSize: next });
              }}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "3px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Decrease text font size (-4px)"
            >
              <Minus size={10} />
            </button>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#f59e0b",
                minWidth: "34px",
                textAlign: "center",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {state.theme.fontSize || 44}px
            </span>
            <button
              onClick={() => {
                const cur = state.theme.fontSize || 44;
                const next = Math.min(96, cur + 4);
                onUpdateTheme?.({ fontSize: next });
              }}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "3px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "none",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Increase text font size (+4px)"
            >
              <Plus size={10} />
            </button>
          </div>

          {/* Slide Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <button
              onClick={onPrevSlide}
              disabled={selectedSlideIndex <= 0}
              style={{
                padding: "6px 10px",
                borderRadius: "6px 0 0 6px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: selectedSlideIndex <= 0 ? "#475569" : "#ffffff",
                cursor:
                  selectedSlideIndex <= 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Previous slide (Left Arrow)"
            >
              <ChevronLeft size={15} />
            </button>
            <div
              style={{
                padding: "6px 10px",
                background: "rgba(0, 0, 0, 0.3)",
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "11px",
                fontWeight: 800,
                color: "#38bdf8",
                minWidth: "55px",
                textAlign: "center",
              }}
            >
              {selectedSlideIndex + 1} / {generatedSlides.length || 1}
            </div>
            <button
              onClick={onNextSlide}
              disabled={
                selectedSlideIndex >= generatedSlides.length - 1
              }
              style={{
                padding: "6px 10px",
                borderRadius: "0 6px 6px 0",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color:
                  selectedSlideIndex >= generatedSlides.length - 1
                    ? "#475569"
                    : "#ffffff",
                cursor:
                  selectedSlideIndex >= generatedSlides.length - 1
                    ? "not-allowed"
                    : "pointer",
                display: "flex",
                alignItems: "center",
              }}
              title="Next slide (Right Arrow / Space)"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Generated Slide Cards Grid */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px",
          alignContent: "start",
        }}
      >
        {generatedSlides.map((slideText, idx) => {
          const isSelected = idx === selectedSlideIndex;
          const isCurrentlyLiveOnDisplay =
            state.category === "scripture" &&
            state.cur === idx &&
            state.lines[idx] === slideText;

          return (
            <div
              key={idx}
              onClick={() => {
                setSelectedSlideIndex(idx);
                if (state.category === "scripture") {
                  onGoLive(idx);
                } else {
                  onJumpTo(idx);
                }
              }}
              onDoubleClick={() => onGoLive(idx)}
              style={{
                background: isCurrentlyLiveOnDisplay
                  ? "rgba(239, 68, 68, 0.15)"
                  : isSelected
                    ? "rgba(56, 189, 248, 0.12)"
                    : "rgba(15, 23, 42, 0.7)",
                border: isCurrentlyLiveOnDisplay
                  ? "2px solid #ef4444"
                  : isSelected
                    ? "2px solid #38bdf8"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "130px",
                cursor: "pointer",
                boxShadow: isCurrentlyLiveOnDisplay
                  ? "0 0 20px rgba(239, 68, 68, 0.35)"
                  : isSelected
                    ? "0 0 16px rgba(56, 189, 248, 0.25)"
                    : "none",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: isCurrentlyLiveOnDisplay
                      ? "#ef4444"
                      : isSelected
                        ? "#38bdf8"
                        : "#64748b",
                  }}
                >
                  SLIDE {idx + 1}
                </span>

                {isCurrentlyLiveOnDisplay ? (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: "#ef4444",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Radio size={10} /> ON DISPLAY
                  </span>
                ) : isSelected ? (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(56, 189, 248, 0.2)",
                      color: "#38bdf8",
                    }}
                  >
                    PREVIEW
                  </span>
                ) : null}
              </div>

              <div
                style={{
                  color: "#ffffff",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  fontWeight: 500,
                  fontFamily:
                    state.theme.fontFamily || "Montserrat, sans-serif",
                  whiteSpace: "pre-line",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {slideText}
              </div>

              <div
                style={{
                  marginTop: "10px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ fontSize: "10px", color: "#64748b" }}>
                  Double-click to project
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


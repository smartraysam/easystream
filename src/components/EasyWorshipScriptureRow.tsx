import React from "react";
import { Plus } from "lucide-react";
import { AppState, LiveState } from "../types";

export interface OnlineScriptureVerse {
  verse: number;
  text: string;
}

export interface OnlineScriptureResult {
  reference: string;
  version: string;
  versionName?: string;
  verses: OnlineScriptureVerse[];
  plainContent?: string;
  totalVerses?: number;
  source?: "local" | "online" | "offline-fail";
}

export interface ActiveVerseRange {
  start: number;
  end: number;
  bookChapter: string;
  version: string;
}

export interface EasyWorshipPreviewItem {
  id: string;
  title: string;
  category: string;
  lines: string[];
  cur: number;
}

export interface EasyWorshipScriptureRowProps {
  verse: OnlineScriptureVerse;
  baseBookChapter: string;
  selectedVersion: string;
  activeVerseRange: ActiveVerseRange | null;
  state: AppState;
  previewItem: EasyWorshipPreviewItem;
  selectedVerseNumber: number | null;
  scriptureResult: OnlineScriptureResult;
  onPreviewVerse?: (
    verse: OnlineScriptureVerse,
    verseRef: string,
    cleanVerse: string,
    isInRange: boolean,
  ) => void;
  onGoLiveVerse?: (
    verse: OnlineScriptureVerse,
    verseRef: string,
    cleanVerse: string,
    isInRange: boolean,
  ) => void;
  onSelectVerse?: (
    verse: OnlineScriptureVerse,
    verseRef: string,
    cleanVerse: string,
    isInRange: boolean,
    isRowLiveInRange: boolean,
  ) => void;
  onDoubleClickVerse?: (
    verse: OnlineScriptureVerse,
    verseRef: string,
    cleanVerse: string,
    isInRange: boolean,
  ) => void;
  onAddToSchedule: (
    verseRef: string,
    cleanVerse: string,
    selectedVersion: string,
    e: React.MouseEvent,
  ) => void;
}

/**
 * EasyWorshipScriptureRow
 * Reusable row component for rendering a single Bible verse in the EasyWorship workspace scripture table.
 * Includes live indicators, preview badges, range highlighting, and direct schedule/preview triggers.
 */
export const EasyWorshipScriptureRow: React.FC<EasyWorshipScriptureRowProps> = ({
  verse,
  baseBookChapter,
  selectedVersion,
  activeVerseRange,
  state,
  previewItem,
  selectedVerseNumber,
  scriptureResult,
  onPreviewVerse,
  onGoLiveVerse,
  onSelectVerse,
  onDoubleClickVerse,
  onAddToSchedule,
}) => {
  const verseRef = `${baseBookChapter}:${verse.verse}`;

  // Check if verse is within the currently active range (e.g. John 3:6-10)
  const isPassageRange =
    Boolean(activeVerseRange) &&
    activeVerseRange!.bookChapter.toLowerCase().replace(/\s+/g, "") ===
      baseBookChapter.toLowerCase().replace(/\s+/g, "");
  const isInRange =
    isPassageRange &&
    verse.verse >= activeVerseRange!.start &&
    verse.verse <= activeVerseRange!.end;

  let isRowLive = false;
  let isRowLiveInRange = false;

  if (state.category === "scripture") {
    if (isInRange && state.lines && state.lines.length > 0) {
      const liveVerseNum = activeVerseRange!.start + state.cur;
      if (verse.verse === liveVerseNum) {
        isRowLive = true;
      }
      isRowLiveInRange = true;
    } else {
      const liveTitle = (state.title || "").toLowerCase();
      const liveMatch = liveTitle.match(
        /^([1-3]?\s*[a-z\s]+?\s*\d+):(\d+)(?:[-–—](\d+))?/i,
      );
      if (liveMatch) {
        const liveChapterBook = liveMatch[1]
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "");
        const currentChapterBook = baseBookChapter
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "");
        if (liveChapterBook === currentChapterBook) {
          const startV = parseInt(liveMatch[2], 10);
          const endV = liveMatch[3] ? parseInt(liveMatch[3], 10) : startV;
          if (startV === endV) {
            isRowLive = verse.verse === startV;
          } else {
            isRowLive = verse.verse === startV + state.cur;
            if (verse.verse >= startV && verse.verse <= endV) {
              isRowLiveInRange = true;
            }
          }
        }
      } else if (
        state.lines &&
        state.lines.length > state.cur &&
        scriptureResult?.verses &&
        scriptureResult.verses[state.cur]?.verse === verse.verse
      ) {
        isRowLive = true;
      } else if (selectedVerseNumber === verse.verse) {
        isRowLive = true;
      }

      // Also verify if current live slide specifically contains this verse reference
      if (!isRowLive && state.lines && state.lines[state.cur]) {
        const currentSlideText = state.lines[state.cur];
        const escapedBook = baseBookChapter
          .replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
          .replace(/\s+/g, "\\s*");
        const verseRefPattern = new RegExp(
          `\\b${escapedBook}:${verse.verse}\\b`,
          "i",
        );
        if (verseRefPattern.test(currentSlideText)) {
          isRowLive = true;
        }
      }
    }
  }

  let isRowPreview = false;
  if (previewItem.category === "scripture") {
    if (isInRange && previewItem.lines && previewItem.lines.length > 0) {
      const previewVerseNum =
        activeVerseRange!.start + (previewItem.cur || 0);
      isRowPreview = verse.verse === previewVerseNum;
    }
  }

  const isRowSelected = selectedVerseNumber === verse.verse || isRowPreview;
  const cleanVerse = verse.text.replace(/^\d+[\s:.]\s*/, "").trim();

  const handleSingleClick = (e: React.MouseEvent) => {
    if (onPreviewVerse) {
      onPreviewVerse(verse, verseRef, cleanVerse, isInRange);
    } else if (onSelectVerse) {
      onSelectVerse(
        verse,
        verseRef,
        cleanVerse,
        isInRange,
        isRowLiveInRange,
      );
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if(onGoLiveVerse){
      onGoLiveVerse(verse, verseRef,cleanVerse, isInRange);
    }else if (onDoubleClickVerse){
      onDoubleClickVerse(verse, verseRef, cleanVerse,isInRange);
    }
  }

  return (
    <div
      id={`scripture-row-verse-${verse.verse}`}
      data-component="EasyWorshipScriptureRow"
      data-verse={verse.verse}
      data-live={isRowLive ? "true" : "false"}
      data-selected={isRowSelected ? "true" : "false"}
      data-in-range={isInRange ? "true" : "false"}
      title="Click control to preview"
      onClick={handleSingleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        display: "flex",
        alignItems: "center",
        background: isRowLive
          ? "linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.08) 100%)"
          : isRowSelected
            ? "linear-gradient(90deg, rgba(56, 189, 248, 0.24) 0%, rgba(56, 189, 248, 0.08) 100%)"
            : isInRange
              ? "linear-gradient(90deg, rgba(56, 189, 248, 0.12) 0%, rgba(56, 189, 248, 0.03) 100%)"
              : "transparent",
        color:
          isRowLive || isRowSelected || isInRange ? "#ffffff" : "#cbd5e1",
        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
        borderLeft: isRowLive
          ? "3px solid #ef4444"
          : isRowSelected
            ? "3px solid #38bdf8"
            : isInRange
              ? "3px solid rgba(56, 189, 248, 0.45)"
              : "3px solid transparent",
        fontSize: "12px",
        cursor: "pointer",
        lineHeight: "26px",
        fontWeight:
          isRowLive || isRowSelected ? 600 : isInRange ? 500 : 400,
        transition: "all 0.1s ease",
      }}
    >
      {/* Column 1: Translation Code */}
      <div
        style={{
          width: "95px",
          padding: "2px 12px",
          flexShrink: 0,
          whiteSpace: "nowrap",
          color: isRowLive
            ? "#f87171"
            : isRowSelected
              ? "#38bdf8"
              : isInRange
                ? "#93c5fd"
                : "#94a3b8",
          fontWeight: 700,
        }}
      >
        {selectedVersion}
      </div>

      {/* Column 2: Reference & Status Badges */}
      <div
        style={{
          width: "140px",
          padding: "2px 12px",
          flexShrink: 0,
          whiteSpace: "nowrap",
          fontWeight: isRowLive || isRowSelected ? 700 : 500,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>{verseRef}</span>
        {isRowLive ? (
          <span
            style={{
              fontSize: "8.5px",
              fontWeight: 800,
              background: "#ef4444",
              color: "#ffffff",
              padding: "0 4px",
              borderRadius: "3px",
              lineHeight: "15px",
              letterSpacing: "0.04em",
            }}
          >
            LIVE
          </span>
        ) : isRowSelected ? (
          <span
            style={{
              fontSize: "8.5px",
              fontWeight: 700,
              background: "rgba(56, 189, 248, 0.2)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              padding: "0 4px",
              borderRadius: "3px",
              lineHeight: "13px",
            }}
          >
            PREV
          </span>
        ) : isInRange ? (
          <span
            style={{
              fontSize: "8px",
              fontWeight: 600,
              background: "rgba(148, 163, 184, 0.15)",
              color: "#94a3b8",
              padding: "0 3px",
              borderRadius: "2px",
              lineHeight: "13px",
            }}
          >
            RANGE
          </span>
        ) : null}
      </div>

      {/* Column 3: Verse Text Content */}
      <div
        style={{
          flex: 1,
          padding: "2px 12px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {cleanVerse}
      </div>

      {/* Column 4: Quick Schedule Action Button */}
      <div
        style={{
          width: "85px",
          padding: "2px 8px",
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={(e) =>
            onAddToSchedule(verseRef, cleanVerse, selectedVersion, e)
          }
          title={`Add ${verseRef} to schedule`}
          style={{
            padding: "2px 6px",
            borderRadius: "4px",
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            color: "#38bdf8",
            fontSize: "10px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "3px",
            transition: "all 0.12s ease",
          }}
        >
          <Plus size={10} />
          <span>Schedule</span>
        </button>
      </div>
    </div>
  );
};

EasyWorshipScriptureRow.displayName = "EasyWorshipScriptureRow";

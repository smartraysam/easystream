import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { AppState } from "../types";
import {
  EasyWorshipScriptureRow,
  OnlineScriptureVerse,
  OnlineScriptureResult,
  ActiveVerseRange,
  EasyWorshipPreviewItem,
} from "./EasyWorshipScriptureRow";

export { EasyWorshipScriptureRow };
export type {
  OnlineScriptureVerse,
  OnlineScriptureResult,
  ActiveVerseRange,
  EasyWorshipPreviewItem,
};

export interface EasyWorshipScriptureTableBodyProps {
  scriptureResult: OnlineScriptureResult | null;
  selectedVersion: string;
  activeVerseRange: ActiveVerseRange | null;
  state: AppState;
  previewItem: EasyWorshipPreviewItem;
  selectedVerseNumber: number | null;
  loading: boolean;
  searchError: string | null;
  onSelectVerse: (
    verse: OnlineScriptureVerse,
    verseRef: string,
    cleanVerse: string,
    isInRange: boolean,
    isRowLiveInRange: boolean,
  ) => void;
  onDoubleClickVerse: (
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
 * EasyWorshipScriptureTableBody
 * Table body component for listing verses in the EasyWorship workspace scripture view.
 * Handles scrolling, empty states, loading indicator, and delegates row rendering to EasyWorshipScriptureRow.
 */
export const EasyWorshipScriptureTableBody = forwardRef<
  HTMLDivElement,
  EasyWorshipScriptureTableBodyProps
>(
  (
    {
      scriptureResult,
      selectedVersion,
      activeVerseRange,
      state,
      previewItem,
      selectedVerseNumber,
      loading,
      searchError,
      onSelectVerse,
      onDoubleClickVerse,
      onAddToSchedule,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-component="EasyWorshipScriptureTableBody"
        style={{
          flex: 1,
          overflowY: "auto",
          position: "relative",
          scrollBehavior: "smooth",
        }}
      >
        {scriptureResult?.verses && scriptureResult.verses.length > 0 ? (
          scriptureResult.verses.map((v) => {
            const baseBookChapter =
              scriptureResult.reference
                .match(/^([1-3]?\s*[a-zA-Z\s]+?\s*\d+)/)?.[1]
                ?.trim() || scriptureResult.reference;

            return (
              <EasyWorshipScriptureRow
                key={v.verse}
                verse={v}
                baseBookChapter={baseBookChapter}
                selectedVersion={selectedVersion}
                activeVerseRange={activeVerseRange}
                state={state}
                previewItem={previewItem}
                selectedVerseNumber={selectedVerseNumber}
                scriptureResult={scriptureResult}
                onSelectVerse={onSelectVerse}
                onDoubleClickVerse={onDoubleClickVerse}
                onAddToSchedule={onAddToSchedule}
              />
            );
          })
        ) : (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Loader2
                  size={16}
                  className="animate-spin"
                  color="#38bdf8"
                />
                <span>Searching scriptures...</span>
              </div>
            ) : (
              searchError || "No scriptures found."
            )}
          </div>
        )}
      </div>
    );
  },
);

EasyWorshipScriptureTableBody.displayName = "EasyWorshipScriptureTableBody";


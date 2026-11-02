import React from "react";
import { BookOpen, Music } from "lucide-react";

interface V2ModeTabsProps {
  activeTab: "scripture" | "lyrics";
  setActiveTab: (tab: "scripture" | "lyrics") => void;
}

export const V2ModeTabs: React.FC<V2ModeTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 20px",
        background: "linear-gradient(90deg, #0a0f1d 0%, #0d1527 100%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        flexShrink: 0,
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Segmented Pill Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(0, 0, 0, 0.55)",
            padding: "3px",
            borderRadius: "10px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            gap: "4px",
          }}
        >
          <button
            onClick={() => setActiveTab("scripture")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 18px",
              borderRadius: "7px",
              background:
                activeTab === "scripture"
                  ? "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
                  : "transparent",
              color: activeTab === "scripture" ? "#ffffff" : "#94a3b8",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              boxShadow:
                activeTab === "scripture"
                  ? "0 0 16px rgba(14, 165, 233, 0.45)"
                  : "none",
              transition: "all 0.15s ease",
            }}
            title="Switch to Scripture Presentation mode (Bible books, chapters, verses)"
          >
            <BookOpen size={15} />
            <span>Scripture Projection</span>
          </button>

          <button
            onClick={() => setActiveTab("lyrics")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 18px",
              borderRadius: "7px",
              background:
                activeTab === "lyrics"
                  ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                  : "transparent",
              color: activeTab === "lyrics" ? "#ffffff" : "#94a3b8",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              boxShadow:
                activeTab === "lyrics"
                  ? "0 0 16px rgba(139, 92, 246, 0.45)"
                  : "none",
              transition: "all 0.15s ease",
            }}
            title="Switch to Lyric Presentation mode (Search church local library & online worship songs)"
          >
            <Music size={15} />
            <span>Lyric Projection</span>
          </button>
        </div>
      </div>

      {/* Right Contextual Helper */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {activeTab === "scripture" ? (
          <span
            style={{
              fontSize: "11px",
              color: "#38bdf8",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <BookOpen size={13} />
            <span>
              66 Books • Chapters • Verses • Multi-Version Quick Navigation
            </span>
          </span>
        ) : (
          <span
            style={{
              fontSize: "11px",
              color: "#c084fc",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Music size={13} />
            <span>
              Church Library • Online LRCLIB Catalog • Smart Stanza Split
            </span>
          </span>
        )}
      </div>
    </div>
  );
};


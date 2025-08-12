"use client";

import { Search as SearchIcon } from "lucide-react";

interface RightPanelProps {
  activeTab: "thumbnail" | "index" | "search";
  setActiveTab: (tab: "thumbnail" | "index" | "search") => void;
  pagesHtml: string[];
  headings: { text: string; page: number }[];
  scrollToPage: (pageNum: number) => void;
  pageInlineStyle: React.CSSProperties;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  handleSearch: () => void;
  searchResults: number[];
}

export default function RightPanel({
  activeTab,
  setActiveTab,
  pagesHtml,
  headings,
  scrollToPage,
  pageInlineStyle,
  searchQuery,
  setSearchQuery,
  handleSearch,
  searchResults,
}: RightPanelProps) {
  return (
    <div className="flex flex-col w-[280px] border-l border-gray-200 bg-white">
      {/* Tab buttons */}
      <div className="flex border-b bg-gray-50">
        <button
          onClick={() => setActiveTab("thumbnail")}
          className={`px-4 py-2 ${
            activeTab === "thumbnail"
              ? "text-purple-700 border-b-2 border-purple-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Thumbnail
        </button>
        <button
          onClick={() => setActiveTab("index")}
          className={`px-4 py-2 ${
            activeTab === "index"
              ? "text-purple-700 border-b-2 border-purple-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Index
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2 ${
            activeTab === "search"
              ? "text-purple-700 border-b-2 border-purple-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Search
        </button>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Thumbnails */}
        {activeTab === "thumbnail" &&
          (pagesHtml.length ? (
            pagesHtml.map((html, idx) => (
              <div
                key={idx}
                onClick={() => scrollToPage(idx + 1)}
                className="border border-gray-300 rounded p-2 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
              >
                <div
                  style={{
                    width: 72,
                    height: 96,
                    overflow: "hidden",
                    borderRadius: 4,
                    background: "#fff",
                    boxShadow: "inset 0 0 0 1px #eee",
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${72 / (210 * (96 / 297))})`,
                      transformOrigin: "top left",
                      width: "210mm",
                      height: "297mm",
                      boxSizing: "border-box",
                      padding: "6px",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        ...pageInlineStyle,
                        width: "100%",
                        height: "100%",
                      }}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-700">Page {idx + 1}</div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">No pages</div>
          ))}

        {/* Index */}
        {activeTab === "index" &&
          (headings.length ? (
            headings.map((h, idx) => (
              <div
                key={idx}
                onClick={() => scrollToPage(h.page)}
                className="text-xs cursor-pointer hover:underline"
              >
                {h.text} — Page {h.page}
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">No headings</div>
          ))}

        {/* Search */}
        {activeTab === "search" && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 border px-2 py-1 text-xs rounded"
              />
              <button
                onClick={handleSearch}
                className="p-1 bg-gray-100 rounded"
              >
                <SearchIcon size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {searchResults.length ? (
                searchResults.map((p) => (
                  <div
                    key={p}
                    onClick={() => scrollToPage(p)}
                    className="text-xs cursor-pointer hover:underline"
                  >
                    Match on Page {p}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500">No matches</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

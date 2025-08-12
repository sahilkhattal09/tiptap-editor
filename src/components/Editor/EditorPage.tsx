"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Footer from "./Footer";
import RightPanel from "./RightPanel";
import TextToolbar from "./TextToolbar";
import PageToolbar from "../PageToolbar";
import { usePagination } from "../../hooks/usePagination";

export default function EditorPage({
  title = "Document Title",
}: {
  title?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [chars, setChars] = useState(0);
  const [isPageView, setIsPageView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"thumbnail" | "index" | "search">(
    "thumbnail"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);

  // Visual controls
  const [zoomPercent, setZoomPercent] = useState(100);
  const [fontFamily, setFontFamily] = useState(
    "Avenir Next, system-ui, -apple-system, 'Segoe UI', Roboto"
  );
  const [fontSize, setFontSize] = useState(12);
  const [rulerEnabled, setRulerEnabled] = useState(true);

  // Pagination hook
  const { pagesHtml, headings, measureRef, buildPages } = usePagination(
    title,
    currentPage,
    setCurrentPage
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tiptap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ["paragraph", "heading"] }),
      Underline,
    ],
    content: `
      <h2>Document heading</h2>
      <p><strong>Androids and Humans</strong>: The novel explores the uneasy coexistence of humans and androids...</p>
      <p><strong>Empathy and Identity</strong>: To distinguish androids from humans...</p>
      <p>Type to see pagination...</p>
    `,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setChars(editor.getText().length);
      buildPages(editor.getHTML());
    },
    editorProps: {
      attributes: { className: "outline-none w-full h-full" },
    },
  });

  const insertPageBreak = () => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule().run();
    buildPages(editor.getHTML());
  };

  // Build pages on mount and when dependencies change
  useEffect(() => {
    if (!mounted || !editor) return;
    buildPages(editor.getHTML());
  }, [mounted, editor, buildPages]);

  if (!mounted) return null;

  // Search logic to find pages containing search query
  const handleSearch = () => {
    const matches: number[] = [];
    pagesHtml.forEach((p, idx) => {
      if (p.toLowerCase().includes(searchQuery.toLowerCase()))
        matches.push(idx + 1);
    });
    setSearchResults(matches);
  };

  // Scroll to page by id and update current page state
  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`page-${pageNum}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(pageNum);
  };

  // Zoom control with limits
  const setZoom = (percent: number) =>
    setZoomPercent(Math.max(20, Math.min(300, percent)));

  // Inline styles applied to pages & editor for font settings
  const pageInlineStyle: React.CSSProperties = {
    fontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: 1.45,
  };

  return (
    <div className="flex h-screen font-sans text-sm bg-[#F5F6F8]">
      {/* Left main panel */}
      <div className="flex flex-col flex-1 border-r border-gray-200 bg-white">
        {/* Title bar with Save icon and toggle buttons */}
        <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
          <div className="text-lg font-semibold truncate">{title}</div>
          <div className="text-xs text-green-600 ml-2 flex items-center gap-1">
            <Save size={14} /> Saved
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPageView(false)}
              className={`px-3 py-1 rounded ${
                !isPageView ? "bg-purple-700 text-white" : "border"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setIsPageView(true)}
              className={`px-3 py-1 rounded ${
                isPageView ? "bg-purple-700 text-white" : "border"
              }`}
            >
              Page
            </button>
          </div>
        </div>

        {/* Toolbar area */}
        {isPageView ? (
          <PageToolbar
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
            rulerEnabled={rulerEnabled}
            setRulerEnabled={setRulerEnabled}
            zoomPercent={zoomPercent}
            setZoom={setZoomPercent}
          />
        ) : (
          <TextToolbar
            editor={editor}
            insertPageBreak={insertPageBreak}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            fontSize={fontSize}
            setFontSize={setFontSize}
            chars={chars}
          />
        )}

        {/* Ruler (page mode only) */}
        {isPageView && rulerEnabled && (
          <div className="px-6 py-2 border-b bg-white">
            <div className="relative select-none">
              <div className="h-6 bg-gray-50 rounded relative overflow-hidden">
                <div
                  style={{ display: "flex", gap: 0, fontSize: 11 }}
                  className="px-2"
                >
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: "19mm",
                        textAlign: "center",
                        borderRight: "1px dashed #E8E8E8",
                        paddingTop: 6,
                      }}
                    >
                      {i * 20} mm
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#F5F6F8]">
          {isPageView ? (
            <div className="flex flex-col items-center gap-6 py-4">
              <div
                className="page-stack"
                style={{
                  transform: `scale(${zoomPercent / 100})`,
                  transformOrigin: "top center",
                  width: `210mm`,
                }}
              >
                {pagesHtml.map((pageHtml, i) => (
                  <div
                    key={i}
                    id={`page-${i + 1}`}
                    className="page shadow bg-white border border-gray-200 mb-6"
                    style={{ ...pageInlineStyle }}
                  >
                    <div className="page-header px-6 py-2 text-sm text-gray-600">
                      {title}
                    </div>
                    <div
                      className="page-content px-6 py-4 text-sm"
                      dangerouslySetInnerHTML={{ __html: pageHtml }}
                    />
                    <div className="page-footer px-6 py-2 text-sm text-gray-600 text-center">
                      Page {i + 1} of {pagesHtml.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="editor-edit-area mx-auto bg-white border border-gray-200"
              style={{
                width: "210mm",
                boxSizing: "border-box",
                ...pageInlineStyle,
              }}
            >
              <div
                style={{
                  minHeight: "297mm",
                  padding: "20mm",
                  boxSizing: "border-box",
                }}
              >
                {editor && <EditorContent editor={editor} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation and zoom */}
        <Footer
          chars={chars}
          fontFamily={fontFamily}
          currentPage={currentPage}
          totalPages={pagesHtml.length}
          onPageChange={setCurrentPage}
          zoomPercent={zoomPercent}
          onZoomIn={() => setZoom(Math.min(300, zoomPercent + 10))}
          onZoomOut={() => setZoom(Math.max(20, zoomPercent - 10))}
        />
      </div>

      {/* Right panel */}
      <RightPanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pagesHtml={pagesHtml}
        headings={headings}
        scrollToPage={scrollToPage}
        pageInlineStyle={pageInlineStyle}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        searchResults={searchResults}
      />

      {/* Hidden measuring container for pagination */}
      <div
        ref={measureRef as any}
        style={{
          position: "fixed",
          left: "-9999px",
          top: "-9999px",
          width: "210mm",
          padding: "20mm",
          boxSizing: "border-box",
          visibility: "hidden",
          fontFamily,
          fontSize: `${fontSize}px`,
        }}
      />

      {/* Global styles */}
      <style jsx global>{`
        .page {
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          background: white;
        }
        .page-header {
          height: 36px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }
        .page-content {
          flex: 1 1 auto;
          overflow: hidden;
        }
        .page-footer {
          height: 36px;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media print {
          body {
            background: white !important;
          }
          .page {
            page-break-after: always;
            width: 210mm;
            height: 297mm;
            box-shadow: none;
            margin: 0;
          }
          .page-header,
          .page-footer {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}

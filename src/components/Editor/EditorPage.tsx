"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Columns,
  Save,
  Search as SearchIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Footer from "./Footer";
import RightPanel from "./RightPanel";
import TextToolbar from "./TextToolbar";
import PageToolbar from "../PageToolbar";

/**
 * EditorPage (single-file)
 *
 * - Page / Text toggle (top-right) with separate toolbars
 * - Page view: paginated pages with header/footer, ruler, zoom
 * - Text view: regular editing canvas (A4 width)
 * - Scaled thumbnails: real page HTML rendered and scaled-down
 * - Manual page breaks via HR insertion
 *
 * Notes:
 * - This is a prototype for the assignment. For production you'd:
 *    • Use more robust node splitting for tables/images
 *    • Virtualize pages for large docs
 *    • Use Tiptap extensions for fonts/sizes (or custom attributes) rather than global CSS
 */

export default function EditorPage({
  title = "Document Title",
}: {
  title?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [chars, setChars] = useState(0);
  const [isPageView, setIsPageView] = useState(true);
  const [pagesHtml, setPagesHtml] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"thumbnail" | "index" | "search">(
    "thumbnail"
  );
  const [headings, setHeadings] = useState<{ text: string; page: number }[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const buildTimer = useRef<number | null>(null);

  // visual controls
  const [zoomPercent, setZoomPercent] = useState(100); // 100% default
  const [fontFamily, setFontFamily] = useState(
    "Avenir Next, system-ui, -apple-system, 'Segoe UI', Roboto"
  );
  const [fontSize, setFontSize] = useState(12); // px
  const [rulerEnabled, setRulerEnabled] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      debouncedBuild(editor.getHTML());
    },
    editorProps: {
      attributes: { class: "outline-none w-full h-full" },
    },
  });

  // Debounce rebuild
  const debouncedBuild = (html: string) => {
    if (buildTimer.current) window.clearTimeout(buildTimer.current);
    buildTimer.current = window.setTimeout(() => buildPagesFromHtml(html), 200);
  };

  const insertPageBreak = () => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule().run();
    buildPagesFromHtml(editor.getHTML());
  };

  // Pagination logic (measures using hidden container)
  const buildPagesFromHtml = (html: string) => {
    if (!measureRef.current) {
      setPagesHtml([html]);
      return;
    }
    const measureRoot = measureRef.current;
    measureRoot.innerHTML = "";

    const createPageEl = () => {
      const page = document.createElement("div");
      page.className = "page measure-page";
      const header = document.createElement("div");
      header.className = "page-header";
      header.textContent = title;
      page.appendChild(header);
      const contentWrap = document.createElement("div");
      contentWrap.className = "page-content";
      page.appendChild(contentWrap);
      const footer = document.createElement("div");
      footer.className = "page-footer";
      footer.textContent = "Page";
      page.appendChild(footer);
      return { page, contentWrap };
    };

    const probe = createPageEl();
    measureRoot.appendChild(probe.page);
    const usableHeight = probe.contentWrap.clientHeight;
    measureRoot.innerHTML = "";

    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const nodes = Array.from(tmp.childNodes);

    const pages: string[] = [];
    let headingList: { text: string; page: number }[] = [];
    let current = createPageEl();

    const nodeFits = (node: Node) => {
      const clone = node.cloneNode(true);
      current.contentWrap.appendChild(clone);
      const fits = current.contentWrap.scrollHeight <= usableHeight;
      if (!fits) current.contentWrap.removeChild(clone);
      return fits;
    };

    const splitTextNodeToFit = (textNode: Text) => {
      const text = textNode.textContent || "";
      let low = 0,
        high = text.length,
        cut = 0;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const prefix = document.createTextNode(text.slice(0, mid));
        current.contentWrap.appendChild(prefix);
        const fits = current.contentWrap.scrollHeight <= usableHeight;
        current.contentWrap.removeChild(prefix);
        if (fits) {
          cut = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }
      const first = document.createTextNode(text.slice(0, cut || 1));
      const rest = document.createTextNode(text.slice(cut || 1));
      current.contentWrap.appendChild(first);
      return rest;
    };

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // Manual break (hr)
      if (
        node.nodeType === 1 &&
        (node as HTMLElement).tagName.toLowerCase() === "hr"
      ) {
        pages.push(current.contentWrap.innerHTML);
        current = createPageEl();
        continue;
      }

      if (nodeFits(node)) {
        if (
          node.nodeType === 1 &&
          ["h1", "h2", "h3"].includes(
            (node as HTMLElement).tagName.toLowerCase()
          )
        ) {
          headingList.push({
            text: (node as HTMLElement).innerText,
            page: pages.length + 1,
          });
        }
        continue;
      } else {
        if (current.contentWrap.childNodes.length === 0) {
          // too big for empty page
          if (node.nodeType === 3) {
            const rest = splitTextNodeToFit(node as Text);
            pages.push(current.contentWrap.innerHTML);
            current = createPageEl();
            if (rest.textContent) current.contentWrap.appendChild(rest);
          } else {
            current.contentWrap.appendChild(node.cloneNode(true));
            pages.push(current.contentWrap.innerHTML);
            current = createPageEl();
          }
        } else {
          // start new page and try again
          pages.push(current.contentWrap.innerHTML);
          current = createPageEl();
          if (nodeFits(node)) continue;
          else {
            if (node.nodeType === 3) {
              const rest = splitTextNodeToFit(node as Text);
              pages.push(current.contentWrap.innerHTML);
              current = createPageEl();
              if (rest.textContent) current.contentWrap.appendChild(rest);
            } else {
              current.contentWrap.appendChild(node.cloneNode(true));
            }
          }
        }
      }
    }

    pages.push(current.contentWrap.innerHTML);
    setPagesHtml(pages);
    setHeadings(headingList);
    if (currentPage > pages.length) setCurrentPage(1);
  };

  // initial build once editor ready
  useEffect(() => {
    if (!mounted || !editor) return;
    buildPagesFromHtml(editor.getHTML());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, editor, fontFamily, fontSize]);

  if (!mounted) return null;

  // Helpers
  const handleSearch = () => {
    const matches: number[] = [];
    pagesHtml.forEach((p, idx) => {
      if (p.toLowerCase().includes(searchQuery.toLowerCase()))
        matches.push(idx + 1);
    });
    setSearchResults(matches);
  };

  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`page-${pageNum}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(pageNum);
  };

  // zoom helpers
  const setZoom = (percent: number) =>
    setZoomPercent(Math.max(20, Math.min(300, percent)));

  // inline styling applied to pages & editor area so font changes reflect visually
  const pageInlineStyle: React.CSSProperties = {
    fontFamily,
    fontSize: `${fontSize}px`,
    lineHeight: 1.45,
  };

  return (
    <div className="flex h-screen font-sans text-sm bg-[#F5F6F8]">
      {/* Left main */}
      <div className="flex flex-col flex-1 border-r border-gray-200 bg-white">
        {/* top title row */}
        <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
          <div className="text-lg font-semibold truncate">{title}</div>
          <div className="text-xs text-green-600 ml-2 flex items-center gap-1">
            <Save size={14} /> Saved
          </div>

          <div className="flex-1" />

          {/* Page/Text toggle (matches requirement: top right) */}
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

        {/* Toolbars: swap based on mode */}
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
                {/* numeric ticks - simple visual ruler */}
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
            // Page view container centered; scale based on zoomPercent
            <div className="flex flex-col items-center gap-6 py-4">
              {/* transform scale centered; wrapper ensures margin outside */}
              <div
                className="page-stack"
                style={{
                  transform: `scale(${zoomPercent / 100})`,
                  transformOrigin: "top center",
                  width: `${210}mm`,
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
            // Text edit view (single A4 width editable area)
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

        {/* Footer with centered page navigation and left/right extras */}
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

      {/* Hidden measuring container used by pagination */}
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

      {/* Styles */}
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

        /* print rules - headers/footers will be part of page when printing */
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

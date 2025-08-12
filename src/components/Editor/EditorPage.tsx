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
          // Page view toolbar (document settings style)
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-white">
            <button className="px-3 py-1 rounded hover:bg-gray-50 border">
              Header & Footer
            </button>
            <button className="px-3 py-1 rounded hover:bg-gray-50 border">
              Margins
            </button>
            <button
              className="px-3 py-1 rounded hover:bg-gray-50 border"
              onClick={() => setRulerEnabled((s) => !s)}
            >
              {rulerEnabled ? "Hide Ruler" : "Show Ruler"}
            </button>
            <button className="px-3 py-1 rounded hover:bg-gray-50 border">
              Watermark
            </button>

            {/* visual font controls (affect page/editor via CSS) */}
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="border px-2 py-1 rounded text-sm ml-4"
            >
              <option
                value={
                  "Avenir Next, system-ui, -apple-system, 'Segoe UI', Roboto"
                }
              >
                Avenir Next
              </option>
              <option value={"Roboto, system-ui, -apple-system"}>Roboto</option>
              <option value={"Georgia, serif"}>Georgia</option>
            </select>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="border px-2 py-1 rounded text-sm"
            >
              <option value={11}>11</option>
              <option value={12}>12</option>
              <option value={13}>13</option>
              <option value={14}>14</option>
              <option value={16}>16</option>
            </select>

            <div className="flex-1" />

            {/* Zoom controls and character count on toolbar right for quick access */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setZoom(zoomPercent - 10)}
                className="p-1 border rounded"
              >
                <ZoomOut size={14} />
              </button>
              <div className="px-2">{zoomPercent}%</div>
              <button
                onClick={() => setZoom(zoomPercent + 10)}
                className="p-1 border rounded"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>
        ) : (
          // Text view toolbar (formatting)
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-white">
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <Bold size={16} />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <Italic size={16} />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon size={16} />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft size={16} />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() =>
                editor?.chain().focus().setTextAlign("center").run()
              }
            >
              <AlignCenter size={16} />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={() =>
                editor?.chain().focus().setTextAlign("right").run()
              }
            >
              <AlignRight size={16} />
            </button>

            <button
              className="ml-3 px-3 py-1 bg-gray-100 rounded text-sm"
              onClick={insertPageBreak}
            >
              Insert page break
            </button>

            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="border px-2 py-1 rounded text-sm ml-4"
            >
              <option
                value={
                  "Avenir Next, system-ui, -apple-system, 'Segoe UI', Roboto"
                }
              >
                Avenir Next
              </option>
              <option value={"Roboto, system-ui, -apple-system"}>Roboto</option>
              <option value={"Georgia, serif"}>Georgia</option>
            </select>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="border px-2 py-1 rounded text-sm"
            >
              <option value={11}>11</option>
              <option value={12}>12</option>
              <option value={13}>13</option>
              <option value={14}>14</option>
              <option value={16}>16</option>
            </select>

            <div className="flex-1" />

            <div className="text-xs text-gray-600">{chars} characters</div>
          </div>
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
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 bg-white">
          <div className="flex items-center gap-4 text-xs">
            <div>{chars} characters</div>
            <div className="text-gray-500">
              Font: {fontFamily.split(",")[0]}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ChevronLeft
              size={18}
              className="cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            />
            <div className="text-sm">
              Page {currentPage} of {pagesHtml.length || 1}
            </div>
            <ChevronRight
              size={18}
              className="cursor-pointer"
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, pagesHtml.length || 1))
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(20, zoomPercent - 10))}
              className="px-2 py-1 border rounded text-xs"
            >
              -
            </button>
            <div className="text-xs">{zoomPercent}%</div>
            <button
              onClick={() => setZoom(Math.min(300, zoomPercent + 10))}
              className="px-2 py-1 border rounded text-xs"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col w-[280px] border-l border-gray-200 bg-white">
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

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Thumbnails: scaled HTML previews */}
          {activeTab === "thumbnail" &&
            (pagesHtml.length ? (
              pagesHtml.map((html, idx) => {
                // Each thumbnail contains scaled-down copy of page using same inline styles
                return (
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
                        {/* Use inner HTML + inline style for font/size */}
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
                );
              })
            ) : (
              <div className="text-xs text-gray-500">No pages</div>
            ))}

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

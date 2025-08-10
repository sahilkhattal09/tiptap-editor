"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Columns,
  Save,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

/**
 * EditorPage.tsx
 *
 * Prototype implementing:
 * - A4 visual pages (210mm x 297mm)
 * - Manual page break (toolbar button -> horizontal rule)
 * - Automatic pagination while typing (block-level + coarse text splitting)
 * - Per-page header/footer with dynamic page numbers
 * - Print-friendly @media print rules
 *
 * Limitations (acceptable for this assignment/prototype):
 * - Automatic splitting is block-based; for very long paragraphs we attempt a binary text-split (coarse).
 * - Performance: pagination rebuild is debounced to avoid doing it on every keystroke immediately.
 * - For production you'd refine node-splitting, virtualize page rendering and handle images/tables better.
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
  const measureRef = useRef<HTMLDivElement | null>(null);
  const buildTimer = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({ types: ["paragraph", "heading"] }),
    ],
    content: `
      <h2>Document heading</h2>
      <p>1. <strong>Androids and Humans</strong>: The novel explores the uneasy coexistence of humans and androids...</p>
      <p>2. <strong>Empathy and Identity</strong>: To distinguish androids from humans...</p>
      <p>Type to see pagination...</p>
    `,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setChars(editor.getText().length);
      debouncedBuild(editor.getHTML());
    },
    editorProps: { attributes: { class: "outline-none w-full h-full" } },
  });

  // Debounce rebuild to improve typing performance
  const debouncedBuild = (html: string) => {
    if (buildTimer.current) {
      window.clearTimeout(buildTimer.current);
    }
    buildTimer.current = window.setTimeout(() => {
      buildPagesFromHtml(html);
    }, 220);
  };

  // Insert manual page break (horizontal rule)
  const insertPageBreak = () => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule().run();
    // rebuild right away
    buildPagesFromHtml(editor.getHTML());
  };

  // Build paginated pages from editor HTML using a hidden measuring container
  const buildPagesFromHtml = (html: string) => {
    if (!measureRef.current) {
      // fallback: single page
      setPagesHtml([html]);
      return;
    }

    const measureRoot = measureRef.current;
    measureRoot.innerHTML = ""; // reset

    // Create prototype page element (same CSS used by real pages)
    const createPageEl = () => {
      const page = document.createElement("div");
      page.className = "page measure-page";
      // header
      const header = document.createElement("div");
      header.className = "page-header";
      header.textContent = title;
      page.appendChild(header);
      // content wrapper
      const contentWrap = document.createElement("div");
      contentWrap.className = "page-content";
      page.appendChild(contentWrap);
      // footer
      const footer = document.createElement("div");
      footer.className = "page-footer";
      footer.textContent = "Page";
      page.appendChild(footer);
      return { page, contentWrap };
    };

    // probe to compute usable content height
    const probe = createPageEl();
    measureRoot.appendChild(probe.page);
    const contentEl = probe.contentWrap;
    const usableHeight = contentEl.clientHeight;
    measureRoot.innerHTML = "";

    // parse incoming HTML nodes
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const nodes = Array.from(tmp.childNodes);

    const pages: string[] = [];
    let current = createPageEl();
    const appendNodeToCurrent = (node: Node) => {
      current.contentWrap.appendChild(node);
    };

    const nodeFits = (node: Node) => {
      // append clone and test height
      const clone = node.cloneNode(true);
      current.contentWrap.appendChild(clone);
      const fits = current.contentWrap.scrollHeight <= usableHeight;
      if (!fits) current.contentWrap.removeChild(clone);
      return fits;
    };

    // helper to split a text node roughly to fit using binary search on substring length
    const splitTextNodeToFit = (textNode: Text) => {
      const text = textNode.textContent || "";
      let low = 0,
        high = text.length,
        cut = 0;
      // binary search for largest prefix that fits
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
      // if nothing fits (cut === 0) return whole text on its own page
      const first = document.createTextNode(text.slice(0, cut || 1));
      const rest = document.createTextNode(text.slice(cut || 1));
      // append first
      current.contentWrap.appendChild(first);
      // return rest for next page
      return rest;
    };

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // If it's an <hr> treat as manual break
      if (
        node.nodeType === 1 &&
        (node as HTMLElement).tagName.toLowerCase() === "hr"
      ) {
        // push current page content
        pages.push(current.contentWrap.innerHTML);
        current = createPageEl();
        continue;
      }

      // Try to fit node: if fits, keep it; if not, handle splitting
      if (nodeFits(node)) {
        // appended (the node was appended inside nodeFits)
        continue;
      } else {
        // didn't fit
        // if current page empty -> push oversized node anyway and start new page
        if (current.contentWrap.childNodes.length === 0) {
          // if node is a text node (long paragraph) try splitting
          if (node.nodeType === 3) {
            // text node
            const rest = splitTextNodeToFit(node as Text);
            // finalize current and start next with rest
            pages.push(current.contentWrap.innerHTML);
            current = createPageEl();
            if (rest.textContent && rest.textContent.length > 0) {
              current.contentWrap.appendChild(rest);
            }
          } else {
            // non-text single large node: append it and continue
            current.contentWrap.appendChild(node.cloneNode(true));
            pages.push(current.contentWrap.innerHTML);
            current = createPageEl();
          }
        } else {
          // start a new page and try append node there
          pages.push(current.contentWrap.innerHTML);
          current = createPageEl();
          // now try append node to new page; if still doesn't fit and is text, split
          if (nodeFits(node)) {
            continue; // appended
          } else {
            if (node.nodeType === 3) {
              const rest = splitTextNodeToFit(node as Text);
              pages.push(current.contentWrap.innerHTML);
              current = createPageEl();
              if (rest.textContent && rest.textContent.length > 0) {
                current.contentWrap.appendChild(rest);
              }
            } else {
              // large node that doesn't fit a fresh page => append anyway
              current.contentWrap.appendChild(node.cloneNode(true));
            }
          }
        }
      }
    }

    // push last page
    pages.push(current.contentWrap.innerHTML);

    setPagesHtml(pages);
    // ensure current page index valid
    if (currentPage > pages.length) setCurrentPage(1);
  };

  // initial build
  useEffect(() => {
    if (!mounted || !editor) return;
    buildPagesFromHtml(editor.getHTML());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, editor]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen font-sans text-sm">
      {/* Editor main area (left) */}
      <div className="flex flex-col flex-1 border-r border-gray-300 bg-white">
        {/* Document title row (we keep header outside unchanged per your request) */}
        <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
          <div className="text-lg font-semibold truncate">{title}</div>
          <div className="text-xs text-green-600 ml-2 flex items-center gap-1">
            <Save size={14} /> Saved
          </div>
          <div className="flex-1" />
          <button
            className="flex items-center gap-2 px-3 py-1 rounded border"
            onClick={() => setIsPageView((s) => !s)}
            title="Toggle Page View"
          >
            <Columns size={16} />
            <span className="text-sm">{isPageView ? "Page View" : "Edit"}</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-white">
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option>Avenir Next</option>
          </select>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option>Regular</option>
          </select>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option>12</option>
          </select>

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
            onClick={() => editor?.chain().focus().toggleUnderline?.().run()}
          >
            <Underline size={16} />
          </button>

          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft size={16} />
          </button>
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter size={16} />
          </button>
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight size={16} />
          </button>

          <button
            className="ml-3 px-3 py-1 bg-gray-100 rounded text-sm"
            onClick={insertPageBreak}
          >
            Insert page break
          </button>

          <div className="flex-1" />
          <button className="bg-purple-100 text-purple-700 px-3 py-1 rounded">
            Ask Vettem
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-100">
          {isPageView ? (
            <div className="flex flex-col items-center gap-6 py-4">
              {pagesHtml.map((pageHtml, i) => (
                <div
                  key={i}
                  className="page shadow bg-white border border-gray-200"
                  style={{ position: "relative" }}
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
          ) : (
            <div className="editor-edit-area mx-auto w-[210mm] bg-white border border-gray-200">
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

        {/* Footer controls */}
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs bg-white">
          <div>{chars} characters</div>
          <div className="flex items-center gap-2">
            <ChevronLeft
              size={16}
              className="cursor-pointer"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            />
            <div>
              Page {currentPage} of {pagesHtml.length || 1}
            </div>
            <ChevronRight
              size={16}
              className="cursor-pointer"
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, pagesHtml.length || 1))
              }
            />
          </div>
        </div>
      </div>

      {/* Right thumbnail panel */}
      <div className="flex flex-col w-[240px] min-w-[220px] max-w-[260px] border-l border-gray-200 bg-white">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button className="px-4 py-2 text-purple-700 border-b-2 border-purple-700">
            Thumbnail
          </button>
          <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
            Index
          </button>
          <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
            Search
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {pagesHtml.length ? (
            pagesHtml.map((_, idx) => (
              <div
                key={idx}
                className="border border-gray-300 rounded p-2 flex items-center gap-2 cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <div className="w-12 h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                  P{idx + 1}
                </div>
                <div className="text-xs text-gray-700">Page {idx + 1}</div>
              </div>
            ))
          ) : (
            <>
              <div className="border border-gray-300 rounded">
                <div className="h-40 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                  PDF Page
                </div>
              </div>
              <div className="border border-gray-300 rounded">
                <div className="h-40 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                  PDF Page
                </div>
              </div>
            </>
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
          padding-left: 0;
          padding-right: 0;
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

        .editor-edit-area {
          box-sizing: border-box;
        }

        /* Print */
        @media print {
          body {
            background: white;
          }
          .page {
            page-break-after: always;
            width: 210mm;
            height: 297mm;
            box-shadow: none;
            margin: 0;
            -webkit-print-color-adjust: exact;
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

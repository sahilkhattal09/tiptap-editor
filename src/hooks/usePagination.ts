import { useRef, useState, useCallback } from "react";

interface Heading {
  text: string;
  page: number;
}

export function usePagination(
  title: string,
  currentPage: number,
  setCurrentPage: (page: number) => void
) {
  const [pagesHtml, setPagesHtml] = useState<string[]>([]);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const buildTimer = useRef<number | null>(null);

  // Create page structure with header, content, footer
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

  // Check if node fits inside usable height
  const nodeFits = (
    node: Node,
    currentContentWrap: HTMLElement,
    usableHeight: number
  ) => {
    const clone = node.cloneNode(true);
    currentContentWrap.appendChild(clone);
    const fits = currentContentWrap.scrollHeight <= usableHeight;
    if (!fits) currentContentWrap.removeChild(clone);
    return fits;
  };

  // Binary search to split text node so that part fits inside height
  const splitTextNodeToFit = (
    textNode: Text,
    currentContentWrap: HTMLElement,
    usableHeight: number
  ): [Text, Text] => {
    const text = textNode.textContent || "";
    let low = 0,
      high = text.length,
      cut = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const prefix = document.createTextNode(text.slice(0, mid));
      currentContentWrap.appendChild(prefix);
      const fits = currentContentWrap.scrollHeight <= usableHeight;
      currentContentWrap.removeChild(prefix);
      if (fits) {
        cut = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const first = document.createTextNode(text.slice(0, cut || 1));
    const rest = document.createTextNode(text.slice(cut || 1));
    return [first, rest];
  };

  // Main function to build pages from HTML string
  const buildPagesFromHtml = useCallback(
    (html: string) => {
      if (!measureRef.current) {
        setPagesHtml([html]);
        return;
      }
      const measureRoot = measureRef.current;
      measureRoot.innerHTML = "";

      // Create probe page to measure usable content height
      const probe = createPageEl();
      measureRoot.appendChild(probe.page);
      const usableHeight = probe.contentWrap.clientHeight;
      measureRoot.innerHTML = "";

      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      const nodes = Array.from(tmp.childNodes);

      const pages: string[] = [];
      const headingList: Heading[] = [];
      let current = createPageEl();

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        // Manual break <hr>
        if (
          node.nodeType === 1 &&
          (node as HTMLElement).tagName.toLowerCase() === "hr"
        ) {
          pages.push(current.contentWrap.innerHTML);
          current = createPageEl();
          continue;
        }

        if (nodeFits(node, current.contentWrap, usableHeight)) {
          // Track headings for TOC
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
            // Node too big for empty page
            if (node.nodeType === 3) {
              const [firstPart, rest] = splitTextNodeToFit(
                node as Text,
                current.contentWrap,
                usableHeight
              );
              current.contentWrap.appendChild(firstPart);
              pages.push(current.contentWrap.innerHTML);
              current = createPageEl();
              if (rest.textContent) current.contentWrap.appendChild(rest);
            } else {
              current.contentWrap.appendChild(node.cloneNode(true));
              pages.push(current.contentWrap.innerHTML);
              current = createPageEl();
            }
          } else {
            // Start new page and try again
            pages.push(current.contentWrap.innerHTML);
            current = createPageEl();
            if (nodeFits(node, current.contentWrap, usableHeight)) continue;
            else {
              if (node.nodeType === 3) {
                const [firstPart, rest] = splitTextNodeToFit(
                  node as Text,
                  current.contentWrap,
                  usableHeight
                );
                current.contentWrap.appendChild(firstPart);
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
    },
    [title, currentPage, setCurrentPage]
  );

  // Debounce build to avoid too frequent recalculations
  const debouncedBuild = useCallback(
    (html: string) => {
      if (buildTimer.current) window.clearTimeout(buildTimer.current);
      buildTimer.current = window.setTimeout(
        () => buildPagesFromHtml(html),
        200
      );
    },
    [buildPagesFromHtml]
  );

  return {
    pagesHtml,
    headings,
    measureRef,
    buildPages: debouncedBuild,
  };
}

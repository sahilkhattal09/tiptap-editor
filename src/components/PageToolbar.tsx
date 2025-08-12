"use client";

import { ZoomIn, ZoomOut } from "lucide-react";

interface PageToolbarProps {
  fontFamily: string;
  setFontFamily: (f: string) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  rulerEnabled: boolean;
  setRulerEnabled: (b: boolean) => void;
  zoomPercent: number;
  setZoom: (p: number) => void;
}

export default function PageToolbar({
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  rulerEnabled,
  setRulerEnabled,
  zoomPercent,
  setZoom,
}: PageToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-white">
      <button className="px-3 py-1 rounded hover:bg-gray-50 border">
        Header & Footer
      </button>
      <button className="px-3 py-1 rounded hover:bg-gray-50 border">
        Margins
      </button>
      <button
        className="px-3 py-1 rounded hover:bg-gray-50 border"
        onClick={() => setRulerEnabled(!rulerEnabled)}
      >
        {rulerEnabled ? "Hide Ruler" : "Show Ruler"}
      </button>
      <button className="px-3 py-1 rounded hover:bg-gray-50 border">
        Watermark
      </button>

      <select
        value={fontFamily}
        onChange={(e) => setFontFamily(e.target.value)}
        className="border px-2 py-1 rounded text-sm ml-4"
      >
        <option
          value={"Avenir Next, system-ui, -apple-system, 'Segoe UI', Roboto"}
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

      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setZoom(Math.max(20, zoomPercent - 10))}
          className="p-1 border rounded"
        >
          <ZoomOut size={14} />
        </button>
        <div className="px-2">{zoomPercent}%</div>
        <button
          onClick={() => setZoom(Math.min(300, zoomPercent + 10))}
          className="p-1 border rounded"
        >
          <ZoomIn size={14} />
        </button>
      </div>
    </div>
  );
}

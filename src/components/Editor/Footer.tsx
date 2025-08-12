import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FooterProps {
  chars: number;
  fontFamily: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function Footer({
  chars,
  fontFamily,
  currentPage,
  totalPages,
  onPageChange,
  zoomPercent,
  onZoomIn,
  onZoomOut,
}: FooterProps) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 bg-white">
      {/* Characters & Font */}
      <div className="flex items-center gap-4 text-xs">
        <div>{chars} characters</div>
        <div className="text-gray-500">Font: {fontFamily.split(",")[0]}</div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-3">
        <ChevronLeft
          size={18}
          className="cursor-pointer"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        />
        <div className="text-sm">
          Page {currentPage} of {totalPages || 1}
        </div>
        <ChevronRight
          size={18}
          className="cursor-pointer"
          onClick={() =>
            onPageChange(Math.min(currentPage + 1, totalPages || 1))
          }
        />
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="px-2 py-1 border rounded text-xs"
        >
          -
        </button>
        <div className="text-xs">{zoomPercent}%</div>
        <button onClick={onZoomIn} className="px-2 py-1 border rounded text-xs">
          +
        </button>
      </div>
    </div>
  );
}

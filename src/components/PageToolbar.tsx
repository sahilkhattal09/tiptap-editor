"use client";

import { ZoomIn, ZoomOut, LayoutGrid, SlidersHorizontal } from "lucide-react";

const PageToolbar = () => {
  return (
    <div className="flex items-center gap-4 border-b pb-2 mb-4 text-sm text-gray-700">
      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <button className="p-1 rounded hover:bg-gray-100">
          <ZoomOut size={16} />
        </button>
        <span className="px-2">100%</span>
        <button className="p-1 rounded hover:bg-gray-100">
          <ZoomIn size={16} />
        </button>
      </div>

      {/* View Options */}
      <button className="flex items-center gap-1 p-1 rounded hover:bg-gray-100">
        <LayoutGrid size={16} />
        <span>Grid View</span>
      </button>

      {/* Page Settings */}
      <button className="flex items-center gap-1 p-1 rounded hover:bg-gray-100 ml-auto">
        <SlidersHorizontal size={16} />
        <span>Settings</span>
      </button>
    </div>
  );
};

export default PageToolbar;

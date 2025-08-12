"use client";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

interface TextToolbarProps {
  editor: any; // you can import Editor type from @tiptap/react if you want
  insertPageBreak: () => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  chars: number;
}

export default function TextToolbar({
  editor,
  insertPageBreak,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  chars,
}: TextToolbarProps) {
  return (
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

      <div className="text-xs text-gray-600">{chars} characters</div>
    </div>
  );
}

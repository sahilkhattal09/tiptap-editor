// components/Editor/EditorToolbar.tsx
"use client";

const EditorToolbar = () => {
  return (
    <div className="flex gap-2 items-center border-b pb-2 mb-4">
      <select className="border p-1 rounded text-sm">
        <option>Avenir Next</option>
        <option>Roboto</option>
      </select>
      <select className="border p-1 rounded text-sm">
        <option>12</option>
        <option>14</option>
        <option>16</option>
      </select>
      <button className="font-bold">B</button>
      <button className="italic">I</button>
      <button className="underline">U</button>
    </div>
  );
};

export default EditorToolbar;

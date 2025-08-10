import EditorToolbar from "./EditorToolbar";

const TiptapEditor = () => {
  return (
    <div>
      <EditorToolbar />
      <div className="border p-4 min-h-[400px]" contentEditable>
        Start writing here...
      </div>
    </div>
  );
};

export default TiptapEditor;

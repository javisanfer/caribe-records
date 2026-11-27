import EditorialLinkButton from "./editorial-link-button";
import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const editorExtensions = [
  StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, defaultProtocol: "https" } }),
  Placeholder.configure({ placeholder: "Empieza a escribir…" }),
];

function ToolButton({ active, label, title, onClick, disabled }) {
  return <button type="button" className={active ? "is-active" : ""} aria-pressed={active}
    aria-label={title} title={title} disabled={disabled}
    onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{label}</button>;
}

export default function RichTextEditor({ value, onChange, label, allowLinks = false }) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: value || "",
    immediatelyRender: false,
    onCreate: ({ editor: instance }) => {
      const article = instance.view.dom.closest("article");
      if (article && article === document.activeElement) instance.commands.focus("start");
    },
    editorProps: { attributes: { role: "textbox", "aria-multiline": "true", "aria-label": label } },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML(), currentEditor.getText({ blockSeparator: "\n\n" })),
  });
  useEffect(() => {
    if (editor && (value || !editor.isEmpty) && value !== editor.getHTML()) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);
  if (!editor) return null;
  return <div className="magazine-rich-block">
    <FormatToolbar editor={editor} allowLinks={allowLinks} />
    <EditorContent editor={editor} />
  </div>;
}

function FormatToolbar({ editor, allowLinks }) {
  const formatting = useEditorState({ editor, selector: ({ editor: e }) => e && ({
    style: e.isActive("heading", { level: 2 }) ? "2" : e.isActive("heading", { level: 3 }) ? "3" : "p",
    bold: e.isActive("bold"), italic: e.isActive("italic"), bullet: e.isActive("bulletList"),
    link: e.isActive("link"), hasSelection: !e.state.selection.empty,
    numbered: e.isActive("orderedList"), undo: e.can().undo(), redo: e.can().redo(),
  }) });
  return (
      <div className="magazine-toolbar" role="group" aria-label="Formato del texto">
        <select aria-label="Estilo del texto" value={formatting.style} onChange={(event) => {
          const chain = editor.chain().focus();
          if (event.target.value === "p") chain.setParagraph().run();
          else chain.setHeading({ level: Number(event.target.value) }).run();
        }}>
          <option value="p">Párrafo</option><option value="2">Título de sección</option><option value="3">Subtítulo</option>
        </select>
        <i aria-hidden="true" />
        <ToolButton label={<strong>B</strong>} title="Negrita" active={formatting.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolButton label={<em>I</em>} title="Cursiva" active={formatting.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
        {allowLinks && <EditorialLinkButton editor={editor} active={formatting.link} hasSelection={formatting.hasSelection} />}
        <ToolButton label="• Lista" title="Lista con viñetas" active={formatting.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolButton label="1. Lista" title="Lista numerada" active={formatting.numbered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolButton label="❝" title="Cita en el texto" onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <i aria-hidden="true" />
        <ToolButton label="↶" title="Deshacer escritura" disabled={!formatting.undo} onClick={() => editor.chain().focus().undo().run()} />
        <ToolButton label="↷" title="Rehacer escritura" disabled={!formatting.redo} onClick={() => editor.chain().focus().redo().run()} />
      </div>
  );
}

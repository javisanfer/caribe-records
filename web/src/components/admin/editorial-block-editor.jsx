import React, { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadImage } from "../../services/api-services";
import { createTextBlock, makeEditorialBlockId } from "./editorial-block-utils";

const editorExtensions = [
  StarterKit.configure({ heading: { levels: [2, 3] } }),
  Placeholder.configure({ placeholder: "Escribe un párrafo, una escena o una idea…" }),
];

function ToolButton({ active = false, label, title, onClick }) {
  return <button type="button" className={active ? "is-active" : ""} aria-label={title} title={title} onMouseDown={(event) => { event.preventDefault(); onClick(); }}>{label}</button>;
}

function RichTextBlock({ block, onChange }) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: block.text,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => onChange({ ...block, text: currentEditor.getHTML() }),
  });

  useEffect(() => {
    if (editor && block.text !== editor.getHTML()) editor.commands.setContent(block.text || "", { emitUpdate: false });
  }, [block.text, editor]);

  if (!editor) return null;
  return (
    <div className="magazine-rich-block">
      <div className="magazine-toolbar" role="toolbar" aria-label="Formato del texto">
        <ToolButton label={<strong>B</strong>} title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolButton label={<em>I</em>} title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <i />
        <ToolButton label="H2" title="Título de sección" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolButton label="H3" title="Subtítulo" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <ToolButton label="❝" title="Entrecomillado destacado" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <ToolButton label="—" title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        <i />
        <ToolButton label="↶" title="Deshacer" onClick={() => editor.chain().focus().undo().run()} />
        <ToolButton label="↷" title="Rehacer" onClick={() => editor.chain().focus().redo().run()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ImageBlock({ block, onChange }) {
  const [uploading, setUploading] = useState(false);
  const image = block.image || {};
  const updateImage = (key, value) => onChange({ ...block, image: { ...image, [key]: value } });
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const response = await uploadImage(file);
      updateImage("url", response.imageUrl);
    } catch (error) {
      console.error(error);
      alert("No se pudo subir la imagen.");
    } finally { setUploading(false); }
  };

  return (
    <div className="magazine-image-block">
      <div className="magazine-image-block__preview">
        {image.url ? <img src={image.url} alt={image.alt || "Vista previa"} /> : <div><span>＋</span><p>Añade una fotografía</p></div>}
      </div>
      <div className="magazine-image-block__fields">
        <label className="magazine-file-button">{uploading ? "Subiendo…" : "Seleccionar imagen"}<input type="file" accept="image/*" disabled={uploading} onChange={handleFile} /></label>
        <input type="url" className="form-control" value={image.url || ""} onChange={(event) => updateImage("url", event.target.value)} placeholder="O pega la URL de la imagen" aria-label="URL de imagen" />
        <input className="form-control" value={image.caption || ""} onChange={(event) => updateImage("caption", event.target.value)} placeholder="Título o pie de foto" aria-label="Título o pie de foto" />
        <div className="admin-field-grid admin-field-grid--2">
          <input className="form-control" value={image.credit || ""} onChange={(event) => updateImage("credit", event.target.value)} placeholder="Crédito / autor" aria-label="Crédito de imagen" />
          <input className="form-control" value={image.alt || ""} onChange={(event) => updateImage("alt", event.target.value)} placeholder="Texto alternativo" aria-label="Texto alternativo" />
        </div>
      </div>
    </div>
  );
}

function QuoteBlock({ block, onChange }) {
  return (
    <div className="magazine-quote-block">
      <span aria-hidden="true">“</span>
      <textarea rows={4} className="form-control" value={block.quote || ""} onChange={(event) => onChange({ ...block, quote: event.target.value })} placeholder="Escribe la cita destacada…" aria-label="Cita destacada" />
      <input className="form-control" value={block.cite || ""} onChange={(event) => onChange({ ...block, cite: event.target.value })} placeholder="Autor o fuente de la cita" aria-label="Autor de la cita" />
    </div>
  );
}

export default function EditorialBlockEditor({ blocks, onChange }) {
  const updateBlock = (index, nextBlock) => onChange(blocks.map((block, blockIndex) => blockIndex === index ? nextBlock : block));
  const insertBlock = (index, type) => {
    const nextBlock = type === "paragraph" ? createTextBlock() : type === "image" ? { id: makeEditorialBlockId(), type, image: { url: "", alt: "", caption: "", credit: "" } } : type === "quote" ? { id: makeEditorialBlockId(), type, quote: "", cite: "" } : { id: makeEditorialBlockId(), type: "separator" };
    onChange([...blocks.slice(0, index + 1), nextBlock, ...blocks.slice(index + 1)]);
  };
  const moveBlock = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const removeBlock = (index) => {
    if (blocks.length === 1) return onChange([createTextBlock()]);
    onChange(blocks.filter((_, blockIndex) => blockIndex !== index));
  };

  return (
    <div className="magazine-editor">
      <div className="magazine-editor__top"><div><span>CUERPO / BLOQUES</span><b>{blocks.length} {blocks.length === 1 ? "bloque" : "bloques"}</b></div><p>Combina texto, citas e imágenes como en una revista.</p></div>
      <div className="magazine-blocks">
        {blocks.map((block, index) => (
          <article className={`magazine-block magazine-block--${block.type}`} key={block.id || `${block.type}-${index}`}>
            <div className="magazine-block__rail"><span>{String(index + 1).padStart(2, "0")}</span><div><button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} aria-label="Subir bloque">↑</button><button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} aria-label="Bajar bloque">↓</button><button type="button" onClick={() => removeBlock(index)} aria-label="Eliminar bloque">×</button></div></div>
            <div className="magazine-block__content">
              {block.type === "paragraph" && <RichTextBlock block={block} onChange={(next) => updateBlock(index, next)} />}
              {block.type === "image" && <ImageBlock block={block} onChange={(next) => updateBlock(index, next)} />}
              {block.type === "quote" && <QuoteBlock block={block} onChange={(next) => updateBlock(index, next)} />}
              {block.type === "separator" && <div className="magazine-separator"><span /><p>Separador editorial</p><span /></div>}
            </div>
            <div className="magazine-insert" aria-label="Insertar bloque después"><span>Añadir</span><button type="button" onClick={() => insertBlock(index, "paragraph")}>Texto</button><button type="button" onClick={() => insertBlock(index, "quote")}>Cita</button><button type="button" onClick={() => insertBlock(index, "image")}>Imagen</button><button type="button" onClick={() => insertBlock(index, "separator")}>Separador</button></div>
          </article>
        ))}
      </div>
    </div>
  );
}

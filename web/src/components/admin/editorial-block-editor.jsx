import EditorialPlayer from "../editorials/editorial-player";
import { editorialEmbed } from "../../utils/editorial-embed";
import { imageUrlInput } from "./image-url-input";
import React, { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadImage } from "../../services/api-services";
import { createTextBlock, makeEditorialBlockId } from "./editorial-block-utils";

const editorExtensions = [
  StarterKit.configure({ heading: { levels: [2, 3] } }),
  Placeholder.configure({ placeholder: "Empieza a escribir…" }),
];

function ToolButton({ active, label, title, onClick, disabled }) {
  return <button type="button" className={active ? "is-active" : ""} aria-pressed={active}
    aria-label={title} title={title} disabled={disabled}
    onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{label}</button>;
}

function RichTextBlock({ block, onChange }) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: block.text || "",
    immediatelyRender: false,
    onCreate: ({ editor: instance }) => {
      const article = instance.view.dom.closest("article");
      if (article && article === document.activeElement) instance.commands.focus("start");
    },
    editorProps: { attributes: { role: "textbox", "aria-multiline": "true", "aria-label": "Cuerpo del artículo" } },
    onUpdate: ({ editor: currentEditor }) => onChange({ ...block, text: currentEditor.getHTML() }),
  });
  useEffect(() => {
    if (editor && (block.text || !editor.isEmpty) && block.text !== editor.getHTML()) editor.commands.setContent(block.text || "", { emitUpdate: false });
  }, [block.text, editor]);
  if (!editor) return null;
  return <div className="magazine-rich-block">
    <FormatToolbar editor={editor} />
    <EditorContent editor={editor} />
  </div>;
}

function FormatToolbar({ editor }) {
  const formatting = useEditorState({ editor, selector: ({ editor: e }) => e && ({
    style: e.isActive("heading", { level: 2 }) ? "2" : e.isActive("heading", { level: 3 }) ? "3" : "p",
    bold: e.isActive("bold"), italic: e.isActive("italic"), bullet: e.isActive("bulletList"),
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
        <ToolButton label="• Lista" title="Lista con viñetas" active={formatting.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolButton label="1. Lista" title="Lista numerada" active={formatting.numbered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolButton label="❝" title="Cita en el texto" onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <i aria-hidden="true" />
        <ToolButton label="↶" title="Deshacer escritura" disabled={!formatting.undo} onClick={() => editor.chain().focus().undo().run()} />
        <ToolButton label="↷" title="Rehacer escritura" disabled={!formatting.redo} onClick={() => editor.chain().focus().redo().run()} />
      </div>
  );
}

const blockLabels = {
  paragraph: "Texto", heading: "Encabezado", image: "Imagen", gallery: "Galería",
  quote: "Cita", embed: "Incrustar contenido", separator: "Separador",
};

function InsertBlock({ onInsert }) {
  const menu = useRef(null);
  return <details className="editor-inserter" ref={menu} onKeyDown={(event) => {
    if (event.key === "Escape" && menu.current.open) {
      menu.current.open = false;
      menu.current.querySelector("summary").focus();
      event.stopPropagation();
    }
  }}>
    <summary><span aria-hidden="true">＋</span> Añadir bloque</summary>
    <div className="editor-inserter__choices">
      {Object.entries(blockLabels).map(([type, label]) => <button key={type} type="button" onClick={() => {
        menu.current.open = false;
        onInsert(type);
      }}>{label}</button>)}
    </div>
  </details>;
}

function MediaBlock({ value, onChange }) {
  const media = editorialEmbed(value);
  return <div className="editor-media-block">
    <label>Enlace o código iframe
      <textarea rows={2} className="form-control" placeholder="Pega el enlace o el código de inserción" value={value || ""}
        onChange={(event) => onChange(event.target.value)} />
    </label>
    {media?.src ? <EditorialPlayer media={media} preview />
      : value?.trim() && <small role="status">{media?.href ? "Este enlace se mostrará como enlace externo." : "Pega un enlace completo o el iframe de YouTube, Spotify o Internet Archive."}</small>}
  </div>;
}

function ImageBlock({ block, onChange, setBusy }) {
  const [uploading, setUploading] = useState(false);
  const image = block.image || {};
  const updateImage = (key, value) => onChange({ ...block, image: { ...image, [key]: value } });
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      setUploading(true);
      const response = await uploadImage(file);
      updateImage("url", response.imageUrl);
    } catch (error) {
      console.error(error);
      alert("No se pudo subir la imagen.");
    } finally { setUploading(false); setBusy(false); }
  };

  return (
    <div className="magazine-image-block">
      <div className="magazine-image-block__preview">
        {image.url ? <img src={image.url} alt={image.alt || "Vista previa"} /> : <div><span>＋</span><p>Añade una fotografía</p></div>}
      </div>
      <div className="magazine-image-block__fields">
        <label className="magazine-file-button">{uploading ? "Subiendo…" : "Seleccionar imagen"}<input type="file" accept="image/*" disabled={uploading} onChange={handleFile} /></label>
        <input {...imageUrlInput} className="form-control" value={image.url || ""} onChange={(event) => updateImage("url", event.target.value)} placeholder="O pega la URL de la imagen" aria-label="URL de imagen" />
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

export default function EditorialBlockEditor({ blocks, onChange, busy, setBusy }) {
  const canvas = useRef(null);
  const focusNext = useRef(null);
  useEffect(() => {
    if (!focusNext.current) return;
    const target = Array.from(canvas.current.querySelectorAll("article")).find((node) => node.dataset.block === focusNext.current);
    const focusable = target?.querySelector('.magazine-block__content [contenteditable="true"], .magazine-block__content textarea, .magazine-block__content input:not([type="file"]), .magazine-block__content button');
    (focusable || target)?.focus();
    focusNext.current = null;
  }, [blocks]);
  const updateBlock = (index, nextBlock) => {
    const id = blocks[index].id;
    onChange((current) => current.map((block) => block.id === id ? nextBlock : block));
  };
  const insertBlock = (index, type) => {
    const nextBlock = { id: makeEditorialBlockId(), type };
    focusNext.current = nextBlock.id;
    if (type === "gallery") nextBlock.gallery = [];
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
      <fieldset className="magazine-blocks" disabled={busy} ref={canvas} aria-label="Bloques del artículo">
        {blocks.map((block, index) => (
          <article className={`magazine-block magazine-block--${block.type}`} data-block={block.id} tabIndex={-1} key={block.id}>
            <div className="editor-block-bar">
              <span>{blockLabels[block.type]}</span>
              <div>
                <button type="button" title="Subir bloque" aria-label="Subir bloque" disabled={busy || index === 0} onClick={() => moveBlock(index, -1)}>↑</button>
                <button type="button" title="Bajar bloque" aria-label="Bajar bloque" disabled={busy || index === blocks.length - 1} onClick={() => moveBlock(index, 1)}>↓</button>
                <button type="button" title="Eliminar bloque" aria-label="Eliminar bloque" onClick={() => removeBlock(index)}>×</button>
              </div>
            </div>
            <div className="magazine-block__content">
              {block.type === "paragraph" && <RichTextBlock block={block} onChange={(next) => updateBlock(index, next)} />}
              {block.type === "image" && <ImageBlock setBusy={setBusy} block={block} onChange={(next) => updateBlock(index, next)} />}
              {block.type === "heading" && <div className="admin-field-grid">
                <label>Nivel<select value={block.level || 2} onChange={(event) => updateBlock(index, { ...block, level: Number(event.target.value) })}><option value={2}>H2</option><option value={3}>H3</option></select></label>
                <label>Encabezado<input required className="form-control" value={block.text || ""} onChange={(event) => updateBlock(index, { ...block, text: event.target.value })} /></label>
              </div>}
              {block.type === "embed" && <MediaBlock value={block.embed} onChange={(embed) => updateBlock(index, { ...block, embed })} />}
              {block.type === "gallery" && <div>
                {block.gallery.map((image, position) => <div key={position}>
                  <ImageBlock setBusy={setBusy} block={{ image }} onChange={(value) => updateBlock(index, { ...block, gallery: block.gallery.map((item, i) => i === position ? value.image : item) })} />
                  <button type="button" onClick={() => updateBlock(index, { ...block, gallery: block.gallery.filter((_, i) => i !== position) })}>Quitar fotografía</button>
                </div>)}
                <button type="button" onClick={() => updateBlock(index, { ...block, gallery: [...block.gallery, { url: "" }] })}>Añadir fotografía</button>
              </div>}
              {block.type === "quote" && <QuoteBlock block={block} onChange={(next) => updateBlock(index, next)} />}
              {block.type === "separator" && <div className="magazine-separator"><span /><p>Separador editorial</p><span /></div>}
            </div>
            <InsertBlock onInsert={(type) => insertBlock(index, type)} />
          </article>
        ))}
      </fieldset>
    </div>
  );
}

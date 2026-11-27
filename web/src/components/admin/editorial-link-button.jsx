import { useId, useRef, useState } from "react";
import "./editorial-link-button.css";

function webAddress(value) {
  const input = value.trim();
  if (!input || /\s/.test(input)) return null;
  const hasProtocol = /^https?:\/\//i.test(input);
  if (!hasProtocol && !/^[\w-]+(?:\.[\w-]+)+(?::\d+)?(?:[/?#]|$)/u.test(input)) return null;
  try {
    return new URL(hasProtocol ? input : `https://${input}`).href;
  } catch {
    return null;
  }
}

export default function EditorialLinkButton({ editor, active, hasSelection }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const range = useRef(null);
  const title = useId();
  const [error, setError] = useState("");

  function open() {
    const { from, to } = editor.state.selection;
    range.current = { from, to };
    input.current.value = editor.getAttributes("link").href || "";
    setError("");
    dialog.current.showModal();
    input.current.select();
  }

  function close() {
    dialog.current.close();
    editor.commands.focus();
  }

  function apply(remove = false) {
    const href = remove ? null : webAddress(input.current.value);
    if (!remove && !href) {
      setError("Introduce una dirección web válida, por ejemplo https://bandcamp.com.");
      input.current.focus();
      return;
    }
    const selection = range.current;
    const chain = editor.chain().setTextSelection(selection);
    if (selection.from === selection.to) chain.extendMarkRange("link");
    if (remove) chain.unsetLink().run();
    else chain.setLink({ href }).run();
    close();
  }

  return <>
    <button type="button" className={active ? "is-active" : ""} aria-haspopup="dialog"
      disabled={!active && !hasSelection} title={active ? "Editar enlace" : "Selecciona el texto que quieras enlazar"}
      onMouseDown={(event) => event.preventDefault()} onClick={open}>Enlace</button>
    <dialog className="editor-link-dialog" ref={dialog} aria-labelledby={title}
      onCancel={(event) => { event.preventDefault(); close(); }}>
      <h3 id={title}>{active ? "Editar enlace" : "Añadir enlace"}</h3>
      <label>Dirección web
        <input ref={input} type="text" inputMode="url" autoCapitalize="none" spellCheck={false}
          className="form-control" placeholder="https://" aria-invalid={Boolean(error)}
          aria-describedby={error ? `${title}-error` : undefined}
          onChange={() => setError("")}
          onKeyDown={(event) => {
            if (event.key === "Enter") { event.preventDefault(); apply(); }
          }} />
      </label>
      {error && <p id={`${title}-error`} role="alert">{error}</p>}
      <div className="editor-link-dialog__actions">
        {active && <button type="button" onClick={() => apply(true)}>Quitar enlace</button>}
        <button type="button" onClick={close}>Cancelar</button>
        <button type="button" className="is-active" onClick={() => apply()}>Aplicar</button>
      </div>
    </dialog>
  </>;
}

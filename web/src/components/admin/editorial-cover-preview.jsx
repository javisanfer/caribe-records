import React, { useEffect, useState } from "react";

export default function EditorialCoverPreview({ file, url }) {
  const [local, setLocal] = useState(null);
  const [size, setSize] = useState(null);
  useEffect(() => {
    if (!file) return;
    const src = URL.createObjectURL(file);
    setLocal({ file, src });
    return () => URL.revokeObjectURL(src);
  }, [file]);
  const src = file ? (local?.file === file && local.src) : url;
  if (!src) return null;
  return <>
    <figure className="admin-image-preview">
      <img src={src} alt="Vista previa de la imagen principal" onLoad={({ currentTarget: img }) =>
        setSize({ src, width: img.naturalWidth, height: img.naturalHeight })} />
      <figcaption>{file ? "Imagen seleccionada" : "Imagen guardada"}
        {size?.src === src && ` · ${size.width} × ${size.height} px`}
      </figcaption>
    </figure>
    {size?.src === src && size.width < 1920 && <p className="form-text">
      Esta imagen puede perder nitidez a pantalla completa. Si tienes el original, elige una versión más ancha.
    </p>}
  </>;
}

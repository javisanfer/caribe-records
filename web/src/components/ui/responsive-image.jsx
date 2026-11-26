import React, { useState } from "react";

// Only transform Cloudinary's plain, versioned public upload URLs.
// Signed URLs, other providers and local uploads keep their original address.
function imageSources(src, widths) {
  const match = /^(https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\/)(v\d+\/[^?#]+)$/i.exec(src);
  if (!match) return undefined;
  return widths.map((width) =>
    `${match[1]}c_limit,w_${width},q_auto:good,f_auto/${match[2]} ${width}w`).join(", ");
}

export default function ResponsiveImage({ src, widths, sizes, onError, ...props }) {
  const [failedSource, setFailedSource] = useState(null);
  const sources = failedSource === src ? undefined : imageSources(src, widths);
  return <img {...props} src={src} srcSet={sources} sizes={sources ? sizes : undefined}
    onError={(event) => {
      if (sources) setFailedSource(src);
      else onError?.(event);
    }} />;
}

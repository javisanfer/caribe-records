import React, { useState } from "react";

// Keep signed URLs, other providers and local uploads untouched.
function imageSources(src, widths, resize, quality) {
  const match = /^(https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\/)(v\d+\/[^?#]+)$/i.exec(src);
  if (!match) return undefined;
  return widths.map((width) =>
    `${match[1]}${resize},w_${width},q_auto:${quality},f_auto/${match[2]} ${width}w`).join(", ");
}

export default function ResponsiveImage({ src, widths, sizes, cover = false, onError, ...props }) {
  const [failedSource, setFailedSource] = useState(null);
  const sources = failedSource === src ? undefined :
    imageSources(src, widths, "c_limit", cover ? "best" : "good");
  const image = <img {...props} src={src} srcSet={sources} sizes={sources ? sizes : undefined}
    onError={(event) => {
      if (sources) setFailedSource(src);
      else onError?.(event);
    }} />;
  if (!cover) return image;
  return <picture>
    {sources && ["9/16", "3/4"].map(ratio => <source key={ratio} media={`(max-aspect-ratio: ${ratio})`} sizes="100vw"
      srcSet={imageSources(src, [480, 640, 828, 1080, 1280, 1600, 2048], `c_lfill,ar_${ratio.replace("/", ":")},g_center`, "best")} />)}
    {image}
  </picture>;
}

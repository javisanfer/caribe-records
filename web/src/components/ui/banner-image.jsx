import React, { useState } from "react";

// Only transform Cloudinary's plain, versioned public upload URLs.
// Signed URLs, other providers and local uploads keep their original address.
function bannerSources(src) {
  const match = /^(https:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\/)(v\d+\/[^?#]+)$/i.exec(src);
  if (!match) return undefined;
  return [480, 800, 1200].map((width) =>
    `${match[1]}c_limit,w_${width},q_auto:good,f_auto/${match[2]} ${width}w`).join(", ");
}

export default function BannerImage({ src }) {
  const [fallback, setFallback] = useState(false);
  const sources = !fallback ? bannerSources(src) : undefined;
  return <img alt="" src={src} srcSet={sources} sizes={sources ? "(max-width: 520px) min(400px, calc(100vw - 24px)), (max-width: 644px) 34vw, 210px" : undefined}
    fetchPriority="high" onError={() => { if (sources) setFallback(true); }} />;
}

import React from "react";
import ResponsiveImage from "./responsive-image";

export default function BannerImage({ src }) {
  return <ResponsiveImage alt="" src={src} widths={[480, 800, 1200]}
    sizes="(max-width: 520px) min(400px, calc(100vw - 24px)), (max-width: 644px) 34vw, 210px"
    fetchPriority="high" />;
}

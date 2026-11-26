import React, { useState } from "react";

export default function ListenLink({ href, children, ...props }) {
  const [touchInput, setTouchInput] = useState(false);
  const [tapped, setTapped] = useState(false);

  function rememberPointer(event) {
    setTouchInput(event.pointerType === "touch");
    setTapped(false);
  }

  return (
    <a
      {...props}
      data-outbound={href ? "listen" : undefined}
      href={href}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      data-touch={touchInput || undefined}
      data-tapped={tapped || undefined}
      onPointerEnter={rememberPointer}
      onPointerDown={rememberPointer}
      onClick={(event) => {
        // A native click follows a completed tap. A scroll or pinch cancels it.
        if (href && event.detail > 0 && touchInput) setTapped(true);
      }}
      onAnimationEnd={() => setTapped(false)}
    >
      {children}
    </a>
  );
}

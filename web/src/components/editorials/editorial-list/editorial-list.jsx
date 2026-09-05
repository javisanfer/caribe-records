import React from "react";
import EditorialItem from "../editorial-item/editorial-item";

export default function EditorialList({ editorials = [] }) {
  if (!editorials.length) {
    return <p className="public-index__status">No hay artículos editoriales.</p>;
  }

  return (
    <section className="editorial-list">
      <div className="editorial-index">
        {editorials.map((item, index) => (
          <div key={item.id || item._id || item.slug}>
            <EditorialItem editorial={item} index={index + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}

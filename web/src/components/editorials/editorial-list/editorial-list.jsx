import React from "react";
import EditorialItem from "../editorial-item/editorial-item";

export default function EditorialList({ editorials = [] }) {
  if (!editorials.length) {
    return <p className="public-index__status">No hay artículos editoriales.</p>;
  }

  return (
    <section className="editorial-list">
      <div className={`editorial-index${editorials.length === 1 ? " editorial-index--single" : ""}`}>
        {editorials.map((item, index) => (
          <div className="admin-edit-context" key={item.id || item._id || item.slug}>
            <EditorialItem editorial={item} index={index + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}

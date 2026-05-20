import React from "react";
import EditorialItem from "../editorial-item/editorial-item";

export default function EditorialList({ editorials = [] }) {
  if (!editorials.length) {
    return <p className="text-muted">No hay artículos editoriales.</p>;
  }

  return (
    <section className="editorial-list container-fluid px-0 bg-black text-white">
      <div className="row g-0">
        {editorials.map((item) => (
          <div key={item.id} className="col-12 col-md-6 border-dark border-1 border-bottom border-end">
            <EditorialItem editorial={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
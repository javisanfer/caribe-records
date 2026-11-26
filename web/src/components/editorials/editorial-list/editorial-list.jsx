import React from "react";
import EditorialItem from "../editorial-item/editorial-item";
import AdminEditLink from "../../admin/admin-edit-link";

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
            {item.slug && <AdminEditLink to={`/admin/edit-editorial/${encodeURIComponent(item.slug)}`} label={item.title} />}
          </div>
        ))}
      </div>
    </section>
  );
}

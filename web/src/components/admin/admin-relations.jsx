import React from "react";

export default function AdminRelations({ title, items, selected = [], onChange }) {
  return <fieldset className="admin-relations">
    <legend className="form-label">{title}</legend>
    {items.map((item) => <label key={item._id}>
      <input type="checkbox" checked={selected.includes(item._id)}
        onChange={(event) => onChange(event.target.checked
          ? [...selected, item._id] : selected.filter((id) => id !== item._id))} />
      {item.name || item.title}
    </label>)}
  </fieldset>;
}

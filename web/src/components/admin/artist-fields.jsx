import { useFieldArray } from "react-hook-form";
import AdminImagePreview from "./admin-image-preview";
import { imageUrlInput } from "./image-url-input";

export function ArtistListFields({ name, title, columns, control, register, watch }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <section className="admin-form-card">
      <h2>{title}</h2>
      {fields.map((field, index) => (
        <fieldset className="admin-field-grid admin-field-grid--2 artist-field-row" key={field.id}>
          {name === "gallery" && <AdminImagePreview src={watch(`gallery.${index}.url`)} alt="" />}
          {columns.map(({ key, label, type, options, required, ...props }) => (
            <label key={key} className="admin-field">{label}
              {options ? (
                <select className="form-select" {...register(`${name}.${index}.${key}`)}>
                  {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                </select>
              ) : (
                <input className="form-control" type={type === "imageUrl" ? "text" : type || "text"} required={required}
                  {...(type === "imageUrl" ? imageUrlInput : {})} {...props}
                  {...register(`${name}.${index}.${key}`)} />
              )}
            </label>
          ))}
          <button className="btn admin-secondary-action" type="button" onClick={() => remove(index)}>Quitar</button>
        </fieldset>
      ))}
      <button className="btn admin-secondary-action" type="button" onClick={() => append(Object.fromEntries(
        columns.map(({ key, options }) => [key, options?.[0][0] || ""])
      ))}>Añadir {title.toLowerCase()}</button>
    </section>
  );
}

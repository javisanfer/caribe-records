import { useFieldArray } from "react-hook-form";

export function ArtistListFields({ name, title, columns, control, register }) {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <section className="admin-form-card">
      <h2>{title}</h2>
      {fields.map((field, index) => (
        <fieldset className="admin-field-grid admin-field-grid--2 artist-field-row" key={field.id}>
          {columns.map(({ key, label, type, options, required, ...props }) => (
            <label key={key} className="admin-field">{label}
              {options ? (
                <select className="form-select" {...register(`${name}.${index}.${key}`)}>
                  {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                </select>
              ) : (
                <input className="form-control" type={type || "text"} required={required}
                  {...props}
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

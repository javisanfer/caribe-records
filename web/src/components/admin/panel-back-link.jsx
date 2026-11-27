import { Link } from "react-router-dom";

export default function PanelBackLink() {
  return <Link className="admin-back" to="/admin"><span aria-hidden="true">← </span>Volver al panel</Link>;
}

import PanelBackLink from "./panel-back-link";

export default function AdminFormHeading({ title, children }) {
  return <header className="cms-form-heading">
    <PanelBackLink />
    <h1>{title}</h1>
    {children}
  </header>;
}

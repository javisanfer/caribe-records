import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePageMeta } from "../utils/page-meta";
import ReleaseItem from "../components/releases/release-item/release-item";
import SiteLoader from "../components/ui/site-loader";

export default function CatalogueDetail({ event = false }) {
  const { key } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const parent = event ? "/eventos" : "/releases";
  useEffect(() => {
    const controller = new AbortController();
    const endpoint = event ? "events/slug/" : "releases/";
    fetch("/api/v1/" + endpoint + encodeURIComponent(key), { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "No se ha encontrado esta ficha." : "No se ha podido cargar la ficha.");
        return r.json();
      }).then(setItem).catch((e) => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [key, event]);
  usePageMeta(parent + "/" + encodeURIComponent(key), item?.title, event ? item?.description : item?.artistName, item?.posterUrl || item?.cover?.url);
  if (error) return <main className="detail-state" role="alert">{error} <Link to={parent}>Volver</Link></main>;
  if (!item) return <SiteLoader />;
  return <main className="public-index">
    <Link className="detail-back-link" to={parent}>← {event ? "Eventos" : "Catálogo"}</Link>
    <h1>{item.title}</h1>
    {event ? <article>
      <p>{[item.artistName || item.lineup?.map((a) => a.name).join(", "), item.venue, item.city].filter(Boolean).join(" · ")}</p>
      <time dateTime={item.date}>{new Date(item.date).toLocaleDateString("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" })}</time>
      {item.description && <p>{item.description}</p>}
      {item.posterUrl && <img className="img-fluid" src={item.posterUrl} alt={`Cartel de ${item.title}`} />}
      {[[item.ticketUrl, "Entradas"], [item.sourceUrl, "Ver cartel"]].map(([href, label]) =>
        /^https?:\/\//i.test(href || "") && <p key={label}><a href={href} target="_blank" rel="noreferrer">{label} ↗</a></p>)}
    </article> : <ReleaseItem release={item} />}
  </main>;
}

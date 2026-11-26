import React from "react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return <main className="cr-privacy">
    <h1>Privacidad y cookies</h1>
    <p>Caribe Records utiliza una cookie técnica para el acceso al panel. El navegador también recuerda durante la sesión si has cerrado un anuncio.</p>
    <h2>Medición de audiencia</h2>
    <p>Si aceptas, Google Analytics 4 recibe las páginas públicas visitadas, el identificador público del contenido y los clics hacia servicios de escucha, entradas y tienda. Estas estadísticas nos ayudan a conocer el interés por los artistas, los lanzamientos y las editoriales. Un clic indica que has abierto un enlace. Las reproducciones y compras ocurren en las otras plataformas.</p>
    <p>Google presta el servicio de medición y recibe información técnica, como la dirección IP durante la conexión y datos del navegador. Usamos las cookies propias <code>_ga</code> y <code>_ga_…</code> para distinguir navegadores y sesiones, con una duración configurada de hasta 180 días. La integración está configurada sin señales de Google ni personalización de anuncios.</p>
    <p>Puedes aceptar, rechazar o retirar el consentimiento desde «Preferencias de cookies» en el pie. Guardamos tu elección en este navegador durante 180 días. Al retirar el permiso detenemos la medición y eliminamos las cookies analíticas del sitio.</p>
    <p>Para consultas sobre privacidad, escribe a <a href="mailto:hola@caribe-records.com">hola@caribe-records.com</a>. Puedes consultar también la <a href="https://policies.google.com/privacy?hl=es" rel="noreferrer" target="_blank">política de privacidad de Google</a>.</p>
    <Link to="/">Volver a la portada</Link>
  </main>;
}

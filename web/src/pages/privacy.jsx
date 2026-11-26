import React from "react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return <main className="cr-privacy">
    <h1>Aviso legal, privacidad y cookies</h1>
    <h2>Titular de la web</h2>
    <p>Javier Sánchez Fernández explota esta web como trabajador autónomo bajo el nombre comercial Caribe Records.</p>
    <address>
      {import.meta.env.VITE_LEGAL_NIF && <>NIF {import.meta.env.VITE_LEGAL_NIF}<br /></>}
      {import.meta.env.VITE_LEGAL_ADDRESS && <>{import.meta.env.VITE_LEGAL_ADDRESS}<br /></>}
      <a href="mailto:hola@caribe-records.com">hola@caribe-records.com</a>
    </address>
    <h2>Cookies técnicas</h2>
    <p>Caribe Records utiliza una cookie técnica para el acceso al panel. El navegador también recuerda durante la sesión si has cerrado un anuncio.</p>
    <h2>Medición de audiencia</h2>
    <p>Javier Sánchez Fernández, Julia Garrido Blanco y Pablo Villalba Gil decidimos conjuntamente qué actividad medimos en esta web y con qué finalidad. Los tres somos corresponsables del tratamiento de los datos de audiencia. La base jurídica de esta medición es tu consentimiento.</p>
    <p>Si aceptas, Google Analytics 4 recibe las páginas públicas visitadas, el identificador público del contenido y los clics hacia servicios de escucha, entradas y tienda. Estas estadísticas nos ayudan a conocer el interés por los artistas, los lanzamientos y las editoriales. Un clic indica que has abierto un enlace. Las reproducciones y compras ocurren en las otras plataformas.</p>
    <p>Google presta el servicio de medición y recibe información técnica, como la dirección IP durante la conexión y datos del navegador. Usamos las cookies propias <code>_ga</code> y <code>_ga_…</code> para distinguir navegadores y sesiones, con una duración configurada de hasta 180 días. La integración está configurada sin señales de Google ni personalización de anuncios.</p>
    <p>En GA4, el plazo de conservación es de dos meses para los datos de eventos y de catorce meses para los datos de usuario. Un nuevo evento reinicia el plazo del identificador de usuario. Los informes agregados pueden conservarse durante más tiempo.</p>
    <p>Google puede tratar datos fuera del Espacio Económico Europeo. Para las transferencias a Estados Unidos cubiertas por el Marco de Privacidad de Datos UE-EE. UU., Google se basa en la decisión de adecuación de la Comisión Europea. Cuando proceda, utiliza cláusulas contractuales tipo. Puedes consultar los mecanismos y las garantías en la <a href="https://business.safety.google/intl/es/adsdatatransfers/">información de Google sobre transferencias internacionales</a>.</p>
    <p>Puedes aceptar, rechazar o retirar el consentimiento desde «Preferencias de cookies» en el pie. Guardamos tu elección en este navegador durante 180 días. Al retirar el permiso detenemos la medición y eliminamos las cookies analíticas del sitio.</p>
    <p>Puedes consultar también la <a href="https://policies.google.com/privacy?hl=es" rel="noreferrer" target="_blank">política de privacidad de Google</a>.</p>
    <h2>Reproductores externos</h2>
    <p>Algunos artículos incluyen música o vídeos de YouTube, Spotify o Internet Archive. Al elegir cargar un reproductor, tu navegador se conecta con ese proveedor, que recibe tu dirección IP y puede usar cookies. Puedes seguir leyendo sin cargarlo.</p>
    <h2>Tus derechos</h2>
    <p>Puedes solicitar acceso a tus datos, su rectificación o supresión y, cuando corresponda, la limitación del tratamiento o la portabilidad. Puedes dirigirte a cualquiera de los tres corresponsables a través de nuestro correo común, <a href="mailto:hola@caribe-records.com">hola@caribe-records.com</a>. También puedes presentar una reclamación ante la <a href="https://www.aepd.es/">Agencia Española de Protección de Datos</a>.</p>
    <Link to="/">Volver a la portada</Link>
  </main>;
}

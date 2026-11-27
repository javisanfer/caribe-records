import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./privacy.css";

export default function Privacy({ onPreferences }) {
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <main className="public-index legal-page" aria-labelledby="legal-title">
      <header className="public-index__hero">
        <h1 className="public-index__title" id="legal-title">Información legal</h1>
        <nav className="legal-index" aria-label="Apartados de información legal">
          <a href="#aviso-legal">Aviso legal</a>
          <a href="#privacidad">Privacidad</a>
          <a href="#cookies">Cookies</a>
        </nav>
      </header>

      <section id="aviso-legal">
        <h2>Aviso legal</h2>
        <div>
          <p>Caribe Records es un sello de música popular independiente formado por Julia Garrido Blanco, Javier Sánchez Fernández y Pablo Villalba Gil.</p>
          <h3>Titular de la web</h3>
          <address>
            Javier Sánchez Fernández<br />
            {import.meta.env.VITE_LEGAL_NIF && <>NIF {import.meta.env.VITE_LEGAL_NIF}<br /></>}
            {import.meta.env.VITE_LEGAL_ADDRESS && <>{import.meta.env.VITE_LEGAL_ADDRESS}<br /></>}
            <a href="mailto:hola@caribe-records.com">hola@caribe-records.com</a>
          </address>
          <h3>Catálogo, entradas y tienda</h3>
          <p>En esta web puedes conocer a nuestros artistas, consultar el catálogo y los conciertos y leer las editoriales. Si pulsas «Escuchar», «Entradas» o «Tienda», irás al servicio enlazado. Aquí no se tramitan pedidos ni se recogen datos de pago. Antes de comprar, puedes consultar las condiciones que figuran en la tienda o en la plataforma de entradas.</p>
        </div>
      </section>

      <section id="privacidad">
        <h2>Política de privacidad</h2>
        <div>
          <h3>Quién decide qué se mide</h3>
          <p>Julia Garrido Blanco, Javier Sánchez Fernández y Pablo Villalba Gil decidimos juntos qué medir y para qué. Somos corresponsables de la medición de audiencia. Puedes dirigirte a cualquiera de los tres en <a href="mailto:hola@caribe-records.com">hola@caribe-records.com</a>.</p>
          <h3>Qué datos tratamos y para qué</h3>
          <p>Con tu consentimiento, usamos Google Analytics 4 para saber qué artistas, discos y editoriales se visitan y desde qué páginas se abren enlaces a servicios de escucha, entradas o tienda. Registramos la página pública, el contenido y la plataforma de destino. Las compras y reproducciones tienen lugar en esas plataformas.</p>
          <p>Google recibe información técnica de la conexión, como la dirección IP y datos del navegador. El panel de administración y el acceso y la recuperación de cuentas quedan fuera de la medición. Las funciones publicitarias y las señales de Google están desactivadas.</p>
          <h3>Conservación y transferencias</h3>
          <p>En GA4 conservamos los datos de eventos durante dos meses y los datos de usuario durante catorce meses. Un nuevo evento reinicia el plazo del identificador de usuario. Los informes agregados pueden conservarse durante más tiempo.</p>
          <p>Google puede tratar datos fuera del Espacio Económico Europeo. Para las transferencias a Estados Unidos cubiertas por el Marco de Privacidad de Datos UE-EE. UU., Google se basa en la decisión de adecuación de la Comisión Europea. Cuando procede, utiliza cláusulas contractuales tipo. Puedes consultar sus <a href="https://business.safety.google/intl/es/adsdatatransfers/">garantías para transferencias internacionales</a> y su <a href="https://policies.google.com/privacy?hl=es">política de privacidad</a>.</p>
          <h3>Tus derechos</h3>
          <p>Puedes solicitar el acceso, la rectificación o la supresión de tus datos y, cuando corresponda, su portabilidad o la limitación del tratamiento. Puedes retirar tu consentimiento en cualquier momento. La retirada se aplica desde ese momento. Para ejercer tus derechos, escribe a <a href="mailto:hola@caribe-records.com">hola@caribe-records.com</a>. También puedes reclamar ante la <a href="https://www.aepd.es/">Agencia Española de Protección de Datos</a>.</p>
        </div>
      </section>

      <section id="cookies">
        <h2>Política de cookies</h2>
        <div>
          {onPreferences
            ? <button className="legal-preferences" type="button" onClick={onPreferences}>Preferencias de cookies</button>
            : <p>La medición de audiencia está desactivada en este dominio.</p>}
          <h3>Funcionamiento de la web</h3>
          <p>Una cookie técnica permite iniciar sesión en el panel de administración. Si cierras un anuncio, el navegador lo recuerda durante esa sesión.</p>
          <h3>Cookies de audiencia</h3>
          <p>Solo si aceptas, Google Analytics utiliza las cookies <code>_ga</code> y <code>_ga_…</code> en nuestro dominio para distinguir navegadores y sesiones. Duran hasta 180 días. Si rechazas, puedes seguir navegando por toda la web.</p>
          <p>Guardamos tu elección en este navegador durante 180 días. Puedes cambiarla desde el botón «Preferencias de cookies» de este apartado. Al retirar el permiso detenemos la medición y borramos las cookies analíticas de nuestro dominio.</p>
          <h3>Servicios externos</h3>
          <p>La web enlaza a servicios externos como Spotify, Bandcamp, Apple Music y YouTube. Al aceptar en el aviso inicial, los artículos cargan automáticamente sus reproductores de YouTube, Spotify e Internet Archive. Si rechazas, puedes activar un reproductor concreto dentro del artículo. Al abrir un enlace o cargar un reproductor, tu navegador se conecta con el servicio, que recibe tu dirección IP y puede utilizar sus propias cookies. Puedes leer la editorial sin activar el reproductor.</p>
        </div>
      </section>
    </main>
  );
}

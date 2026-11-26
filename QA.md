# Entorno local de QA

## Revisión de la web y del panel

Con MongoDB local activo y las dependencias de `api` y `web` instaladas, ejecuta desde la raíz:

```bash
node api/scripts/review-local.js
```

Abre [la web de revisión](http://127.0.0.1:5185/) o [el panel](http://127.0.0.1:5185/admin/login). El programa solicita la contraseña local sin mostrarla (en ejecución desatendida usa `CARIBE_LOCAL_ADMIN_PASSWORD`). La terminal muestra el usuario y el resultado de las pruebas de escritura y relectura de las cinco secciones. Deja esa terminal abierta durante la revisión.

El primer arranque prepara `caribe_web_review_20261125` desde las colecciones de contenido de `caribe_records` en MongoDB de loopback. Si la copia es anterior a la publicación de noviembre, se incorporan las dos fichas de referencia y el contenido de lanzamiento del repositorio. Los siguientes arranques conservan las ediciones de revisión. Las imágenes que subas se guardan en `api/uploads/dev`. La API escucha en el puerto 3015 y Vite en el 5185.

### Resultados del 25 de noviembre de 2026

Desde el panel se crearon, editaron y volvieron a abrir registros en las cinco secciones. La copia local conserva las muestras identificadas con «QA local · 25 noviembre» para poder inspeccionarlas. El artista, el disco y el concierto quedaron ocultos, el editorial en borrador y el banner inactivo.

| Sección | Verificación realizada |
| --- | --- |
| Artistas | Cambio de género, enlace personalizado y foto de galería visibles en la ficha. |
| Lanzamientos | Relación de artista y pista conservadas. El número de catálogo editado volvió a aparecer al abrir el formulario. |
| Editoriales | Subtítulo y firma actualizados en la lectura pública. La asociación con el artista seguía marcada al reabrir el formulario. |
| Eventos | El cambio de sala apareció en el listado público de conciertos. |
| Banners | El aviso editado apareció en portada. Tras desactivarlo se recuperó el anuncio anterior. La subida desde archivo persistió y la API sirvió una imagen de 1200 × 814. |

Se revisaron el menú a 390 px, el archivo de eventos a 768 px y el catálogo a 1440 px. Pasaron las 27 pruebas de la API, el lint del frontend y las compilaciones Vite de producción y de pruebas.

La portada del artículo de Daniel Valcárcel y otras dos portadas del archivo local cargaron correctamente. El editorial histórico «Aeronave Adolescente: el sonido de la lluvia gallega» conserva una referencia de Cloudinary que no cargó en la revisión. Tampoco se localizó un original de Julia Garblan. La copia de revisión incluye contenidos históricos y puede diferir del sitio publicado.

[Captura del editorial de Aeronave Adolescente](docs/revision-editorial-2026-11-25.jpg)

## Entorno de pruebas anterior

La base de pruebas es `caribe_records_test`. Se ejecuta en puertos distintos y usa una cookie de sesión independiente para no mezclarse con el entorno local habitual.

## Reiniciar los datos de prueba

Desde `api/`:

```bash
npm run reset:test-db
```

El comando sustituye el contenido de la base de pruebas por una copia de `caribe_records`, sin copiar sesiones abiertas. Solo admite destinos cuyo nombre termina en `_test`.

## Arrancar el entorno

En una terminal:

```bash
cd api
npm run start:test
```

En otra terminal:

```bash
cd web
npm run dev:test
```

- Web de QA: `http://localhost:5174`
- API de QA: `http://localhost:3001/api/v1`
- Las imágenes subidas durante las pruebas se guardan en la carpeta `caribe-records-test` de Cloudinary.

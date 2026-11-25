# Auditoría técnica de Caribe Records

## Punto de partida

El catálogo de Amplify y el de https://caribe-records.com/releases mostraron 42 referencias y el anuncio de Ferrocentro. El dominio indicado inicialmente, cariberecords.es, devolvió NXDOMAIN en Google Public DNS. El dominio canónico propuesto es https://caribe-records.com. La comprobación pública fue de lectura.

La base de la propuesta es el commit b10af59 de main. Se reconstruyó en un checkout independiente y se contrastó el hash del árbol completo con GitHub. La rama local del equipo contenía trabajo previo. La propuesta conserva las correcciones publicadas de banners, fotografías, biografías y recuperación de contraseña.

## Hallazgos y cambios

| Prioridad | Problema observado | Cambio en la propuesta |
|---|---|---|
| Alta | La entrada de sesión aceptaba valores sin comprobar su tipo. El restablecimiento de contraseña dejaba vigentes las sesiones iniciadas. | Validación antes de consultar, invalidación con una versión de sesión y consumo atómico de la invitación. Las sesiones antiguas válidas se interpretan como versión cero. |
| Alta | Algunos fallos internos de MongoDB y del proveedor podían llegar al cliente o a los registros. El filtro de imágenes confiaba en el MIME declarado. | Respuestas JSON de error controladas, registros sin valores del documento y verificación de la firma antes de escribir. Cloudinary vuelve a comprobar el formato permitido. |
| Alta | Dominio solicitado sin resolución. Las fichas se compartían con el HTML genérico de la portada. | Dominio canónico verificado, HTML social de las fichas generado desde las publicaciones visibles. Sitemap dinámico, robots y páginas HTML para las secciones. Se requieren reglas explícitas en Amplify. |
| Media | La carga de la sesión bloqueaba todas las páginas. El bundle inicial incluía las demás páginas públicas y el formulario de acceso. | La sesión se resuelve en paralelo, las rutas privadas siguen esperando y las páginas secundarias se descargan al visitarlas. Se conservan las transiciones y las preferencias de movimiento reducido. |
| Media | El perfil de artista descargaba todo el catálogo. Las peticiones de perfil y lista eran consecutivas. | Filtro de artista aplicado en MongoDB y carga paralela de datos independientes. Se cancelan las lecturas al salir. |
| Media | Cada petición autenticada consultaba dos veces el usuario. Las sesiones abrían su propio cliente MongoDB. | Un solo middleware de identidad y un cliente compartido con el pool existente. |
| Media | El archivo fotográfico enviaba imágenes de escritorio a móviles. El logotipo utilizaba un PNG de 537.183 bytes para mostrar su silueta. | Variantes WebP para pantallas pequeñas, dimensiones explícitas y silueta WebP de 102.396 bytes. El canal alfa se comparó píxel por píxel. Se conservan las imágenes originales. |
| Media | About requería editar el código. Varios controles del panel carecían de asociación explícita con sus etiquetas. | Editor de textos, fotografías, orden y enlaces. Una comprobación de versión evita sobrescribir ediciones simultáneas. Los contenidos originales son el valor inicial. Se han vinculado las etiquetas de los campos estáticos identificados. |

El CSS de Bootstrap se mantiene por su uso en listas, retículas y formularios. Los reproductores existentes tienen carga diferida y validación de proveedor. Las imágenes dentro del cuerpo de los artículos se cargan también bajo demanda. La nueva ruta de detalle reutiliza los componentes de catálogo y conserva los enlaces de escucha y de entradas. La interfaz pública mantiene colores, tipografías y composición.

## Mediciones reproducibles

Node 24.20.0, build de producción de Vite, mismo equipo y dependencias. El cálculo de gzip usa nivel 6 en ambas versiones. JavaScript y CSS corresponden a los ficheros iniciales de index.html. El total de la galería suma las 13 fotos originales o sus variantes móviles, no representa una única visita.

| Indicador | Base | Propuesta aproximada |
|---|---:|---:|
| JavaScript inicial sin compresión | 515,08 kB | 373,70 kB |
| JavaScript inicial gzip | 167,39 kB | 122,77 kB |
| CSS inicial gzip | 52,64 kB | 52,67 kB |
| Archivo fotográfico de About en móvil | 6,48 MB | 1,01 MB |
| Consultas de usuario por petición autenticada en el código | 2 | 1 |

El indicador de fichero de Vite y gzip nivel 6 usan parámetros diferentes. Ninguno mide LCP, INP ni CLS de visitantes reales.

## Medición de la portada publicada

PageSpeed Insights midió la portada el 25 de noviembre a las 23:56 CET con Lighthouse 13.6 y 4G lenta. La puntuación móvil fue 75, FCP 1,1 s, LCP 12,0 s, TBT 0 ms y CLS 0. La muestra de usuarios reales fue insuficiente para obtener INP. El elemento LCP era la imagen de Cloudinary del banner, de 4.800 × 2.997 píxeles y 1.498,5 KiB. Lighthouse estimó un ahorro potencial de 1.454,8 KiB para esa imagen. Es una estimación sobre la versión publicada. [Informe de la medición](https://pagespeed.web.dev/analysis/https-caribe-records-com/a8d7w664s0fzivfeevmfpe?form_factor=mobile)

El banner solicita versiones de 480, 800 o 1.200 píxeles con el servicio Cloudinary existente y vuelve al original si falla la transformación. El logotipo de la cabecera usa una variante de 384 píxeles. La portada editorial de Aeronave conserva su JPEG original. La conversión probada en alta calidad crecía de 169.130 a 210.722 bytes. Se han retirado tres dependencias directas del backend sin referencias en el código, bcrypt nativo, cookie-parser y jsonwebtoken. bcryptjs sigue verificando las contraseñas.

## Activación y vuelta atrás

1. Antes de desplegar, conservar el job desplegado en Amplify, el digest real de la imagen Lambda y una copia de las reglas y cabeceras efectivas de Amplify. Comprobar los marcadores de las migraciones históricas de arranque en Atlas mediante lectura. La propuesta no requiere modificar contenidos para su puesta en marcha.
2. Con autorización, publicar el frontend y la API mediante los procedimientos existentes. Probar directamente en la API el sitemap y una ficha publicada antes de activar sus reescrituras. Validar que ambos ficheros page-entry del frontend respondan con el tipo correcto.
3. Preservar las redirecciones de dominio y el proxy de la API. Antes de la regla de captura de la SPA, añadir reescrituras 200 exactas para las cinco secciones principales (/artistas, /editoriales, /eventos, /releases y /about) hacia sus ficheros .html. Añadir /sitemap.xml hacia el origen HTTPS de Lambda bajo /api/v1/pages/sitemap.xml. Para las cuatro rutas /artistas/<*>, /editorial/<*>, /eventos/<*> y /releases/<*>, usar el mismo origen de Lambda seguido de /api/v1/pages y de la ruta original con su comodín. Usar el origen de la regla de API vigente. Cuando se haya configurado un dominio canónico distinto, VITE_SITE_ORIGIN y PUBLIC_SITE_ORIGIN deben coincidir.
4. Comprobar en el .com y en Amplify el acceso directo, el HTML de las fichas con JavaScript desactivado, el sitemap, el estado 404 para contenido ausente, las cabeceras y la carga de originales, variantes móviles y anuncios. Verificar la sesión con una cuenta autorizada. Usar datos descartables para las pruebas de escritura en QA.
5. Si hay regresión, restaurar primero las reglas anteriores, volver al job anterior de Amplify y al digest anterior de Lambda. Verificar catálogo, imágenes, login y lecturas públicas después de la recuperación. About guarda sus ediciones en una colección nueva y los documentos siguen presentes si se restaura el código anterior. Tras un rollback de la lógica de sesión, considerar el vencimiento de las sesiones antiguas antes de volver a habilitar el panel.

## Riesgos operativos pendientes

- Confirmar en AWS el estado de certificados, reglas efectivas, IAM, logs, cuotas y coste facturado. La plantilla documenta Lambda, SSM, ECR y CloudWatch. Atlas y Cloudinary se administran por separado.
- Comprobar en producción la ruta real de los archivos grandes. El multipart de 10 MiB admitido por Express puede superar el límite de 6 MB de la invocación síncrona de Lambda antes de llegar al middleware. La codificación y el encabezado de la petición influyen en el límite efectivo. Una carga directa firmada requeriría verificar las restricciones de la cuenta de Cloudinary.
- El limitador actual mantiene los contadores por instancia Lambda. Verificar su eficacia en los registros. Contrastar los índices con explain y el volumen real antes de crear o retirar índices.
- Las actualizaciones históricas de relaciones en varias colecciones no son transaccionales. La retirada de una referencia multimedia conserva el original y evita eliminar archivos que pueden seguir compartidos por otros contenidos.
- Medir LCP, INP y CLS por URL y dispositivo tras el despliegue con tráfico suficiente. WebKit automatizado y Safari en un iPhone físico requieren verificaciones distintas.

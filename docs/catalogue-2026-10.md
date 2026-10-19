# Catálogo e histórico — octubre de 2026

La API muestra los eventos activos de cualquier fecha por defecto. `from` y
`to` siguen permitiendo acotar la agenda. La web carga todas las páginas y separa
próximos conciertos del histórico; los días se comparan en Europe/Madrid.

La migración `catalogue-2026-10-roster` se ejecuta después de conectar MongoDB y
antes de servir peticiones. Oculta del roster a d.trillo, mi amigo mac y DeDeDeDe;
oculta los discos de d.trillo y mantiene visibles los de los otros dos como
distribución. No elimina documentos ni relaciones. Se guarda un marcador en
`app_migrations` al terminar para no repetirla en siguientes arranques.

Los artistas ocultos siguen disponibles en el listado administrativo protegido.
Para revertir la decisión editorial se pueden actualizar `rosterVisible` y
`catalogVisible`; el marcador debe conservarse para no reaplicar la corrección.

Verificación local: seis artistas públicos, 40 discos públicos, cinco eventos
históricos, tres discos de d.trillo conservados pero ocultos y repetición de la
migración sin cambios. Se verificó también el rechazo del listado administrativo
sin sesión y la conservación del filtro por fechas.

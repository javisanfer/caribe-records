# Entorno local de QA

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

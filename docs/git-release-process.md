# Flujo de desarrollo, QA y producción

## Ramas y entornos

| Rama | Uso | Entorno | Base de datos |
| --- | --- | --- | --- |
| `codex/ticket-*` | Una incidencia o desarrollo | Local | `caribe_records_test` local |
| `develop` | Integración aprobada | Staging | `caribe_records_staging` |
| `main` | Versiones publicadas | Producción | `caribe_records` |

`main` y `develop` no reciben trabajo directo. Cada cambio empieza desde `develop` en una rama corta.

## Incidencias y desarrollos

1. Actualizar `develop` y crear `codex/ticket-descripcion`.
2. Implementar y probar con la base local de test.
3. Hacer push y abrir una pull request hacia `develop`.
4. Esperar a que pasen `API tests` y `Web lint and build`.
   También deben pasar `Pull request policy` y `CodeQL JavaScript`.
5. Revisar el cambio desplegado en staging.
6. Cerrar el ticket de Notion cuando QA valide staging.
7. Fusionar con squash para mantener un commit claro por ticket.

## Publicación

1. Abrir una pull request de `develop` hacia `main`.
2. Revisar conjuntamente los cambios incluidos y el estado de staging.
3. Fusionar la pull request.
4. Crear una etiqueta anotada con versión semántica, por ejemplo `v1.1.0`.
5. GitHub verifica de nuevo API y web, crea el artefacto y publica la release con notas automáticas.
6. Ejecutar una regresión breve en producción.

## Hotfix

Un problema urgente de producción se corrige desde `main` en `codex/hotfix-descripcion`. La pull request se dirige a `main`; después se incorpora el mismo commit a `develop` para evitar divergencias.

## Datos

Git contiene código y scripts, nunca volcados de MongoDB ni secretos. Cada entorno mantiene su propia URI. Los cambios de estructura o transformaciones se implementan como scripts versionados, repetibles y seguros al ejecutarse más de una vez.

Los datos de test no se copian a producción. El contenido real se gestiona en producción desde el panel; staging usa contenido ficticio o una copia saneada.

## Protección recomendada en GitHub

Para `main`:

- Exigir pull request y resolver las conversaciones antes de fusionar.
- Exigir `API tests`, `Web lint and build` y `Production source`.
- Exigir `Pull request policy` y `CodeQL JavaScript`.
- Exigir que la rama esté actualizada.
- Bloquear force push y borrado.

Para `develop`:

- Exigir pull request.
- Exigir `API tests` y `Web lint and build`.
- Exigir `Pull request policy` y `CodeQL JavaScript`.
- Bloquear force push y borrado.

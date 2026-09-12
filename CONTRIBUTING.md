# Contribuir a Caribe Records

## Preparación

Usa Node.js `24.20.0`. Instala las dependencias con `npm ci` dentro de `api` y `web`.

## Trabajo diario

1. Parte de `develop` actualizado.
2. Crea una rama `codex/ticket-descripcion` o `codex/hotfix-descripcion`.
3. Mantén cada rama centrada en un único ticket de Notion.
4. No añadas secretos, volcados de datos ni archivos `.env` locales.
5. Antes del push ejecuta:

```bash
cd api && npm test && npm audit --omit=dev --audit-level=high
cd ../web && npm run lint && npm run build -- --mode test && npm audit --omit=dev --audit-level=high
```

## Pull requests

El título sigue Conventional Commits: `tipo(ámbito): resultado`, por ejemplo `fix(auth): reject inactive users`. La PR se fusiona con squash cuando CI y QA están en verde.

Describe el comportamiento final, enlaza el ticket, explica la validación y anota cualquier cambio de configuración, datos o despliegue.

## Datos

Las transformaciones de MongoDB se entregan como scripts repetibles. Deben rechazar la base equivocada, admitir una ejecución de prueba cuando sea razonable y documentar cómo revertirlas.


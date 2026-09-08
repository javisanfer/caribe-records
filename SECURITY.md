# Seguridad

No publiques vulnerabilidades, credenciales ni datos personales en una incidencia pública.

Comunica un problema de seguridad mediante un aviso privado de seguridad de GitHub en **Security → Advisories → New draft advisory**. Incluye el impacto, los pasos mínimos de reproducción y la versión afectada.

Las correcciones de seguridad se preparan en una rama privada o `codex/hotfix-*`, se validan sin datos reales y se publican desde una PR protegida. Las credenciales potencialmente expuestas se rotan aunque el archivo se elimine después del historial.


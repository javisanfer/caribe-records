# Despliegue económico en AWS

La arquitectura mantiene producción pública sin capacidad encendida en reposo:

- **Web:** AWS Amplify Hosting, conectado a `main`.
- **API:** AWS Lambda con Function URL y capacidad bajo demanda.
- **Adaptador HTTP:** AWS Lambda Web Adapter `1.0.1`, para ejecutar Express sin reescribir la aplicación.
- **Datos:** MongoDB Atlas Free en AWS, fuera de CloudFormation.
- **Imágenes y correo:** las cuentas existentes de Cloudinary y Resend.
- **Secretos:** AWS Systems Manager Parameter Store (`SecureString`).
- **Control de coste:** presupuesto mensual de 12 USD con avisos al 80 % previsto y al 100 % real.
- **Despliegues posteriores:** GitHub Actions usa OIDC y credenciales temporales; no se guardan claves de AWS en GitHub.

No se mantiene un entorno de staging encendido. Para QA se usa el entorno local; si una versión necesita validación pública, se crea un entorno temporal y se elimina al terminar.

## Requisitos

1. AWS CLI v2 con una sesión en la cuenta correcta.
2. Región `eu-west-1` (Irlanda).
3. Un clúster MongoDB Atlas Free desplegado en AWS. Lambda no tiene una IP de salida fija sin añadir una VPC y NAT, por lo que Atlas debe aceptar `0.0.0.0/0`; la URI usa usuario y contraseña exclusivos de la aplicación.
4. Los valores actuales de MongoDB, Cloudinary y Resend.

## 1. Recursos compartidos y presupuesto

```bash
aws cloudformation deploy \
  --region eu-west-1 \
  --stack-name caribe-records-bootstrap \
  --template-file infra/aws/bootstrap.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides BudgetEmail=TU_EMAIL MonthlyBudgetUsd=12
```

AWS enviará un correo de confirmación para los avisos del presupuesto.

El stack también crea el rol limitado que usa GitHub Actions. Su ARN está
configurado en el workflow de este repositorio; no contiene credenciales ni
concede acceso por sí solo. El rol solo acepta tokens OIDC del entorno
`production`, puede publicar en este repositorio de ECR y actualizar la función
Lambda de producción.

## 2. Secretos gratuitos en Parameter Store

Crear estos parámetros como `SecureString` desde la consola, evitando que los valores aparezcan en el historial del terminal:

```text
/caribe-records/production/mongodb-uri
/caribe-records/production/session-secret
/caribe-records/production/cloudinary-cloud-name
/caribe-records/production/cloudinary-api-key
/caribe-records/production/cloudinary-api-secret
/caribe-records/production/resend-api-key
```

La función lee estos parámetros y los descifra durante el arranque. Su rol solo puede consultar la ruta `/caribe-records/production/*`; los valores no se guardan en Git, CloudFormation ni los logs.

## 3. Construir y subir la primera imagen

Crear la primera etiqueta semántica (`v1.0.0`). GitHub construye la imagen del
commit etiquetado y la publica con una etiqueta inmutable basada en su SHA. La
autenticación usa OIDC, sin claves permanentes. Si Lambda todavía no existe, el
workflow deja la imagen lista en ECR y termina correctamente.

Copiar el URI de imagen del resumen de la ejecución para crear inicialmente la
función. A partir de entonces, cada etiqueta `v*.*.*` actualiza Lambda
automáticamente. El modo manual `push_only` queda disponible para reconstruir
una imagen sin desplegarla.

## 4. Crear Lambda

```bash
aws cloudformation deploy \
  --region eu-west-1 \
  --stack-name caribe-records-api-production \
  --template-file infra/aws/api-lambda.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    ImageIdentifier=URI_ECR:TAG \
    FrontendOrigin=https://DOMINIO_WEB
```

El output `ApiFunctionUrl` será la URL pública de la API. Comprobar `URL/health` antes de conectar la web.

La función usa 512 MB y un timeout de 30 segundos. No reserva concurrencia porque las cuentas nuevas de AWS deben conservar al menos diez ejecuciones sin reservar; la cuota de concurrencia de la cuenta y el presupuesto mensual limitan el riesgo de gasto durante esta primera etapa.

## 5. Conectar Amplify

1. En Amplify Hosting, conectar `javisanfer/caribe-records` mediante la GitHub App de AWS.
2. Seleccionar la rama `main`. `amplify.yml` contiene el build del monorepo.
3. Dejar `VITE_API_BASE` sin definir: la web usará `/api/v1` en su propio dominio.
4. Añadir primero una reescritura de `/api/<*>` a `URL_LAMBDA/api/<*>`, con estado `200`.
5. Añadir después la regla SPA que reescribe rutas sin extensión a `/index.html`, con estado `200`.
6. Desplegar, copiar la URL definitiva de Amplify y actualizar `FrontendOrigin` en el stack de Lambda.

## 6. Publicaciones posteriores

Las versiones se publican mediante una etiqueta semántica (`v1.0.1`, `v1.1.0`,
etc.). El workflow de release verifica y empaqueta la web; el workflow de
producción construye la API, la sube a ECR y espera a que Lambda termine la
actualización. Amplify despliega automáticamente el commit de `main`.

El proxy mantiene web y API bajo el mismo dominio desde el punto de vista del navegador, por lo que las sesiones no dependen de cookies de terceros.

## Operación y coste

- Mantener Atlas en el nivel Free mientras el volumen lo permita.
- Conservar solo cinco imágenes en ECR; la política lo hace automáticamente.
- Mantener los logs de Lambda durante 14 días.
- Revisar AWS Budgets cada mes. El presupuesto avisa, pero no apaga recursos.
- No activar WAF, NAT Gateway, concurrencia aprovisionada ni staging permanente.
- La Function URL no añade coste: se paga únicamente la ejecución de Lambda cuando recibe tráfico.

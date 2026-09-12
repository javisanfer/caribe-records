# Despliegue económico en AWS

La arquitectura mantiene encendido un único entorno de producción:

- **Web:** AWS Amplify Hosting, conectado a `main`.
- **API:** AWS App Runner con `0.25 vCPU` y `0.5 GB`.
- **Datos:** MongoDB Atlas M0 en AWS, fuera de CloudFormation.
- **Imágenes y correo:** las cuentas existentes de Cloudinary y Resend.
- **Secretos:** AWS Systems Manager Parameter Store (`SecureString`).
- **Control de coste:** presupuesto mensual de 12 USD con avisos al 80 % previsto y al 100 % real.

No hay un App Runner permanente para staging. Para QA se usa el entorno local; si una versión necesita validación pública, se crea un entorno temporal y se elimina al terminar.

## Requisitos

1. Instalar AWS CLI v2 e iniciar sesión en la cuenta correcta.
2. Elegir una región. `eu-west-1` (Irlanda) es la recomendada.
3. Crear un clúster gratuito M0 de MongoDB Atlas en AWS. App Runner no ofrece IP de salida fija en esta configuración económica, por lo que Atlas debe aceptar `0.0.0.0/0`; la URI y las credenciales siguen siendo secretas. Si más adelante se exige una lista de IP cerrada, habrá que añadir VPC y NAT, lo que aumenta bastante el coste.
4. Tener a mano los valores actuales de MongoDB, Cloudinary y Resend.

## 1. Recursos compartidos y presupuesto

```bash
aws cloudformation deploy \
  --region eu-west-1 \
  --stack-name caribe-records-bootstrap \
  --template-file infra/aws/bootstrap.yaml \
  --parameter-overrides BudgetEmail=TU_EMAIL MonthlyBudgetUsd=12
```

AWS enviará un correo de confirmación para los avisos del presupuesto.

## 2. Secretos gratuitos en Parameter Store

Crear estos parámetros como `SecureString`. El historial del terminal puede guardar comandos, por lo que conviene introducir los valores desde la consola de AWS.

```text
/caribe-records/production/mongodb-uri
/caribe-records/production/session-secret
/caribe-records/production/cloudinary-cloud-name
/caribe-records/production/cloudinary-api-key
/caribe-records/production/cloudinary-api-secret
/caribe-records/production/resend-api-key
```

## 3. Construir y subir la API

Consultar el URI de ECR que devuelve el stack y usar un tag inmutable, preferiblemente el SHA del commit:

```bash
AWS_REGION=eu-west-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IMAGE_TAG=$(git rev-parse --short=12 HEAD)
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/caribe-records-api"

aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
docker build --platform linux/amd64 -t "$ECR_URI:$IMAGE_TAG" api
docker push "$ECR_URI:$IMAGE_TAG"
```

## 4. Crear App Runner

Desde Parameter Store se copian los ARN de los seis parámetros. Después:

```bash
aws cloudformation deploy \
  --region eu-west-1 \
  --stack-name caribe-records-api-production \
  --template-file infra/aws/api-service.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    ImageIdentifier=URI_ECR:TAG \
    FrontendOrigin=https://DOMINIO_WEB \
    MongoUriParameterArn=ARN_MONGODB \
    SessionSecretParameterArn=ARN_SESSION \
    CloudinaryCloudNameParameterArn=ARN_CLOUD_NAME \
    CloudinaryApiKeyParameterArn=ARN_CLOUD_KEY \
    CloudinaryApiSecretParameterArn=ARN_CLOUD_SECRET \
    ResendApiKeyParameterArn=ARN_RESEND
```

El output `ApiServiceUrl` será la URL de la API. Comprobar `https://URL/health` antes de conectar la web.

## 5. Conectar Amplify

1. En Amplify Hosting, conectar el repositorio `javisanfer/caribe-records` mediante la GitHub App de AWS.
2. Seleccionar la rama `main`. El archivo `amplify.yml` ya contiene el build del monorepo.
3. Dejar `VITE_API_BASE` sin definir: la web usará `/api/v1` en su propio dominio.
4. Añadir una regla de reescritura `https://URL_APP_RUNNER/api/<*>` para `/api/<*>`, con estado `200`. Debe aparecer antes de la regla de SPA. De este modo el navegador ve web y API bajo el mismo dominio y las sesiones no dependen de cookies de terceros.
5. Añadir después la regla de SPA de Amplify, que reescribe rutas sin extensión a `/index.html` con estado `200`.
6. Desplegar y copiar la URL definitiva de Amplify.
7. Actualizar el stack de App Runner con esa URL en `FrontendOrigin`.

Cada merge aprobado en `main` publicará el frontend. La API se publica con imágenes identificadas por commit; así se puede volver a una versión anterior sin reconstruirla.

## Operación y coste

- Mantener Atlas en M0 mientras el volumen lo permita.
- Conservar solo cinco imágenes en ECR; la política ya lo hace automáticamente.
- Revisar AWS Budgets cada mes. El presupuesto avisa, pero no apaga recursos.
- No activar AWS WAF, NAT Gateway ni un staging permanente mientras no haya una necesidad concreta.
- Para detener el gasto de la API, pausar o eliminar el servicio App Runner. Los datos permanecen en Atlas y las imágenes en ECR.

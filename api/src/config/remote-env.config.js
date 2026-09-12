const { GetParametersByPathCommand, SSMClient } = require("@aws-sdk/client-ssm");

const parameterToEnvironment = {
  "mongodb-uri": "MONGODB_URI",
  "session-secret": "SESSION_SECRET",
  "cloudinary-cloud-name": "CLOUDINARY_CLOUD_NAME",
  "cloudinary-api-key": "CLOUDINARY_API_KEY",
  "cloudinary-api-secret": "CLOUDINARY_API_SECRET",
  "resend-api-key": "RESEND_API_KEY",
};

async function loadRemoteEnvironment(parameterPath, client = new SSMClient({})) {
  if (!parameterPath) {
    throw new Error("AWS_PARAMETER_PATH is required for the production runtime");
  }

  const response = await client.send(new GetParametersByPathCommand({
    Path: parameterPath,
    Recursive: false,
    WithDecryption: true,
  }));

  const loaded = new Set();
  for (const parameter of response.Parameters || []) {
    const shortName = parameter.Name?.split("/").pop();
    const environmentName = parameterToEnvironment[shortName];
    if (environmentName && parameter.Value) {
      process.env[environmentName] = parameter.Value;
      loaded.add(environmentName);
    }
  }

  const missing = Object.values(parameterToEnvironment)
    .filter((environmentName) => !loaded.has(environmentName));
  if (missing.length) {
    throw new Error(`Missing production parameters: ${missing.join(", ")}`);
  }
}

module.exports = { loadRemoteEnvironment, parameterToEnvironment };

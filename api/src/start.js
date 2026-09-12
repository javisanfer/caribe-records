const { loadRemoteEnvironment } = require("./config/remote-env.config");

loadRemoteEnvironment(process.env.AWS_PARAMETER_PATH)
  .then(() => require("./app"))
  .catch((error) => {
    console.error("Unable to load the production configuration", error);
    process.exit(1);
  });

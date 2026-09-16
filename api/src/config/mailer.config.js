module.exports.sendValidationEmail = (user) => {
  const validateUrl = `${process.env.APP_URL}/api/v1/users/${user.id}/validate?token=${user.activateToken}`;

  // Never log activation URLs: they contain a credential-equivalent token.
  // TODO: deliver through the configured mail provider if account activation returns.
  return validateUrl;
};

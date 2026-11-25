function getPagination(query) {
  const integer = (value, fallback) => {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : fallback;
  };
  const limit = Math.min(50, integer(query.limit, 12));
  const page = Math.min(integer(query.page, 1), Math.floor(Number.MAX_SAFE_INTEGER / limit));
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = { getPagination };

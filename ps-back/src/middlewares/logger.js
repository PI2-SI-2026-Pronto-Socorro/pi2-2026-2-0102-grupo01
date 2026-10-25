function logger(req, res, next) {
  const inicio = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - inicio}ms`);
  });
  next();
}

module.exports = logger;

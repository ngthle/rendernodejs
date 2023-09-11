function corsHeader(req, res, next) {
  res.header('Access-Control-Expose-Headers', 'ETag');
  res.header('Access-Control-Allow-Origin', 'https://waterstones.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  return next();
};

module.exports = corsHeader;
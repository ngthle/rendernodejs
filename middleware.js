function checkDomain(req, res, next) {
  // Check if the request's "origin" header matches your desired domain
  const allowedDomain = 'https://waterstones.vercel.app';

  if (req.get('origin') === allowedDomain) {
    // Request is from the allowed domain, continue to the next middleware/route handler
    return next();
  }

  // Request is not from the allowed domain, you can choose to handle it here
  res.status(403).send('Access Forbidden'); // Return a 403 Forbidden status
}

module.exports = checkDomain;
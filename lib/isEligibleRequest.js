const ACCEPTABLE_CONTENT_TYPE = /^(?:multipart\/.+)$/i;
const UNACCEPTABLE_METHODS = [
  'GET',
  'HEAD'
];

/**
 * Ensures that the request in question is eligible for file uploads
 * @param {Object} req Express req object
 */
module.exports = function(req) {
  return hasBody(req) && hasAcceptableMethod(req) && hasAcceptableContentType(req);
};

/**
 * Ensures the request is not using a non-compliant multipart method
 * such as GET or HEAD
 * @param  {Object}  req Express req object
 * @return {Boolean}
 */
function hasAcceptableMethod(req) {
  return (UNACCEPTABLE_METHODS.indexOf(req.method) < 0);
}

/**
 * Ensures that only multipart requests are processed by express-fileupload
 * @param  {Object}  req Express req object
 * @return {Boolean}
 */
function hasAcceptableContentType(req) {
  let str = (req.headers['content-type'] || '').split(';')[0];

  return ACCEPTABLE_CONTENT_TYPE.test(str);
}

/**
 * Ensures the request contains a content body
 * @param  {Object}  req Express req object
 * @return {Boolean}
 */
function hasBody(req) {
  return ('transfer-encoding' in req.headers) ||
    ('content-length' in req.headers && req.headers['content-length'] !== '0');
}

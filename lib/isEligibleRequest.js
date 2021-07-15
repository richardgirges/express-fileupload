// Valid special characters according to RFC 2046, section 5.1.1:
// '"()+_-=?/:
const ACCEPTABLE_CONTENT_TYPE =
  /^(multipart\/[\w'"()+-_?/:=,.]+)(; ?[\w'"()+-_?/:=,.]*)+$/i;
const UNACCEPTABLE_METHODS = ['GET', 'HEAD'];

/**
 * Ensures the request contains a content body
 * @param  {Object}  req Express req object
 * @returns {Boolean}
 */
const hasBody = (req) => {
  return (
    'transfer-encoding' in req.headers ||
    ('content-length' in req.headers && req.headers['content-length'] !== '0')
  );
};

/**
 * Ensures the request is not using a non-compliant multipart method
 * such as GET or HEAD
 * @param  {Object}  req Express req object
 * @returns {Boolean}
 */
const hasAcceptableMethod = (req) => !UNACCEPTABLE_METHODS.includes(req.method);

/**
 * Ensures that only multipart requests are processed by express-fileupload
 * @param  {Object}  req Express req object
 * @returns {Boolean}
 */
const hasAcceptableContentType = (req) =>
  ACCEPTABLE_CONTENT_TYPE.test(req.headers['content-type']) &&
  // multi-party requests must have a boundary defined or busboy will error.
  req.headers['content-type'].includes('boundary=');

/**
 * Ensures that the request in question is eligible for file uploads
 * @param {Object} req Express req object
 * @returns {Boolean}
 */
module.exports = (req) =>
  hasBody(req) && hasAcceptableMethod(req) && hasAcceptableContentType(req);

module.exports.ACCEPTABLE_CONTENT_TYPE = ACCEPTABLE_CONTENT_TYPE;

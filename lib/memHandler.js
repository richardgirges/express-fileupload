const crypto = require('crypto');
const {debugLog} = require('./utilities');

/**
 * memHandler - In memory upload handler
 * @param {Object} options
 * @param {String} fieldname
 * @param {String} filename
 * @returns {Object}
 */
module.exports = (options, fieldname, filename) => {
  let buffers = [];
  let fileSize = 0; // eslint-disable-line
  let hash = crypto.createHash('md5');

  const getBuffer = () => Buffer.concat(buffers);
  const emptyFunc = () => '';

  return {
    dataHandler: (data) => {
      buffers.push(data);
      hash.update(data);
      fileSize += data.length;
      debugLog(options, `Uploading ${fieldname} -> ${filename}, bytes: ${fileSize}`);
    },
    getBuffer: getBuffer,
    getFilePath: emptyFunc,
    getFileSize: () => fileSize,
    getHash: () => hash.digest('hex'),
    complete: getBuffer,
    cleanup: emptyFunc
  };
};

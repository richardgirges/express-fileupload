const crypto = require('crypto');
const {debugLog} = require('./utilities');

/**
 * memHandler - In memory upload handler
 * @param {object} options
 * @param {string} fieldname
 * @param {string} filename
 */
module.exports = function(options, fieldname, filename) {
  let buffers = [];
  let fileSize = 0; // eslint-disable-line
  let hash = crypto.createHash('md5');

  const getBuffer = () => Buffer.concat(buffers);
  const emptyFunc = () => '';

  return {
    dataHandler: function(data) {
      buffers.push(data);
      hash.update(data);
      fileSize += data.length;
      debugLog(options, `Uploading ${fieldname} -> ${filename}, bytes: ${fileSize}`);
    },
    getBuffer: getBuffer,
    getFilePath: emptyFunc,
    getFileSize: function(){
      return fileSize;
    },
    getHash: function(){
      return hash.digest('hex');
    },
    complete: getBuffer,
    cleanup: emptyFunc
  };
};

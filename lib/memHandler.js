const crypto = require('crypto');
const {isFunc, debugLog} = require('./utilities');

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
  let chunkNum = 0;
  let hash = crypto.createHash('md5');
  // let isAborted = false;

  const getBuffer = () => Buffer.concat(buffers, fileSize);
  const emptyFunc = () => '';

  return {
    dataHandler: (data, req, res, name, encoding, mime, busboy) => {
      debugLog(options, `dataHandler called with name: ${name}, encoding: ${encoding}, mime: ${mime}`);//we should use req.unpipe for block everything
      // if(isAborted)return;
      chunkNum++;
      if(isFunc(options.fileHandlerPre)){
        let ret = options.fileHandlerPre(req, res, data, name, encoding, mime, chunkNum, fileSize, fieldname, filename, busboy);
        if(ret){
          // isAborted=true;
          return;
        }
      }
      buffers.push(data);
      hash.update(data);
      fileSize += data.length;
      debugLog(options, `Uploading ${fieldname} -> ${filename}, bytes: ${fileSize}`);
      if(isFunc(options.fileHandlerPost)){
        options.fileHandlerPost(req, res, data, name, encoding, mime, chunkNum, fileSize, fieldname, filename, busboy);
      }
    },
    getBuffer: getBuffer,
    getFilePath: emptyFunc,
    getFileSize: () => fileSize,
    getHash: () => hash.digest('hex'),
    complete: getBuffer,
    cleanup: emptyFunc
  };
};

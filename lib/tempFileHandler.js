const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  debugLog,
  checkAndMakeDir,
  getTempFilename
} = require('./utilities');

module.exports = function(options, fieldname, filename) {
  const dir = path.normalize(options.tempFileDir || process.cwd() + '/tmp/');
  const tempFilePath = path.join(dir, getTempFilename());
 
  checkAndMakeDir({createParentPath: true}, tempFilePath);

  let hash = crypto.createHash('md5');
  let writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return {
    dataHandler: function(data) {
      writeStream.write(data);
      hash.update(data);
      fileSize += data.length;
      debugLog(options, `Uploading ${fieldname} -> ${filename}, bytes: ${fileSize}`);
    },
    getFilePath: function(){
      return tempFilePath;
    },
    getFileSize: function(){
      return fileSize;
    },
    getHash: function(){
      return hash.digest('hex');
    },
    complete: function(){
      writeStream.end();
      //return empty buffer since data has been uploaded to the temporary file.
      return Buffer.concat([]);
    },
    cleanup: function(){
      writeStream.end();

      fs.unlink(tempFilePath, function(err) {
        if (err) throw err;
      });
    }
  };
};

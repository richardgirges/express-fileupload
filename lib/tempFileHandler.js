const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = function(options, fieldname, filename) {
  const dir = path.normalize(options.tempFileDir || process.cwd() + '/tmp/');
  let hash = crypto.createHash('md5');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  let tempFilePath = path.join(dir, 'tmp' + Date.now());
  let writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return {
    dataHandler: function(data) {
      writeStream.write(data);
      hash.update(data);
      fileSize += data.length;
      if (options.debug) {
        return console.log( // eslint-disable-line
          `Uploaded ${data.length} bytes for `,
          fieldname,
          filename
        );
      }
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

const fs = require('fs');

module.exports.tempFileHandler = function(options, fieldname, filename) {
  const dir = __dirname + (options.tempFileDir || '/tmp/');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  let tempFilePath = dir + 'tmp' + Date.now();
  let writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return {
    handler: function(data) {
      writeStream.write(data);
      fileSize += data.length;
      if (options.debug) {
        return console.log( // eslint-disable-line
          `Uploaded ${data.length} bytes for `,
          fieldname,
          filename
        );
      }
    },
    getTempFilePath: function(){
      return tempFilePath;
    },
    cleanupStream: function(){
      writeStream.end();

      fs.unlink(tempFilePath, function(err) {
        if (err) throw err;
      });
    },
    complete: function(){
      writeStream.end();
    }
  };
};

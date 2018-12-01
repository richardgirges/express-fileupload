const fs = require('fs');
let writeStream;
let tempFilePath;

module.exports.cleanupStream = function() {
  writeStream.end();
  fs.unlink(tempFilePath, function(err) {
    if (err) throw err;
  });
};

module.exports.tempFileHandler = function(options, fieldname, filename) {
  const dir = options.tempFileDir || '/tmp/';
  tempFilePath = dir + 'tmp' + Date.now();
  writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return function(data) {
    console.log('data starting', data, tempFilePath)
    writeStream.write(data);
    fileSize += data.length;
    if (options.debug) {
      return console.log( // eslint-disable-line
        `Uploaded ${data.length} bytes for `,
        fieldname,
        filename
      ); 
    }
  };
};

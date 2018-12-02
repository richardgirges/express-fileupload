const fs = require('fs');
const path = require('path');
let writeStream;
let tempFilePath;

module.exports.cleanupStream = function() {
  writeStream.end();

  fs.unlink(tempFilePath, function(err) {
    if (err) throw err;
  });
};

module.exports.complete = function(filename){
  writeStream.end();
  console.log('in complete fn!!!', fs.readdirSync(path.dirname(tempFilePath)));
  fs.rename(tempFilePath, __dirname + filename, function(err){
    if (err) {
      console.error('Error while renaming/moving temp file: ', err); // eslint-disable-line
    }
  });
};

module.exports.tempFileHandler = function(options, fieldname, filename) {
  const dir = __dirname + (options.tempFileDir || '/tmp/');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  tempFilePath = dir + 'tmp' + Date.now();
  writeStream = fs.createWriteStream(tempFilePath);
  let fileSize = 0; // eslint-disable-line

  return function(data) {
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

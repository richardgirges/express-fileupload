
/**
 * memHandler - In memory upload handler
 * @param {Object} options
 */
module.exports = function(options, fieldname, filename) {
  let buffers = [];
  let buffer;
  let fileSize = 0; // eslint-disable-line

  return {
    handler: function(data) {
      buffers.push(data);
      fileSize += data.length;
      if (options.debug) {
        return console.log('Uploading %s -> %s, bytes: %d', fieldname, filename, fileSize); // eslint-disable-line
      }       
    },
    getBuffer: function(){
      return buffer;
    },
    getFilePath: function(){
      return '';
    },
    getFileSize: function(){
      return fileSize;
    },
    complete: function(){
      buffer = Buffer.concat(buffers);
      return buffer;
    },
    cleanup: function(){
    }
  };
};

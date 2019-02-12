
/**
 * memHandler - In memory upload handler
 * @param {object} options
 * @param {string} fieldname
 * @param {string} filename
 */
module.exports = function(options, fieldname, filename) {
  let buffers = [];
  let fileSize = 0; // eslint-disable-line

  return {
    dataHandler: function(data) {
      buffers.push(data);
      fileSize += data.length;
      if (options.debug) {
        return console.log('Uploading %s -> %s, bytes: %d', fieldname, filename, fileSize); // eslint-disable-line
      }       
    },
    getBuffer: function(){
      return Buffer.concat(buffers);
    },
    getFilePath: function(){
      return '';
    },
    getFileSize: function(){
      return fileSize;
    },
    complete: function(){
      return Buffer.concat(buffers);
    },
    cleanup: function(){
    }
  };
};

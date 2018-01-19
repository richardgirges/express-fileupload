'use strict';

const path = require('path');
const request = require('supertest');
const server = require('./server');
const app = server.setup({
  limits: {fileSize: 200 * 1024} // set 200kb upload limit
});
const clearUploadsDir = server.clearUploadsDir;
const fileDir = server.fileDir;

describe('Test Single File Upload With File Size Limit', function() {
  it(`upload 'basketball.png' (~154kb) with 200kb size limit`, function(done) {
    let filePath = path.join(fileDir, 'basketball.png');

    clearUploadsDir();

    request(app)
      .post('/upload/single')
      .attach('testFile', filePath)
      .expect(200)
      .end(done);
  });

  it(`fail when uploading 'car.png' (~269kb) with 200kb size limit`, function(done) {
    let filePath = path.join(fileDir, 'car.png');

    clearUploadsDir();

    request(app)
      .post('/upload/single')
      .attach('testFile', filePath)
      .expect(413)
      .end(done);
  });
});

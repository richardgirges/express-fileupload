'use strict';

const path = require('path');
const request = require('supertest');
const assert = require('assert');
const server = require('./server');
const clearUploadsDir = server.clearUploadsDir;
const fileDir = server.fileDir;

describe('Test Single File Upload With File Size Limit', function() {
  let app;

  beforeEach(function() {
    clearUploadsDir();
  });

  describe('abort connection on limit reached', function() {
    before(function() {
      app = server.setup({
        limits: {fileSize: 200 * 1024}, // set 200kb upload limit
        abortOnLimit: true
      });
    });

    it(`upload 'basketball.png' (~154kb) with 200kb size limit`, function(done) {
      let filePath = path.join(fileDir, 'basketball.png');

      request(app)
        .post('/upload/single/truncated')
        .attach('testFile', filePath)
        .expect(200)
        .end(done);
    });

    it(`fail when uploading 'car.png' (~269kb) with 200kb size limit`, function(done) {
      let filePath = path.join(fileDir, 'car.png');

      request(app)
        .post('/upload/single/truncated')
        .attach('testFile', filePath)
        .expect(413)
        .end(done);
    });
  });

  describe('pass truncated file to the next handler', function() {
    before(function() {
      app = server.setup({
        limits: {fileSize: 200 * 1024} // set 200kb upload limit
      });
    });

    it(`fail when uploading 'car.png' (~269kb) with 200kb size limit`, function(done) {
      let filePath = path.join(fileDir, 'car.png');

      request(app)
        .post('/upload/single/truncated')
        .attach('testFile', filePath)
        .expect(400)
        .end(function(err, res) {
          assert.ok(res.error.text === 'File too big');
          done();
        });
    });
  });
});

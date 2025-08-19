'use strict';

const path = require('path');
const request = require('supertest');
const assert = require('assert');
const server = require('./server');
const clearUploadsDir = server.clearUploadsDir;
const fileDir = server.fileDir;

describe('Test Multiple File Upload With Files Limit Handler', function() {
  let app, numFilesLimitHandlerRun;

  beforeEach(function() {
    clearUploadsDir();
    numFilesLimitHandlerRun = false;
  });

  describe('Run numFilesLimitHandler on limit reached.', function(){
    before(function() {
      app = server.setup({
        limits: { files: 3 }, // set limit of 3 files
        numFilesLimitHandler: (req, res) => { // set limit handler
          res.writeHead(500, { Connection: 'close', 'Content-Type': 'application/json'});
          res.end(JSON.stringify({response: 'Too many files!'}));
          numFilesLimitHandlerRun = true;
        }
      });
    });

    it('Runs handler when too many files', (done) => {
      const req = request(app).post('/upload/multiple');

      ['car.png', 'tree.png', 'basketball.png', 'car.png'].forEach((fileName, index) => {
        let filePath = path.join(fileDir, fileName);
        req.attach(`testFile${index+1}`, filePath);
      });

      req
        .expect(500, {response: 'Too many files!'})
        .end(() => {
          assert.ok(numFilesLimitHandlerRun, 'handler was run');
          done();
        });
    });

    it('Does not run handler when number of files is below limit', (done) => {
      const req = request(app).post('/upload/multiple');

      ['car.png', 'tree.png', 'basketball.png'].forEach((fileName, index) => {
        let filePath = path.join(fileDir, fileName);
        req.attach(`testFile${index+1}`, filePath);
      });

      req
        .expect(200)
        .end(() => {
          assert.ok(!numFilesLimitHandlerRun, 'handler was not run');
          done();
        });
    });
  });
});

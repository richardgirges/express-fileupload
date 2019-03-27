'use strict';

const assert = require('assert');
const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const fileFactory = require('../lib').fileFactory;
const {isFunc} = require('../lib/utilities.js');
const server = require('./server');


const mockFile = path.join(server.fileDir, 'basketball.png');
const mockBuffer = fs.readFileSync(mockFile);

describe('Test of the fileFactory factory', function() {
  beforeEach(function() {
    server.clearUploadsDir();
  });

  it('return a file object', function() {
    assert.ok(fileFactory({
      name: 'basketball.png',
      buffer: mockBuffer
    }));
  });

  it('return void if buffer is empty and useTempFiles is false.', function() {
    assert.equal(fileFactory({
      name: 'basketball.png',
      buffer: Buffer.concat([])
    },{
      useTempFiles: false
    }), null);
  });

  describe('Properties', function() {
    it('contains the name property', function() {
      assert.equal(fileFactory({
        name: 'basketball.png',
        buffer: mockBuffer
      }).name, 'basketball.png');
    });
    it('contains the data property', function() {
      assert.ok(fileFactory({
        name: 'basketball.png',
        buffer: mockBuffer
      }).data);
    });
    it('contains the encoding property', function() {
      assert.equal(fileFactory({
        name: 'basketball.png',
        buffer: mockBuffer,
        encoding: 'utf-8'
      }).encoding, 'utf-8');
    });
    it('contains the mimetype property', function() {
      assert.equal(fileFactory({
        name: 'basketball.png',
        buffer: mockBuffer,
        mimetype: 'image/png'
      }).mimetype, 'image/png');
    });
    it('contains the md5 property', function() {
      const mockMd5 = md5(mockBuffer);
      assert.equal(fileFactory({
        name: 'basketball.png',
        buffer: mockBuffer,
        hash: mockMd5
      }).md5, mockMd5);
    });
    it('contains the mv method', function() {
      assert.equal(isFunc(fileFactory({
        name: 'basketball.png',
        buffer: mockBuffer
      }).mv), true);
    });
  });

  describe('File object behavior for in memory upload', function() {
    const file = fileFactory({
      name: 'basketball.png',
      buffer: mockBuffer
    });
    it('move the file to the specified folder', function(done) {
      file.mv(path.join(server.uploadDir, 'basketball.png'), function(err) {
        assert.ifError(err);
        done();
      });
    });
    it('reject the mv if the destination does not exists', function(done) {
      file.mv(path.join(server.uploadDir, 'unknown', 'basketball.png'), function(err) {
        assert.ok(err);
        done();
      });
    });
  });

  describe('File object behavior for upload into temporary file', function() {
    const file = fileFactory({
      name: 'basketball.png',
      buffer: mockBuffer,
      tempFilePath: mockFile
    });
    it('move the file to the specified folder', function(done) {
      file.mv(path.join(server.uploadDir, 'basketball.png'), function(err) {
        if (!err){
          //Place back moved file
          fs.renameSync(path.join(server.uploadDir, 'basketball.png'), mockFile);          
        }
        assert.ifError(err);
        done();
      });
    });
    it('reject the mv if the destination does not exists', function(done) {
      file.mv(path.join(server.uploadDir, 'unknown', 'basketball.png'), function(err) {
        assert.ok(err);
        done();
      });
    });
  });
});

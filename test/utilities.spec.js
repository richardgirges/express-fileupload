'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const md5 = require('md5');
const server = require('./server');
const fileDir = server.fileDir;
const uploadDir = server.uploadDir;

const {
  isFunc,
  checkAndMakeDir,
  copyFile,
  saveBufferToFile
} = require('../lib/utilities.js');


const mockFile = 'basketball.png';
const mockBuffer = fs.readFileSync(path.join(fileDir, mockFile));
const mockHash = md5(mockBuffer);


describe('Test of the utilities functions', function() {
  beforeEach(function() {
    server.clearUploadsDir();
  });
  //isFunc tests
  describe('Test isFunc function', () => {

    it('isFunc returns true if function passed', () => assert.equal(isFunc(()=>{}), true));

    it('isFunc returns false if null passed', function() {
      assert.equal(isFunc(null), false);
    });

    it('isFunc returns false if undefined passed', function() {
      assert.equal(isFunc(undefined), false);
    });

    it('isFunc returns false if object passed', function() {
      assert.equal(isFunc({}), false);
    });

    it('isFunc returns false if array passed', function() {
      assert.equal(isFunc([]), false);
    });
  });
  //checkAndMakeDir tests
  describe('Test checkAndMakeDir function', () => {
    //
    it('checkAndMakeDir returns false if upload options object was not set', () => {
      assert.equal(checkAndMakeDir(), false);
    });
    //
    it('checkAndMakeDir returns false if upload option createParentPath was not set', () => {
      assert.equal(checkAndMakeDir({}), false);
    });
    //
    it('checkAndMakeDir returns false if filePath was not set', () => {
      assert.equal(checkAndMakeDir({createParentPath: true}), false);
    });
    //
    it('checkAndMakeDir return true if path to the file already exists', ()=>{
      let dir = path.join(uploadDir, 'testfile');
      assert.equal(checkAndMakeDir({createParentPath: true}, dir), true);
    });
    //
    it('checkAndMakeDir creates a dir if path to the file not exists', ()=>{
      let dir = path.join(uploadDir, 'testfolder', 'testfile');
      assert.equal(checkAndMakeDir({createParentPath: true}, dir), true);
    });
  });
  //saveBufferToFile tests
  describe('Test saveBufferToFile function', function(){
    beforeEach(function() {
      server.clearUploadsDir();
    });

    it('Save buffer to a file', function(done) {
      let filePath = path.join(uploadDir, mockFile);
      saveBufferToFile(mockBuffer, filePath, function(err){
        if (err) {
          return done(err);
        }
        fs.stat(filePath, done);
      });
    });

    it('Failed if not a buffer passed', function(done) {
      let filePath = path.join(uploadDir, mockFile);
      saveBufferToFile(undefined, filePath, function(err){
        if (err) {
          return done();
        }
      });
    });

    it('Failed if wrong path passed', function(done) {
      let filePath = '';
      saveBufferToFile(mockFile, filePath, function(err){
        if (err) {
          return done();
        }
      });
    });
  });

  describe('Test copyFile function', function(){
    beforeEach(function() {
      server.clearUploadsDir();
    });

    it('Copy a file and check a hash', function(done) {
      let srcPath = path.join(fileDir, mockFile);
      let dstPath = path.join(uploadDir, mockFile);
      
      copyFile(srcPath, dstPath, function(err){
        if (err) {
          return done(err);
        }
        fs.stat(dstPath, (err)=>{
          if (err){
            return done(err);
          }
          //Match source and destination files hash.
          let fileBuffer = fs.readFileSync(dstPath);
          let fileHash = md5(fileBuffer);
          return (fileHash === mockHash) ? done() : done(err);
        });
      });
    });

    it('Failed if wrong source file path passed', function(done){
      let srcPath = path.join(fileDir, 'unknown');
      let dstPath = path.join(uploadDir, mockFile);
      
      copyFile(srcPath, dstPath, function(err){
        if (err) {
          return done();
        }
      });
    });

    it('Failed if wrong destination file path passed', function(done){
      let srcPath = path.join(fileDir, 'unknown');
      let dstPath = path.join('unknown', 'unknown');
      
      copyFile(srcPath, dstPath, function(err){
        if (err) {
          return done();
        }
      });
    });
  });
});

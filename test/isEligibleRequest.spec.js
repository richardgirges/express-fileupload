'use strict';

const assert = require('assert');
const isEligibleRequest = require('../lib/isEligibleRequest');

describe('isEligibleRequest function tests', () => {
  it('should return true if the request method is POST & headers set', () => {
    const req = {
      method: 'POST',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, true);
  });
  it('should return true if the request method is PUT & headers set', () => {
    const req = {
      method: 'PUT',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, true);
  });
  it('should return true if the request method is PATCH & headers set', () => {
    const req = {
      method: 'PATCH',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, true);
  });
  it('should return false if the request method is POST & content length 0', () => {
    const req = {
      method: 'POST',
      headers: {
        'content-length': '0',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, false);
  });
  it('should return false if the request method is POST & no content-length', () => {
    const req = {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, false);
  });
  it('should return false if the request method is POST & no boundary', () => {
    const req = {
      method: 'POST',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; ----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, false);
  });
  it('should return true if the content-type has a quoted boundary & other parameters', () => {
    const req = {
      method: 'POST',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; charset=utf-8; boundary="gc0pJq0M:08jU534c0p"'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, true);
  });
  it('should return false if the boundary has characters RFC 2046 does not allow', () => {
    const req = {
      method: 'POST',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; boundary=<gc0pJq0M@08jU534c0p>'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, false);
  });
  it('should return false quickly if the content-type ends in a run of semicolons', () => {
    const req = {
      method: 'POST',
      headers: {
        'content-length': '768751',
        // Takes seconds if the content-type regex backtracks exponentially (ReDoS)
        'content-type': 'multipart/form-data; boundary=x' + ';'.repeat(28) + '!'
      }
    };
    const start = Date.now();
    const result = isEligibleRequest(req);
    assert.equal(result, false);
    assert.ok(Date.now() - start < 1000, 'content-type check took longer than 1 second');
  });
  it('should return false if the request method is not POST, PUT or PATCH', () => {
    const req = {
      method: 'GET',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, false);
  });
  it('should return false if the request method is not POST, PUT or PATCH', () => {
    const req = {
      method: 'DELETE',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, false);
  });
  it('should return false if the request method is not POST, PUT or PATCH', () => {
    const req = {
      method: 'OPTIONS',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, false);
  });
  it('should return false if the request method is not POST, PUT or PATCH', () => {
    const req = {
      method: 'HEAD',
      headers: {
        'content-length': '768751',
        'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryz2D47BnVMA7w5N36'
      }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, false);
  });
  it('should return false if the request is empty or not provided', () => {
    const result = isEligibleRequest();
    assert.equal(result, false);
  });
  it('should return false if content-type is not specified.', () => {
    const req = {
      method: 'POST',
      headers: { 'content-length': '768751' }
    };
    const result = isEligibleRequest(req);
    assert.equal(result, false);
  });
});

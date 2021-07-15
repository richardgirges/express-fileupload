const { ACCEPTABLE_CONTENT_TYPE } = require('./isEligibleRequest');

describe('ACCEPTABLE_CONTENT_TYPE regex', () => {
  it('should be false for an empty string', () => {
    expect(ACCEPTABLE_CONTENT_TYPE.test('')).toEqual(false);
  });

  it('should be false for other content types', () => {
    expect(ACCEPTABLE_CONTENT_TYPE.test('application/json')).toEqual(false);
  });

  it('should be false for "multipart/mixed" subtype without boundary', () => {
    expect(ACCEPTABLE_CONTENT_TYPE.test('multipart/mixed')).toEqual(false);
  });

  it('should be true for "multipart/mixed" without boundary', () => {
    expect(
      ACCEPTABLE_CONTENT_TYPE.test(
        'multipart/mixed; boundary=gc0p4Jq0M2Yt08jU534c0p'
      )
    ).toEqual(true);
  });

  it('should be false for "multipart/form-data" subtype without boundary', () => {
    expect(ACCEPTABLE_CONTENT_TYPE.test('multipart/form-data')).toEqual(false);
  });

  it('should be false for "multipart/form-data" with encoding only', () => {
    expect(
      ACCEPTABLE_CONTENT_TYPE.test('multipart/form-data; charset=utf-8;')
    ).toEqual(true);
  });

  it('should be true for "multipart/form-data" with boundary', () => {
    expect(
      ACCEPTABLE_CONTENT_TYPE.test(
        'multipart/form-data; charset=utf-8; boundary=__X_BOUNDARY__'
      )
    ).toEqual(true);
  });

  it('should be true for "multipart/form-data" with boundary with no space', () => {
    expect(
      ACCEPTABLE_CONTENT_TYPE.test(
        'multipart/form-data; charset=utf-8;boundary=__X_BOUNDARY__'
      )
    ).toEqual(true);
  });

  it('should be true for "multipart/form-data" with encoding and boundary', () => {
    expect(
      ACCEPTABLE_CONTENT_TYPE.test(
        'multipart/form-data; charset=utf-8; boundary=__X_BOUNDARY__'
      )
    ).toEqual(true);
  });

  it('should be false for "multipart/form-data" with boundary without semi-colon', () => {
    expect(
      ACCEPTABLE_CONTENT_TYPE.test(
        'multipart/form-data boundary=__X_BOUNDARY__'
      )
    ).toEqual(false);
  });

  it('should be true for "multipart/form-data" with all accepted characters', () => {
    expect(
      ACCEPTABLE_CONTENT_TYPE.test(
        'multipart/form-data; boundary=__X_BOUNDARY__; charset=utf-8; \'"()+_-=?/:'
      )
    ).toEqual(true);
  });

  it('should be false for "multipart/form-data" with invalid characters', () => {
    expect(
      ACCEPTABLE_CONTENT_TYPE.test(
        'multipart/form-data; boundary=__X_BOUNDARY__; charset=utf-$8;'
      )
    ).toEqual(false);
  });
});

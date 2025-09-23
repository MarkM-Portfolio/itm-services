/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import nock from 'nock';
import testData from '../test-data/entry-data';

module.exports = (request) => {
  const profileUrl = process.env.CONNECTIONS_PROFILES_URL;
  describe('Profile model', () => {
    describe('post entry', () => {
      let originalTimeout = 0;
      beforeEach(() => {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
      });

      it('should return new object with different id if entry id equals to exid', (done) => {
        nock(profileUrl)
        .get('/json/profile.do')
        .query({ format: 'compact', userid: testData.PEOPLE_ENTRY4.id })
        .reply(200, { key: 'test-cf2c9ec4-dd4b-47d7-bc44-a25bb8945f17' });

        request.postEntry(201, testData.PEOPLE_ENTRY4)
        .then((res) => {
          expect(res.body.id).not.toEqual(testData.PEOPLE_ENTRY4.id);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return same id with entry id if entry id does not equal to exid', (done) => {
        request.postEntry(201, testData.PEOPLE_ENTRY7)
        .then((res) => {
          expect(res.body).toEqualObject(testData.PEOPLE_ENTRY7);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return new object with different id if entry id is not provided', (done) => {
        nock(profileUrl)
        .get('/json/profile.do')
        .query({ format: 'compact', userid: testData.PEOPLE_ENTRY5.metadata.exId })
        .reply(200, { key: 'test-5152a8f7-d1c9-41bf-8001-4918bb36fa60' });

        request.postEntry(201, testData.PEOPLE_ENTRY5)
        .then((res) => {
          expect(res.body.id).not.toEqual(testData.PEOPLE_ENTRY5.id);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return error if the exid id is empty and entry id is not provided', (done) => {
        request.postEntry(422, testData.PEOPLE_ENTRY6)
        .then((res) => {
          expect(res.body).toBeValidationError();
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return error if tried to trigger error response from connections Profiles', (done) => {
        nock(profileUrl)
        .get('/json/profile.do')
        .query({ format: 'compact', userid: testData.PEOPLE_ENTRY_INVALID_ID.metadata.exId })
        .reply(500, 'ApplicationError');

        request.postEntry(500, testData.PEOPLE_ENTRY_INVALID_ID)
        .then((res) => {
          expect(res.body.error.statusCode).toEqual(500);
          done();
        })
        .catch((err) => {
          expect(err).not.toBeNull();
          done();
        });
      });

      it('should return new object with different id and tel if entry id and tel are not provided', (done) => {
        nock(profileUrl)
        .get('/json/profile.do')
        .query({ format: 'compact', userid: testData.PEOPLE_ENTRY_WITHOUT_ID_TEL.metadata.exId })
        .reply(200, testData.PROFILES_PEOPLE1);

        request.postEntry(201, testData.PEOPLE_ENTRY_WITHOUT_ID_TEL)
        .then((res) => {
          expect(res.body.id).not.toEqual(testData.PEOPLE_ENTRY_WITHOUT_ID_TEL.id);
          expect(res.body.id).toEqual(testData.PROFILES_PEOPLE1.key);
          expect(res.body.metadata.tel).toEqualObject(testData.PROFILES_PEOPLE1.tel);
        })
        .then(() => request.deleteEntry(200, testData.PROFILES_PEOPLE1.key))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return new object with different id and provided tel if entry id is not provided and tel is provided', (done) => {
        nock(profileUrl)
        .get('/json/profile.do')
        .query({ format: 'compact', userid: testData.PEOPLE_ENTRY_WITH_TEL.metadata.exId })
        .reply(200, testData.PROFILES_PEOPLE2);

        request.postEntry(201, testData.PEOPLE_ENTRY_WITH_TEL)
        .then((res) => {
          expect(res.body.id).not.toEqual(testData.PEOPLE_ENTRY_WITH_TEL.id);
          expect(res.body.id).toEqual(testData.PROFILES_PEOPLE2.key);
          expect(res.body.metadata.tel)
          .toEqualObject(testData.PEOPLE_ENTRY_WITH_TEL.metadata.tel);
        })
        .then(() => request.deleteEntry(200, testData.PROFILES_PEOPLE2.key))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return profiles.tel if tel is not provided with input entry', (done) => {
        nock(profileUrl)
        .get('/json/profile.do')
        .query({ format: 'compact', userid: testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.metadata.exId })
        .reply(200, { key: testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.id,
          tel: testData.PROFILES_PEOPLE2.tel });

        request.postEntry(201, testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL)
        .then((res) => {
          expect(res.body.id).toEqual(testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.id);
          expect(res.body.metadata.tel)
          .toEqualObject(testData.PROFILES_PEOPLE2.tel);
        })
        .then(() => request.deleteEntry(200, testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return empty profiles.tel if tel is not provided with input entry', (done) => {
        nock(profileUrl)
        .get('/json/profile.do')
        .query({ format: 'compact', userid: testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.metadata.exId })
        .reply(200, { key: testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.id });

        request.postEntry(201, testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL)
        .then((res) => {
          expect(res.body.id).toEqual(testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.id);
          expect(res.body.metadata.tel)
          .toEqualObject({});
        })
        .then(() => request.deleteEntry(200, testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return empty object if exId is error and tel is not provided with input entry', (done) => {
        nock(profileUrl)
        .get('/json/profile.do')
        .query({ format: 'compact', userid: 'Not-expected-exId' })
        .reply(200, { key: testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.id,
          tel: testData.PROFILES_PEOPLE2.tel });

        request.postEntry(201, testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL)
        .then((res) => {
          expect(res.body.id).toEqual(testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.id);
          expect(res.body.metadata.tel)
           .toEqualObject({});
        })
        .then(() => request.deleteEntry(200, testData.PEOPLE_ENTRY_WITH_VALID_ID_WITHOUT_TEL.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return provided tel if tel is provided with input entry', (done) => {
        request.postEntry(201, testData.PEOPLE_ENTRY_WITH_VALID_ID_AND_TEL)
        .then((res) => {
          expect(res.body.id).toEqual(testData.PEOPLE_ENTRY_WITH_VALID_ID_AND_TEL.id);
          expect(res.body.metadata.tel)
          .toEqualObject(testData.PEOPLE_ENTRY_WITH_VALID_ID_AND_TEL.metadata.tel);
          done();
        })
        .then(() => request.deleteEntry(200, testData.PEOPLE_ENTRY_WITH_VALID_ID_AND_TEL.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      afterEach(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      });
    }); // describe
  });
};

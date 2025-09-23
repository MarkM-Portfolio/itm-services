/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import SG from 'src/utils/globalize';
import testData from 'tests/test-data/validation-data';
import testUtil from 'tests/utils/test-util';
import c from 'src/utils/constant-def';
import conf from 'src/config/itm-config';
import app from 'src/server';

const g = new SG();
const Profile = app.models.Profile;

module.exports = (request) => {
  describe('Validation tests -', () => {
    request.postEntryAndValidFail = (data, done) => {
      request.postEntry(422, data)
      .then((res) => {
        expect(res.body).toBeValidationError();
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    }; // request.postEntryAndValidFail

    request.postEntryWithTargetIdAndValidFail = (data, targetId, done) => {
      request.postEntry(422, data, targetId)
      .then((res) => {
        expect(res.body).toBeValidationError();
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    }; // request.postEntryWithTargetIdAndValidFail

    request.postEntryAndValidPass = (actual, expected, done) => {
      request.data = actual;
      request.postEntry(201, actual)
      .then((res) => {
        expect(res.body).toEqualObject(expected || actual);
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    }; // request.postEntryAndValidPass

    request.putEntryAndValidFail = (data, done) => {
      request.putEntry(422, data)
      .then((res) => {
        expect(res.body).toBeValidationError();
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    }; // request.postEntryAndValidFail

    request.putEntryWithTargetIdAndValidFail = (data, targetId, done) => {
      request.putEntry(422, data, targetId)
      .then((res) => {
        expect(res.body).toBeValidationError();
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    }; // request.postEntryWithTargetIdAndValidFail

    request.putNewEntryAndValidPass = (actual, expected, targetId, done) => {
      request.data = actual;
      request.putEntry(201, actual, targetId)
      .then((res) => {
        expect(res.body).toEqualObject(expected || actual);
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    }; // request.putNewEntryAndValidPass

    request.putExistedEntryAndValidPass = (actual, expected, targetId, done) => {
      request.data = actual;
      request.putEntry(200, actual, targetId)
      .then((res) => {
        expect(res.body).toEqualObject(expected || actual);
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    }; // request.putExistedEntryAndValidPass

    describe('Post entries -', () => {
      describe('should return 422 when', () => {
        it('creates new entry with empty data',
          done => request.postEntryAndValidFail({}, done));

        it('creates new entry with empty entries',
          done => request.postEntryAndValidFail(testData.NO_ENTRY, done));

        it('creates new entry without id',
          done => request.postEntryAndValidFail(testData.ENTRY_WITHOUT_ID, done));

        it('creates new entry with null id',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_NULL_ID, done));

        it('creates new entry with empty id',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_EMPTY_ID, done));

        it('creates new entry with very long id',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_VERY_LONG_ID, done));

        it('creates new entry without name',
          done => request.postEntryAndValidFail(testData.ENTRY_WITHOUT_NAME, done));

        it('creates new entry with null name',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_NULL_NAME, done));

        it('creates new entry with empty name',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_EMPTY_NAME, done));

        it('creates new entry with very long name',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_VERY_LONG_NAME, done));

        it('creates new entry without type',
          done => request.postEntryAndValidFail(testData.ENTRY_WITHOUT_TYPE, done));

        it('creates new entry with null type',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_NULL_TYPE, done));

        it('creates new entry with empty type',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_EMPTY_TYPE, done));

        it('creates new entry with very long type',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_VERY_LONG_TYPE, done));

        it('creates new entry without image',
          done => request.postEntryAndValidFail(testData.ENTRY_WITHOUT_IMAGE, done));

        it('creates new entry with null image',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_NULL_IMAGE, done));

        it('creates new entry with empty image',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_EMPTY_IMAGE, done));

        it('creates new entry with null image url',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_NULL_IMAGE_URL, done));

        it('creates new entry with empty image url',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_EMPTY_IMAGE_URL, done));

        it('creates new entry with very long image url',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_VERY_LONG_IMAGE_URL, done));

        it('creates new entry with a undefined field',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_UNDEFINED_FIELD, done));

        it('creates new entry with a undefined image field',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_IMAGE_UNDEFINED_FIELD, done));

        it('creates new entry with a very long tags',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_LONG_TAGS, done));

        it('creates new entry with a very long metadata',
          done => request.postEntryAndValidFail(testData.ENTRY_WITH_LONG_METADATA, done));

        it('creates new entry with very long targetId',
          done => request.postEntryWithTargetIdAndValidFail(testData.VALID_ENTRY,
            testUtil.generateStringWithLen(c.ID_MAX_LENGTH + 1), done));
      }); // describe('should return 422 when', ...);

      describe('Should return 422 when', () => {
        it('it exceeds the maximum visible entries', (done) => {
          // set maximum as 3 for UT
          const oldMaximum = conf.maximum_allowed_visible_entries;
          conf.maximum_allowed_visible_entries = 3;
          request.postEntry(201, testData.VALID_ENTRY)
          .then((res) => {
            expect(res.body).toEqualObject(testData.VALID_ENTRY);
            return request.postEntry(201, testData.VALID_ENTRY1);
          })
          .then((res) => {
            expect(res.body).toEqualObject(testData.VALID_ENTRY1);
            return request.postEntry(201, testData.VALID_ENTRY3);
          })
          .then((res) => {
            expect(res.body).toEqualObject(testData.VALID_ENTRY3);
            return request.postEntry(422, testData.VALID_ENTRY4);
          })
          .then((res) => {
            // return error if it exceeds 3 visible entries
            expect(res.body).toBeValidationError('maximum_entries_exceeds');
            return request.deleteEntry(200, testData.VALID_ENTRY.id);
          })
          .then(() => request.deleteEntry(200, testData.VALID_ENTRY1.id))
          .then(() => request.deleteEntry(200, testData.VALID_ENTRY3.id))
          .then(() => {
            conf.maximum_allowed_visible_entries = oldMaximum;
            done();
          })
          .catch((err) => {
            conf.maximum_allowed_visible_entries = oldMaximum;
            expect(err).toBeNull();
            done();
          });
        });
      }); // describe maximum visible entries

      describe('Should return 201 when', () => {
        // clean up
        afterEach((done) => {
          request.deleteEntry(200, request.data.id)
          .then(() => done())
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
        });

        it('creates new entry with valid data',
          done => request.postEntryAndValidPass(testData.VALID_ENTRY, null, done));

        it('creates new entry with numeric id',
          (done) => {
            const actual = testData.ENTRY_WITH_NUMERIC_ID;
            const expected = Object.assign({}, actual, { id: actual.id.toString() });
            request.postEntryAndValidPass(actual, expected, done);
          });

        it('creates new entry with numeric name',
          (done) => {
            const actual = testData.ENTRY_WITH_NUMERIC_NAME;
            const expected = Object.assign({}, actual, { name: actual.name.toString() });
            request.postEntryAndValidPass(actual, expected, done);
          });

        it('creates new entry with numeric type',
          (done) => {
            const actual = testData.ENTRY_WITH_NUMERIC_TYPE;
            const expected = Object.assign({}, actual, { type: actual.type.toString() });
            request.postEntryAndValidPass(actual, expected, done);
          });
      }); // describe('Should return 201 when', ...);

      describe('Should return 409 when', () => {
        it('creates new entry with duplicated id', (done) => {
          request.postEntry(201, testData.VALID_ENTRY)
          .then((res) => {
            expect(res.body).toEqualObject(testData.VALID_ENTRY);
            return request.postEntry(409, testData.VALID_ENTRY);
          })
          .then((res) => {
            expect(res.body).toBeDuplicateError();
            expect(res.text).toEqual(jasmine.stringMatching(g.f('msg_itm_duplicate_id', testData.VALID_ENTRY.id)));
            return request.deleteEntry(200, testData.VALID_ENTRY.id);
          })
          .then(() => done())
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
        }); // it
      }); // describe('should return 409 when', ...);
    }); // describe('Post entry', ...);

    describe('Put entries -', () => {
      describe('should return 422 when', () => {
        it('put a new entry with empty data',
          done => request.putEntryAndValidFail({}, done));

        it('put a new entry with empty entries',
          done => request.putEntryAndValidFail(testData.NO_ENTRY, done));

        it('put a new entry without id',
          done => request.putEntryAndValidFail(testData.ENTRY_WITHOUT_ID, done));

        it('put a new entry with null id',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_NULL_ID, done));

        it('put a new entry with empty id',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_EMPTY_ID, done));

        it('put a new entry with very long id',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_VERY_LONG_ID, done));

        it('put a new entry without name',
          done => request.putEntryAndValidFail(testData.ENTRY_WITHOUT_NAME, done));

        it('put a new entry with null name',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_NULL_NAME, done));

        it('put a new entry with empty name',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_EMPTY_NAME, done));

        it('put a new entry with very long name',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_VERY_LONG_NAME, done));

        it('put a new entry without type',
          done => request.putEntryAndValidFail(testData.ENTRY_WITHOUT_TYPE, done));

        it('put a new entry with null type',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_NULL_TYPE, done));

        it('put a new entry with empty type',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_EMPTY_TYPE, done));

        it('put a new entry with very long type',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_VERY_LONG_TYPE, done));

        it('put a new entry without image',
          done => request.putEntryAndValidFail(testData.ENTRY_WITHOUT_IMAGE, done));

        it('put a new entry with null image',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_NULL_IMAGE, done));

        it('put a new entry with empty image',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_EMPTY_IMAGE, done));

        it('put a new entry with null image url',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_NULL_IMAGE_URL, done));

        it('put a new entry with empty image url',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_EMPTY_IMAGE_URL, done));

        it('put a new entry with very long image url',
          done => request.putEntryAndValidFail(testData.ENTRY_WITH_VERY_LONG_IMAGE_URL, done));

        it('put a new entry with very long targetId',
          done => request.putEntryWithTargetIdAndValidFail(testData.VALID_ENTRY,
            testUtil.generateStringWithLen(c.ID_MAX_LENGTH + 1), done)); // it

        it('put a new entry with very long targetId',
            done => request.putEntryWithTargetIdAndValidFail(testData.VALID_ENTRY,
              testUtil.generateStringWithLen(c.ID_MAX_LENGTH + 1), done)); // it
      }); // describe('should return 422 when', ...);

      describe('should return 201 when', () => {
        // clean up
        afterEach((done) => {
          request.deleteEntry(200, request.data.id)
          .then(() => done())
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
        });

        it('put a new entry with valid data',
          (done) => {
            request.putNewEntryAndValidPass(testData.VALID_ENTRY, testData.VALID_ENTRY, null, done);
          });

        it('put new entry with numeric id',
          (done) => {
            const actual = testData.ENTRY_WITH_NUMERIC_ID;
            const expected = Object.assign({}, actual, { id: actual.id.toString() });
            request.putNewEntryAndValidPass(actual, expected, null, done);
          });

        it('put new entry with numeric name',
          (done) => {
            const actual = testData.ENTRY_WITH_NUMERIC_NAME;
            const expected = Object.assign({}, actual, { name: actual.name.toString() });
            request.putNewEntryAndValidPass(actual, expected, null, done);
          });

        it('put new entry with numeric type',
          (done) => {
            const actual = testData.ENTRY_WITH_NUMERIC_TYPE;
            const expected = Object.assign({}, actual, { type: actual.type.toString() });
            request.putNewEntryAndValidPass(actual, expected, null, done);
          }); // it

        it(`put new entry with targetId = ${c.POSITION.TAIL}`,
            (done) => {
              const actual = testData.ENTRY_WITH_NUMERIC_TYPE;
              const expected = Object.assign({}, actual, { type: actual.type.toString() });
              request.putNewEntryAndValidPass(actual, expected, c.POSITION.TAIL, done);
            }); // it
      }); // describe('Should return 201 when', ...);

      describe('to replace existed entry - ', () => {
        beforeAll((done) => {
          request.putEntry(201, testData.VALID_ENTRY1)
          .then((res) => {
            expect(res.body).toEqualObject(testData.VALID_ENTRY1);
            return request.putEntry(201, testData.VALID_ENTRY2);
          })
          .then((res) => {
            expect(res.body).toEqualObject(testData.VALID_ENTRY2);
            done();
          })
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
        });
        // clean up
        afterAll((done) => {
          request.deleteEntry(200, testData.VALID_ENTRY1.id)
          .then(() => request.deleteEntry(200, testData.VALID_ENTRY2.id))
          .then(() => done())
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
        });

        it('should return 422 when put an exited entry with invalid targetId', (done) => {
          request.putEntry(422, testData.VALID_ENTRY1_WITH_SAMEID, 'NotExistedTargetId')
          .then((res) => {
            expect(res.body).toBeValidationError('target_id_not_found');
            done();
          })
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
        });// it

        it('should return 200 when put an existing entry with valid data and null targetId',
          (done) => {
            request.putExistedEntryAndValidPass(testData.VALID_ENTRY1_WITH_SAMEID,
                testData.VALID_ENTRY1_WITH_SAMEID,
                null,
                done);
          });// it

        it(`should return 200 when put an existing entry with valid data and targetId = ${c.POSITION.TAIL}`,
          (done) => {
            request.putExistedEntryAndValidPass(testData.VALID_ENTRY1_WITH_SAMEID,
                testData.VALID_ENTRY1_WITH_SAMEID,
                c.POSITION.TAIL,
                done);
          });

        it('should return 200 when put an existing entry with valid data and targetId = valid uuid',
          (done) => {
            request.putExistedEntryAndValidPass(testData.VALID_ENTRY1_WITH_SAMEID,
                testData.VALID_ENTRY1_WITH_SAMEID,
                testData.VALID_ENTRY2.id,
                done);
          });// it
      }); // describe('Should return 200 when', ...);
    }); // describe('Put entries', ...);]

    describe('to validate the model functions ', () => {
      it('should make the UT 100% coverage to test Profile.isValidPartial()', (done) => {
        const oldValidations = Profile.validations;
        Profile.validations = undefined;
        Profile.isValidPartial({ g: { f() {} } }, { _id: 'test_Id', orgId: 'a', entries: [] }, undefined, undefined);
        Profile.validations = oldValidations;
        done();
      });// it
    }); // describe('to validate the model functions directly', ...);
  });// describe('validation test', ...);
};

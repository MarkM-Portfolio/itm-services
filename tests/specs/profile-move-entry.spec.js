/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import testData from 'tests/test-data/entry-data';
import validationData from 'tests/test-data/validation-data';
import testUtil from 'tests/utils/test-util';
import constantDef from 'src/utils/constant-def';

function testMoveEntry(request, entries, fromIndex, toIndex, done, post = false, method = '') {
  const entryId = entries[fromIndex].id;
  let targetId = null;
  if (toIndex !== undefined) {
    // move entry to target position
    testUtil.moveArray(entries, fromIndex, toIndex);
    targetId = ((toIndex >= (entries.length - 1)) ?
        constantDef.POSITION.TAIL
        : entries[toIndex + 1].id);
  } else {
    // adjust the entries
    testUtil.moveArray(entries, fromIndex, entries.length - 1);
  }

  if (post) {
    const requestMethod = method ? request[method] : request.postMoveEntry;
    requestMethod(200, entryId, targetId)
    .then(() => request.getEntries(200)).then((res) => {
      expect(res.body.entries).toEqualObjects(entries);
      done();
    }).catch((err) => {
      expect(err).toBeNull();
      done();
    });
  } else {
    const requestMethod = method ? request[method] : request.moveEntry;
    requestMethod(200, entryId, targetId)
    .then(() => request.getEntries(200)).then((res) => {
      expect(res.body.entries).toEqualObjects(entries);
      done();
    }).catch((err) => {
      expect(err).toBeNull();
      done();
    });
  }
}// testMoveEntry

module.exports = (request) => {
  describe('Move entry tests', () => {
    describe('basic validation', () => {
      it('should return 404 when move entry with empty collection', (done) => {
        request.moveEntry(404, testData.PEOPLE_ENTRY1.id, testData.PEOPLE_ENTRY2.id)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it
      it('should return 422 when move entry with longer id', (done) => {
        request.moveEntry(422, validationData.ENTRY_LENGTH_65_ID, testData.PEOPLE_ENTRY2.id)
        .then((res) => {
          expect(res.body).toBeValidationError();
          done();
        }).catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it
      it('should return 422 when move entry with longer targetId', (done) => {
        request.moveEntry(422, testData.PEOPLE_ENTRY2.id, validationData.ENTRY_LENGTH_65_ID)
        .then((res) => {
          expect(res.body).toBeValidationError();
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it
    }); // describe

    describe('move operation', () => {
      const entries = [
        testData.PEOPLE_ENTRY1,
        testData.PEOPLE_ENTRY2,
        testData.COMMUNITY_ENTRY1,
        testData.COMMUNITY_ENTRY2,
      ];

      beforeAll((done) => {
        request.postEntry(201, entries[0])
          .then(() => request.postEntry(201, entries[1]))
          .then(() => request.postEntry(201, entries[2]))
          .then(() => request.postEntry(201, entries[3]))
          .then(() => request.getEntries(200))
          .then((res) => {
            expect(res.body.entries).toEqualObjects(entries);
            done();
          })
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
      }); // beforeAll

      afterAll((done) => {
        request.deleteEntry(200, entries[0].id)
        .then(() => request.deleteEntry(200, entries[1].id))
        .then(() => request.deleteEntry(200, entries[2].id))
        .then(() => request.deleteEntry(200, entries[3].id))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries).toEqualObjects([]);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }); // afterAll()

      it('should return 404 when move entry with error entry-ID', (done) => {
        request.moveEntry(404, 'errorEntryId', testData.PEOPLE_ENTRY2.id)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 422 when move entry with error target-entry-ID', (done) => {
        request.moveEntry(422, testData.PEOPLE_ENTRY1.id, 'errorTargetId')
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 422 when move entry with both same IDs', (done) => {
        request.moveEntry(422, 'sameEntryId', 'sameEntryId')
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 422 when move entry to undefined Postion', (done) => {
        request.moveEntry(422, testData.PEOPLE_ENTRY1.id, null)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 200 when move entry from head to head', (done) => {
        testMoveEntry(request, entries, 0, 0, done);
      });// it

      it('should return 200 when move entry from the position to the same position', (done) => {
        testMoveEntry(request, entries, 2, 2, done, false, 'moveEntryPosition');
      });// it

      it('should return 200 when move entry from tail to head', (done) => {
        testMoveEntry(request, entries, 3, 0, done, true, 'postMoveEntryPosition');
      });// it

      it('should return 200 when move entry from tail to tail', (done) => {
        testMoveEntry(request, entries, 3, 3, done, false, 'moveEntryPosition');
      });// it

      it('should return 200 when move entry from tail to 2nd', (done) => {
        testMoveEntry(request, entries, 3, 2, done, true, 'postMoveEntryPosition');
      });// it

      it('should return 200 when move entry from head to tail', (done) => {
        testMoveEntry(request, entries, 0, 3, done, true);
      });// it

      it('should return 200 when move entry from head to 2nd', (done) => {
        testMoveEntry(request, entries, 0, 2, done, true);
      });// it

      it('should return 200 when move entry from 2nd to 3rd', (done) => {
        testMoveEntry(request, entries, 2, 3, done, true);
      });// it
    });// describe
  }); // describe
};

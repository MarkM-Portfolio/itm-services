/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import testData from '../test-data/entry-data';
import constantDef from '../../src/utils/constant-def';

module.exports = (request) => {
  describe('Profile model', () => {
    describe('get entries', () => {
      let eTagValue = null;

      it('should return 200 and empty list when try to test getEntries', async () => {
        // This testcase is added for
        // In order that the server environment (include mongo) is not ready,
        // which cause test result is not stable
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({}), 9000));
        const requestPromise = async () => {
          try {
            return await request.getEntries(200);
          } catch (err) {
            // no action required
          }
          return {};
        };
        await Promise.race([timeoutPromise, requestPromise()]);
      }, 10000);

      it('should return 201 when post a new entry for 304 testing', (done) => {
        request.postEntry(201, testData.PEOPLE_ENTRY)
        .then((res) => {
          expect(res.body).toEqualObject(testData.PEOPLE_ENTRY);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 and a list with one entry for 304 testing', (done) => {
        request.getEntries(200)
        .then((res) => {
          eTagValue = res.headers[constantDef.ETAG_HEADER];
          expect(eTagValue).toBeDefined();
          expect(eTagValue).not.toBeNull();
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 304 when query api with same ETag for 304 testing', (done) => {
        const headers = { 'if-none-match': eTagValue };
        request.getEntries(304, null, headers)
        .then((res) => {
          expect(res.body).toEqual({});
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 when query api with other eTag for 304 testing', (done) => {
        const headers = { 'if-none-match': 'non-existed-user' };
        request.getEntries(200, null, headers)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 when query api without eTag for 304 testing', (done) => {
        request.getEntries(200)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 when delete the entry for 304 testing', (done) => {
        request.deleteEntry(200, testData.PEOPLE_ENTRY.id)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });
    }); // describe

    describe('basic CRUD operations for profile entries', () => {
      it('should return 201 when post the 1st entry without targetId', (done) => {
        request.postEntry(201, testData.PEOPLE_ENTRY)
        .then((res) => {
          expect(res.body).toEqualObject(testData.PEOPLE_ENTRY);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 201 when put the 2nd entry without targetId', (done) => {
        request.postPutEntry(201, testData.COMMUNITY_ENTRY)
        .then((res) => {
          expect(res.body).toEqualObject(testData.COMMUNITY_ENTRY);
          return request.getEntries(200);
        })
        .then((res) => {
          expect(res.body.entries).not.toBeNull();
          expect(res.body.entries).toEqualObjects([testData.PEOPLE_ENTRY,
            testData.COMMUNITY_ENTRY]);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 201 when post the 3rd entry with targetId', (done) => {
        request.postEntry(201, testData.PEOPLE_ENTRY1, testData.COMMUNITY_ENTRY.id)
        .then((res) => {
          expect(res.body).not.toBeNull();
          expect(res.body).toEqualObject(testData.PEOPLE_ENTRY1);
          return request.getEntries(200);
        })
        .then((res) => {
          expect(res.body.entries).not.toBeNull();
          expect(res.body.entries).toEqualObjects([testData.PEOPLE_ENTRY,
            testData.PEOPLE_ENTRY1,
            testData.COMMUNITY_ENTRY]);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it(`should return 201 when post the 4th entry with targetId = ${constantDef.POSITION.TAIL}`, (done) => {
        request.postEntry(201, testData.COMMUNITY_ENTRY1, constantDef.POSITION.TAIL)
        .then((res) => {
          expect(res.body).not.toBeNull();
          expect(res.body).toEqualObject(testData.COMMUNITY_ENTRY1);
          return request.getEntries(200);
        })
        .then((res) => {
          expect(res.body.entries).not.toBeNull();
          expect(res.body.entries).toEqualObjects([testData.PEOPLE_ENTRY,
            testData.PEOPLE_ENTRY1,
            testData.COMMUNITY_ENTRY,
            testData.COMMUNITY_ENTRY1]);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 201 when put the 5th entry with valid targetId', (done) => {
        request.postEntry(201, testData.COMMUNITY_ENTRY3, testData.PEOPLE_ENTRY1.id)
        .then((res) => {
          expect(res.body).not.toBeNull();
          expect(res.body).toEqualObject(testData.COMMUNITY_ENTRY3);
          return request.getEntries(200);
        })
        .then((res) => {
          expect(res.body.entries).not.toBeNull();
          expect(res.body.entries).toEqualObjects([testData.PEOPLE_ENTRY,
            testData.COMMUNITY_ENTRY3,
            testData.PEOPLE_ENTRY1,
            testData.COMMUNITY_ENTRY,
            testData.COMMUNITY_ENTRY1]);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it(`should return 201 when put the 6th entry with targetId = ${constantDef.POSITION.TAIL}`, (done) => {
        request.postEntry(201, testData.PEOPLE_ENTRY3, constantDef.POSITION.TAIL)
        .then((res) => {
          expect(res.body).not.toBeNull();
          expect(res.body).toEqualObject(testData.PEOPLE_ENTRY3);
          return request.getEntries(200);
        })
        .then((res) => {
          expect(res.body.entries).not.toBeNull();
          expect(res.body.entries).toEqualObjects([testData.PEOPLE_ENTRY,
            testData.COMMUNITY_ENTRY3,
            testData.PEOPLE_ENTRY1,
            testData.COMMUNITY_ENTRY,
            testData.COMMUNITY_ENTRY1,
            testData.PEOPLE_ENTRY3]);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 200 when replace the existing entry without targetId', (done) => {
        request.putEntry(200, testData.PEOPLE_ENTRY_WITH_SAMEID)
        .then((res) => {
          expect(res.body).not.toBeNull();
          expect(res.body).toEqualObject(testData.PEOPLE_ENTRY_WITH_SAMEID);
          return request.getEntries(200);
        })
        .then((res) => {
          expect(res.body.entries).not.toBeNull();
          expect(res.body.entries).toEqualObjects([testData.PEOPLE_ENTRY_WITH_SAMEID,
            testData.COMMUNITY_ENTRY3,
            testData.PEOPLE_ENTRY1,
            testData.COMMUNITY_ENTRY,
            testData.COMMUNITY_ENTRY1,
            testData.PEOPLE_ENTRY3]);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 200 when replace the existing entry with targetId', (done) => {
        request.putEntry(200, testData.COMMUNITY_ENTRY_WITH_SAMEID, testData.PEOPLE_ENTRY1.id)
        .then((res) => {
          expect(res.body).not.toBeNull();
          expect(res.body).toEqualObject(testData.COMMUNITY_ENTRY_WITH_SAMEID);
          return request.getEntries(200);
        })
        .then((res) => {
          expect(res.body.entries).not.toBeNull();
          expect(res.body.entries).toEqualObjects([testData.PEOPLE_ENTRY_WITH_SAMEID,
            testData.COMMUNITY_ENTRY3,
            testData.COMMUNITY_ENTRY_WITH_SAMEID,
            testData.PEOPLE_ENTRY1,
            testData.COMMUNITY_ENTRY1,
            testData.PEOPLE_ENTRY3]);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it(`should return 200 when replace the existing entry with targetId = ${constantDef.POSITION.TAIL}`, (done) => {
        request.putEntry(200, testData.PEOPLE_ENTRY1, constantDef.POSITION.TAIL)
        .then((res) => {
          expect(res.body).not.toBeNull();
          expect(res.body).toEqualObject(testData.PEOPLE_ENTRY1);
          return request.getEntries(200);
        })
        .then((res) => {
          expect(res.body.entries).not.toBeNull();
          expect(res.body.entries).toEqualObjects([testData.PEOPLE_ENTRY_WITH_SAMEID,
            testData.COMMUNITY_ENTRY3,
            testData.COMMUNITY_ENTRY_WITH_SAMEID,
            testData.COMMUNITY_ENTRY1,
            testData.PEOPLE_ENTRY3,
            testData.PEOPLE_ENTRY1]);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 422 when post the 7th entry with not-existed-targetId', (done) => {
        request.postEntry(422, testData.COMMUNITY_ENTRY2, 'NotExistedTargetId')
        .then((res) => {
          expect(res.body).toBeValidationError('target_id_not_found');
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 422 when replace the existing entry with not-existed-targetId', (done) => {
        request.putEntry(422, testData.COMMUNITY_ENTRY_WITH_SAMEID, 'NotExistedTargetId')
        .then((res) => {
          expect(res.body).toBeValidationError('target_id_not_found');
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 422 when put a new entry with not existed targetId', (done) => {
        request.putEntry(422, testData.COMMUNITY_ENTRY2, 'NotExistedTargetId')
        .then((res) => {
          expect(res.body).toBeValidationError('target_id_not_found');
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

   // test paging with the existed entries above
      it('should return 200 and 6 entries when get entries without page parameters', (done) => {
        request.getEntries(200)
        .then((res) => {
          expect(res.body.entries.length).toEqual(6);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 and 2 entries when get entries with hidden true', (done) => {
        const opt = { hidden: true };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(2);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 and 4 entries when get entries with hidden false', (done) => {
        const opt = { hidden: false };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(4);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 and 4 entries when get entries with both page and ps ', (done) => {
        const opt = { page: 1, ps: 4 };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(4);
          expect(res.body.totalResults).toEqual(6);
          expect(res.body.page).toEqual(1);
          expect(res.body.next).toEqual(jasmine.stringMatching('page=2'));
          expect(res.body.next).toEqual(jasmine.stringMatching('ps=4'));
          expect(res.body.previousPage).toBeUndefined();
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 and 2 entries when get entries with page and ps to get last page', (done) => {
        const opt = { page: 2, ps: 4 };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(2);
          expect(res.body.totalResults).toEqual(6);
          expect(res.body.page).toEqual(2);
          expect(res.body.previous).toBeDefined();
          expect(res.body.nextPage).toBeUndefined();
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 and 4 entries when get entries with both page, ps and hidden ', (done) => {
        const opt = { page: 1, ps: 3, hidden: false };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(3);
          expect(res.body.totalResults).toEqual(4);
          expect(res.body.page).toEqual(1);
          expect(res.body.next).toEqual(jasmine.stringMatching('page=2'));
          expect(res.body.next).toEqual(jasmine.stringMatching('ps=3'));
          expect(res.body.next).toEqual(jasmine.stringMatching('hidden=false'));
          expect(res.body.previousPage).toBeUndefined();
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      // edge case
      it('should return 200 and first page when get entries with invalide page and valid ps', (done) => {
        const opt = { page: -2, ps: 4 };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(4);
          expect(res.body.totalResults).toEqual(6);
          expect(res.body.page).toEqual(1);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      // edge case
      it('should return 200 and 0 entries when get entries with invalid page and ps', (done) => {
        const opt = { page: -1, ps: -4 };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(0);
          expect(res.body.totalResults).toEqual(6);
          expect(res.body.page).toEqual(1);
          expect(res.body.ps).toEqual(0);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

    // edge case
      it('should return 200 and first page when get entries with only page size parameter', (done) => {
        const opt = { ps: 4 };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(4);
          expect(res.body.totalResults).toEqual(6);
          expect(res.body.page).toEqual(1);
          expect(res.body.next).toEqual(jasmine.stringMatching('page=2'));
          expect(res.body.next).toEqual(jasmine.stringMatching('ps=4'));
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

    // edge case
      it('should return 200 and first page with default page size 10 when get entries with only page parameter', (done) => {
        const opt = { page: 2 };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(0);
          expect(res.body.totalResults).toEqual(6);
          expect(res.body.page).toEqual(2);
          expect(res.body.ps).toEqual(constantDef.DEFAULT_PAGE_SIZE);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

   // edge case
      it('should return 200 and first page when get entries with with ps exceeds 100', (done) => {
        const opt = { page: 1, ps: 150 };
        request.getEntries(200, opt)
        .then((res) => {
          expect(res.body.entries.length).toEqual(6);
          expect(res.body.totalResults).toEqual(6);
          expect(res.body.page).toEqual(1);
          expect(res.body.ps).toEqual(constantDef.MAXIMUM_PAGE_SIZE);
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 when delete the 1st creation entry', (done) => {
        request.deleteEntry(200, testData.PEOPLE_ENTRY.id)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 404 when delete a non existed entry with entries in db', (done) => {
        request.deleteEntry(404, 'nonExistedEntryId')
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 422 when delete with invalid input id longer than 64', (done) => {
        request.deleteEntry(422, 'stringlongerthan64stringlongerthan64stringlongerthan64stringlongerthan64')
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 when delete the 2nd creation entry', (done) => {
        request.deleteEntry(200, testData.COMMUNITY_ENTRY.id)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 when delete the 3rd creation entry', (done) => {
        request.deleteEntry(200, testData.PEOPLE_ENTRY1.id)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 when delete the 4th creation entry', (done) => {
        request.deleteEntry(200, testData.COMMUNITY_ENTRY1.id, true)
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 200 when delete a non existed entry in db', (done) => {
        request.deleteEntries(200, 'nonExistedEntryId')
          .then((res) => {
            expect(res.body).toEqual({
              deletedIDs: [],
              invalidIDs: ['nonExistedEntryId'],
            });
            done();
          })
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
      });

      it('should return 200 when delete the 5th and 6th creation entries', (done) => {
        const idstring = `${testData.COMMUNITY_ENTRY3.id},${testData.PEOPLE_ENTRY3.id},nonExistedEntryId`;
        request.deleteEntries(200, idstring)
          .then((res) => {
            expect(res.body).toEqual({
              deletedIDs: [testData.COMMUNITY_ENTRY3.id, testData.PEOPLE_ENTRY3.id],
              invalidIDs: ['nonExistedEntryId'],
            });
            done();
          })
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
      });

      it('should return 200 when delete a non existed entry with no entries in db', (done) => {
        request.deleteEntries(200, 'nonExistedEntryId', true)
          .then((res) => {
            expect(res.body).toEqual({
              deletedIDs: [],
              invalidIDs: ['nonExistedEntryId'],
            });
            done();
          })
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
      });

      it('should return 422 when delete with invalid input id longer than 64', (done) => {
        request.deleteEntries(422, 'stringlongerthan64stringlongerthan64stringlongerthan64stringlongerthan64')
          .then(() => done())
          .catch((err) => {
            expect(err).toBeNull();
            done();
          });
      });

      it('should return 200 and empty list', (done) => {
        request.getEntries(200)
        .then((res) => {
          expect(res.body).toEqual({
            entries: [],
          });
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });

      it('should return 404 when delete a non existed entry with no entries in db', (done) => {
        request.deleteEntry(404, 'nonExistedEntryId')
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });
    });// describe

    describe('use post to override delete and put operations', () => {
      it('should return 422 when move entry with post request without header x-http-method-override', (done) => {
        request.postMoveEntry(422, 'sourceId', 'targetId', false)
        .then((res) => {
          expect(res.body.error).not.toBeNull();
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it

      it('should return 422 when delete entries with post request without header x-http-method-override', (done) => {
        request.postDeleteEntries(422, 'entryId', false)
        .then((res) => {
          expect(res.body.error).not.toBeNull();
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it


      it('should return 422 when delete entry with post request without header x-http-method-override', (done) => {
        request.postDeleteEntry(422, 'entryId', false)
        .then((res) => {
          expect(res.body.error).not.toBeNull();
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      });// it
    });// describe
  }); // describe
};

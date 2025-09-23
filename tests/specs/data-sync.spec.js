/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import loopback from 'loopback';
import nock from 'nock';
import _ from 'lodash';
import gk from '@connections/utils-gatekeeper';
import { EVENTS } from 'src/utils/connections-events';
import eventUtil from 'tests/utils/event-util';
import testData from 'tests/test-data/entry-data';
import c from 'src/utils/constant-def';

function makeOldEntryBy(entry) {
  const clonedEntry = _.cloneDeep(entry);
  clonedEntry.synced = new Date((Date.now() - 104400000)); // - 29 hours
  return clonedEntry;
}

module.exports = (request) => {
  describe('DataSync through redis list', () => {
    describe('sync community name update', () => {
      it('should get entry with new name after publish name change event with blue/gree event string', async () => {
        const entry = makeOldEntryBy(testData.COMMUNITY_ENTRY1);
        const objectId = entry.id;
        const objectName = 'New Name';
        // Emulate the message body of Blue/Green event
        /* eslint-disable no-useless-escape */
        const event = `\n{\n  \"name\":\"community.updated\",\n  \"object\":{\n    \"id\":\"${objectId}\",\n    \"name\":\"${objectName}\"\n}\n}`;
        /* eslint-enable no-useless-escape */
        await request.postEntry(201, entry);

        await eventUtil.publishConnectionsEvent(event);
        const res = await request.getEntries(200);
        expect(res.body.entries[0].name).toEqual(objectName);
        await request.deleteEntry(200, entry.id);
      }, 5000); // it

      it('should get entry with the same name after publish unrelated event', (done) => {
        const entry = makeOldEntryBy(testData.COMMUNITY_ENTRY);
        const event = {
          name: c.EVENTS.COMMUNITY_UPDATED,
          object: {
            id: `${entry.id}_differentid`,
            name: 'New Name',
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].name).toEqual(entry.name);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it('should get entry with same name after publish the event without id and name', (done) => {
        const entry = makeOldEntryBy(testData.COMMUNITY_ENTRY);
        const event = {
          name: c.EVENTS.COMMUNITY_UPDATED,
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].name).toEqual(entry.name);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry with same name after publish the event whose name is not ${c.EVENTS.COMMUNITY_UPDATED}`, (done) => {
        const entry = makeOldEntryBy(testData.COMMUNITY_ENTRY);
        const event = {
          name: 'BAD EVENT',
          object: {
            id: entry.id,
            name: 'New Name',
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].name).toEqual(entry.name);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it('should get entry with new name after publish the same event twice', (done) => {
        const entry = makeOldEntryBy(testData.COMMUNITY_ENTRY);
        const event = {
          name: c.EVENTS.COMMUNITY_UPDATED,
          object: {
            id: entry.id,
            name: 'New Name',
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].name).toEqual(event.object.name);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it
    });// describe

    describe('sync community delete/restored', () => {
      it(`should get entry with delete state after publish ${c.EVENTS.COMMUNITY_DELETED} event`, (done) => {
        const entry = makeOldEntryBy(testData.COMMUNITY_ENTRY);
        const deleteEvent = {
          name: c.EVENTS.COMMUNITY_DELETED,
          object: {
            id: entry.id,
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(deleteEvent))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual([c.STATE.DELETED]);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry with delete state after publish ${c.EVENTS.COMMUNITY_DELETED} event in edge case`, (done) => {
        const entry = makeOldEntryBy(testData.COMMUNITY_ENTRY);
        entry.states = [c.STATE.DELETED, c.STATE.NOACCESS];
        const deleteEvent = {
          name: c.EVENTS.COMMUNITY_DELETED,
          object: {
            id: entry.id,
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(deleteEvent))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual(entry.states);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry with normal state after publish ${c.EVENTS.COMMUNITY_RESTORED} events`, (done) => {
        const entry = makeOldEntryBy(testData.COMMUNITY_ENTRY);
        entry.states = [c.STATE.DELETED];
        const restoreEvent = {
          name: c.EVENTS.COMMUNITY_RESTORED,
          object: {
            id: entry.id,
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(restoreEvent))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual([]);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry with normal state after publish ${c.EVENTS.COMMUNITY_RESTORED} events in edge case`, (done) => {
        const entry = makeOldEntryBy(testData.COMMUNITY_ENTRY);
        entry.states = [c.STATE.NOACCESS];
        const restoreEvent = {
          name: c.EVENTS.COMMUNITY_RESTORED,
          object: {
            id: entry.id,
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(restoreEvent))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual(entry.states);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it
    });// describe

    describe('sync communities ACL change', () => {
      beforeAll(() => {
        if (!gk.get('communities-acl-sync')) {
          gk.update('communities-acl-sync', true);
        }
        nock(process.env.PEOPLE_PROFILE_URL)
        .post(c.URLS.PEOPLE_PROFILE_BATCH_ID_MAPPING_URL).times(1000)
        .reply(200, { success: [{
          id: 'id_in_mongodb_success',
          internalId: `${request.user.id}_key`,
          externalId: request.user.id,
          orgId: 'a',
          created: new Date(),
        }],
          error: [] });
      }); // beforeAll

      afterAll(() => {
        if (gk.get('communities-acl-sync')) {
          gk.update('communities-acl-sync', false);
        }
      }); // afterAll

      it(`should get entry with NOACCESS states after publish ${c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE} event`, (done) => {
        const entry = testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC;
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          targetingData: {
            targetPeople:
              [request.user.id],
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual([c.STATE.NOACCESS]);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry with NORMAL states after publish ${c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE} event for public community`, (done) => {
        const entry = testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC;
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          scope: 'PUBLIC',
          targetingData: {
            targetPeople:
              [request.user.id],
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual([]);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry with [DELETED, NOACCESS] states after publish ${c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE} event`, (done) => {
        const entry = testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC;
        entry.states = [c.STATE.DELETED];
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          targetingData: {
            targetPeople:
              [request.user.id],
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual([c.STATE.DELETED, c.STATE.NOACCESS]);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry still NOACCESS states after publish ${c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE} event`, (done) => {
        process.env.S2S_AUTH_TOKEN = 's2s_secret';
        const entry = testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC;
        entry.states = [c.STATE.NOACCESS];
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_REMOVE,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          targetingData: {
            targetPeople:
              [request.user.id],
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual([c.STATE.NOACCESS]);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry with NORMAL states after publish ${c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED} event`, (done) => {
        const entry = testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC;
        entry.states = [c.STATE.NOACCESS];
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          targetingData: {
            targetPeople:
              [request.user.id],
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual([]);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry with [DELETED] states after publish ${c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED} event`, (done) => {
        const entry = testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC;
        entry.states = [c.STATE.DELETED];
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          targetingData: {
            targetPeople:
              [request.user.id],
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual([c.STATE.DELETED]);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it(`should get entry with [DELETED] states after publish ${c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED} event`, (done) => {
        const entry = testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC;
        entry.states = [c.STATE.DELETED, c.STATE.NOACCESS];
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          targetingData: {
            targetPeople:
              [request.user.id],
          },
        };
        request.postEntry(201, entry)
        .then(() => eventUtil.publishConnectionsEvent(event))
        .then(() => request.getEntries(200))
        .then((res) => {
          expect(res.body.entries[0].states).toEqual([c.STATE.DELETED]);
        })
        .then(() => request.deleteEntry(200, entry.id))
        .then(() => done())
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      }, 5000); // it

      it('should survive given an event without targetingData', (done) => {
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
        };
        eventUtil.publishConnectionsEvent(event).then(() => done());
      });// it

      it('should survive given an event with non-existed exid', (done) => {
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          targetingData: {
            targetPeople:
                ['non.existed.exid'],
          },
        };
        eventUtil.publishConnectionsEvent(event).then(() => done());
      });// it

      it('should survive given an event without non-existed community', (done) => {
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED,
          object: { id: 'non.existed.communnity.id' },
          targetingData: {
            targetPeople:
                [request.user.id],
          },
        };
        eventUtil.publishConnectionsEvent(event).then(() => done());
      });// it
    });// describe

    describe('for edge cases to make 100% coverage', () => {
      const defaultCb = EVENTS.cb;

      it(`To given an event ${c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED} when feature is disabled`, () => {
        if (gk.get('communities-acl-sync')) {
          gk.update('communities-acl-sync', false);
        }
        const event = {
          name: c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED,
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
        };
        const eventMessage = JSON.stringify(event);
        EVENTS.handleEvent(null, ['ut', eventMessage]);
      });
      it('To trigger error callback when call loadPeopleIdsByExids', () => {
        const User = loopback.Model.registry.getModel('User');
        const Profile = loopback.Model.registry.getModel('Profile');
        const event = {
          name: 'c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED',
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          targetingData: {
            targetPeople:
              [request.user.id],
          },
        };
        const oldFunction = User.loadPeopleIdsByExids;
        User.loadPeopleIdsByExids = (exIds, cb) => {
          cb(new Error(), null, null);
        };
        Profile.handleSyncEvent(event, () => {
          User.loadPeopleIdsByExids = oldFunction;
        });
      });

      it('To trigger non-empty error when call loadPeopleIdsByExids', () => {
        const User = loopback.Model.registry.getModel('User');
        const Profile = loopback.Model.registry.getModel('Profile');
        const event = {
          name: 'c.EVENTS.COMMUNITY_MEMBERSHIP_ADDED',
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
          targetingData: {
            targetPeople:
              [request.user.id],
          },
        };
        const oldFunction = User.loadPeopleIdsByExids;
        User.loadPeopleIdsByExids = (exIds, cb) => {
          cb(null,
             null,
            { success: ['test'],
              error: [{
                internalId: '',
                externalId: request.user.id,
                message: 'cannot find matched user by given internalId or externalId',
              }],
            });
        };
        Profile.handleSyncEvent(event, () => {
          User.loadPeopleIdsByExids = oldFunction;
        });
      });

      it('To given an unsupported event to Model Latestentrydata', () => {
        const Latestentrydata = loopback.Model.registry.getModel('Latestentrydata');
        const event = {
          name: 'unsupported_event_name',
          object: { id: testData.COMMUNITY_ENTRY_MEMBERSHIP_SYNC.id },
        };
        Latestentrydata.handleSyncEvent(event, () => {});
      });

      it('To given an error occurred', () => {
        EVENTS.cb = (err) => {
          defaultCb(err);
          expect(err).not.toBeNull();
        };
        EVENTS.handleEvent(new Error(), null);
      });

      it('To given a null event', () => {
        EVENTS.cb = (err) => {
          defaultCb(err);
          expect(err).toBeNull();
        };
        EVENTS.handleEvent(null, null);
      });// it

      it('To  given a bad event', () => {
        EVENTS.cb = (err) => {
          defaultCb(err);
          expect(err).not.toBeNull();
        };
        EVENTS.handleEvent(null, [
          c.CONNECTIONS_EVENTS_SUBSCRIPTION_LIST,
          '"content":"dfgdfg\'(select*from(select(sleep(20)))a)\'"',
        ]);
      });// it
    });// describe
  });// describe

  describe('Data Sync through Profiles Bulk API when enable sync-people-changes gatekeeper', () => {
    const oldGK = gk.get('sync-people-changes');
    beforeAll((done) => {
      if (!oldGK) {
        gk.update('sync-people-changes', true);
      }
      done();
    }); // beforeAll

    afterAll((done) => {
      gk.update('sync-people-changes', oldGK);
      done();
    }); // afterAll

    it('should return the changed name and state from profiles bulk api when calling the get api', (done) => {
      const peopleEntry1 = makeOldEntryBy(testData.PEOPLE_ENTRY1);
      const peopleEntry2 = makeOldEntryBy(testData.PEOPLE_ENTRY2);
      const peopleEntry3 = makeOldEntryBy(testData.PEOPLE_ENTRY3);
      const commEntry = makeOldEntryBy(testData.COMMUNITY_ENTRY);

      nock(process.env.CONNECTIONS_PROFILES_URL)
      .post('/json/profileBulk.do', { keys: [peopleEntry1.id, peopleEntry2.id, peopleEntry3.id] })
      .reply(200, { requestType: 'keys',
        profiles: [{ pepole001: { state: 'active', profKey: 'people001', email: 'people001@mock.com', displayName: 'Amy Jones1 new name', exid: 'people001-exid', orgid: 'a' } },
                                                    { pepole002: { state: 'inactive', profKey: 'people002', email: 'people002@mock.com', displayName: 'Amy Jones2 new name', exid: 'people002-exid', orgid: 'a' } },
                                                    { pepole003: { state: 'deleted', profKey: 'people003', email: 'people003@mock.com', displayName: 'Amy Jones3', exid: 'people003-exid', orgid: 'a' } }] });

      request.postEntry(201, peopleEntry1)
      .then(() => request.postEntry(201, peopleEntry2))
      .then(() => request.postEntry(201, peopleEntry3))
      .then(() => request.postEntry(201, commEntry))
      .then(() => {
        request.getEntries(200)
        .then((res) => {
          const entries1 = res.body.entries;
          const entry1 = entries1.find(entry => entry.id === peopleEntry1.id);
          expect(entry1.states.length).toEqual(0);
          expect(entry1.name).toEqual('Amy Jones1 new name');
          const entry2 = entries1.find(entry => entry.id === peopleEntry2.id);
          expect(entry2.states[0]).toEqual(c.STATE.INACTIVE);
          expect(entry2.name).toEqual('Amy Jones2 new name');
          const entry3 = entries1.find(entry => entry.id === peopleEntry3.id);
          expect(entry3.states[0]).toEqual(c.STATE.DELETED);
          expect(entry3.name).toEqual('Amy Jones3');
          expect(entry3.metadata.email).toEqual('people003@mock.com');
          return request.deleteEntry(200, peopleEntry1.id);
        })
        .then(() => request.deleteEntry(200, peopleEntry2.id))
        .then(() => request.deleteEntry(200, peopleEntry3.id))
        .then(() => request.deleteEntry(200, commEntry.id))
        .then(() => {
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    });

    it('edge case for not expired entries', (done) => {
      nock(process.env.CONNECTIONS_PROFILES_URL)
      .post('/json/profileBulk.do', { keys: [testData.PEOPLE_ENTRY1.id] })
      .reply(200, { requestType: 'keys',
        profiles: [{ pepole001: { state: 'active', profKey: 'people001', email: 'people001@mock.com', displayName: 'mock name', exid: 'people001-exid', orgid: 'a' } }],
      });
      request.postEntry(201, testData.PEOPLE_ENTRY1)
      .then(() => {
        request.getEntries(200)
        .then((res) => {
          const entry = res.body.entries[0];
          expect(entry.name).toEqual(testData.PEOPLE_ENTRY1.name);

          return request.deleteEntry(200, testData.PEOPLE_ENTRY1.id);
        })
        .then(() => {
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    });

    it('edge case when profiles bulk api return error', (done) => {
      const peopleEntry2 = makeOldEntryBy(testData.PEOPLE_ENTRY2);
      peopleEntry2.states = ['DELETED'];
      nock(process.env.CONNECTIONS_PROFILES_URL)
      .post('/json/profileBulk.do', { keys: [peopleEntry2.id] })
      .reply(200, {});

      request.postEntry(201, peopleEntry2)
      .then(() => {
        request.getEntries(200)
        .then((res) => {
          const entry = res.body.entries[0];
          expect(entry.states[0]).toEqual('DELETED');
          expect(entry.name).toEqual(peopleEntry2.name);
          return request.deleteEntry(200, peopleEntry2.id);
        })
        .then(() => {
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    });

    it('edge case for profiles bulk api return incorrect values', (done) => {
      const peopleEntry3 = makeOldEntryBy(testData.PEOPLE_ENTRY3);
      peopleEntry3.states = ['DELETED'];
      nock(process.env.CONNECTIONS_PROFILES_URL)
      .post('/json/profileBulk.do', { keys: [peopleEntry3.id] })
      .reply(200, { requestType: 'keys',
        profiles: [{ pepole003: { state: null, profKey: 'people003', email: 'people003@mock.com', displayName: null, exid: 'people003-exid', orgid: 'a' } },
                   { pepole001: { state: null, profKey: 'people001', email: 'people001@mock.com', displayName: null, exid: 'people001-exid', orgid: 'a' } }],
      });

      request.postEntry(201, peopleEntry3)
      .then(() => {
        request.getEntries(200)
        .then((res) => {
          const entry = res.body.entries[0];
          expect(entry.states[0]).toEqual('DELETED');
          expect(entry.name).toEqual('');
          return request.deleteEntry(200, peopleEntry3.id);
        })
        .then(() => {
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    });

 // invalid key will be deleted from ITM favorite
    it('edge case for profiles bulk api return invalid keys', (done) => {
      const peopleEntry1 = makeOldEntryBy(testData.PEOPLE_ENTRY1);
      const peopleEntry3 = makeOldEntryBy(testData.PEOPLE_ENTRY3);
      nock.cleanAll();
      nock(process.env.CONNECTIONS_PROFILES_URL)
      .post('/json/profileBulk.do', { keys: [peopleEntry1.id, peopleEntry3.id] })
      .reply(200, {
        requestType: 'keys',
        profiles: [{ pepole001: { state: 'active', profKey: 'people001', email: 'people001@mock.com', displayName: 'people001', exid: 'people001-exid', orgid: 'a' } }],
        'invalid-keys': [peopleEntry3.id],
      });
      request.postEntry(201, peopleEntry1)
      .then(() => request.postEntry(201, peopleEntry3))
      .then(() => {
        request.getEntries(200)
        .then((res) => {
          const entries = res.body.entries;
          expect(entries.length).toEqual(1);

          return request.deleteEntry(200, peopleEntry1.id);
        })
        .then(() => {
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    });
  });  // describe

  describe('Data Sync through Profiles Bulk API when disable sync-people-changes gatekeeper', () => {
    const oldGK = gk.get('sync-people-changes');
    beforeAll((done) => {
      if (oldGK) {
        gk.update('sync-people-changes', false);
      }

      done();
    }); // beforeAll

    afterAll((done) => {
      gk.update('sync-people-changes', oldGK);
      done();
    }); // afterAll
    it('edge case when disable gatekeeper', (done) => {
      request.postEntry(201, testData.PEOPLE_ENTRY1)
      .then(() => {
        request.getEntries(200)
        .then((res) => {
          const entry = res.body.entries[0];
          expect(entry.name).toEqual(testData.PEOPLE_ENTRY1.name);

          return request.deleteEntry(200, testData.PEOPLE_ENTRY1.id);
        })
        .then(() => {
          done();
        })
        .catch((err) => {
          expect(err).toBeNull();
          done();
        });
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    });
  }); // describe
};

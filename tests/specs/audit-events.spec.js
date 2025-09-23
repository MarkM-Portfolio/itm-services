/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import gkModule from '@connections/utils-gatekeeper';
import eventUtil from 'tests/utils/event-util';
import AuditEvent from 'src/audit-events/events';
import testData from 'tests/test-data/entry-data';

module.exports = (request) => {
  describe('Audit Events', () => {
    beforeAll((done) => {
      if (!gkModule.get('audit-events')) {
        gkModule.update('audit-events', true);
      }
      eventUtil.cleanITMEventsMessageQueue()
      .then(() => eventUtil.setITMEventsMessageGroup())
      .then(() => done());
    }); // beforeAll

    afterAll(() => {
      if (gkModule.get('audit-events')) {
        gkModule.update('audit-events', false);
      }
    }); // afterAll

    it('should not trigger any AuditEvent when post/update/delete hidden entry', (done) => {
      const entry = testData.PEOPLE_ENTRY_AUDITEVENT_HIDDEN;
      request.postEntry(201, entry)
      .then((res) => {
        expect(res.body).not.toBeNull();
        res.body.name = `${res.body.name}-updated`;
        return request.putEntry(200, res.body);
      })
      .then(res => request.deleteEntry(200, res.body.id))
      .then(() => done())
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    }, 5000); // it

    it('should receive post/update/delete AuditEvents when post/update/delete an entry', (done) => {
      const entry = testData.PEOPLE_ENTRY_AUDITEVENT;
      request.postEntry(201, entry)
      .then(() => eventUtil.listenITMEvent())
      .then((message) => {
        expect(message.length).toEqual(2);
        const event = JSON.parse(message[1]);
        expect(event.object.id).toEqual(entry.id);
        expect(event.name).toEqual(AuditEvent.CREATE.name);
        entry.name = `${entry.name}-updated`;
        return request.putEntry(200, entry);
      })
      .then(() => eventUtil.listenITMEvent())
      .then((message) => {
        expect(message.length).toEqual(2);
        const event = JSON.parse(message[1]);
        expect(event.object.id).toEqual(entry.id);
        expect(event.name).toEqual(AuditEvent.UPDATE.name);
        return request.deleteEntry(200, entry.id);
      })
      .then(() => eventUtil.listenITMEvent())
      .then((message) => {
        expect(message.length).toEqual(2);
        const event = JSON.parse(message[1]);
        expect(event.object.id).toEqual(entry.id);
        expect(event.name).toEqual(AuditEvent.DELETE.name);
        done();
      })
      .catch((err) => {
        expect(err).toBeNull();
        done();
      });
    }, 5000); // it
  });// describe
};

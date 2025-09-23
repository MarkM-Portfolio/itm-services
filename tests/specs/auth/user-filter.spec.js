/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

module.exports = (request) => {
  describe('User filter testing', () => {
    it('Test user filter, it will return 401 when there is no cookie', (done) => {
      request.get('/entries')
        .expect(401)
        .end(() => {
          done();
        });
    });
  });
};


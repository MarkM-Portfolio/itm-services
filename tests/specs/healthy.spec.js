/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

module.exports = (request) => {
  describe('Healthy check', () => {
    it('should return 200 when check healthy', (done) => {
      const expectedStatus = 200;
      const url = '/healthy';
      request.get(url)
      .set('Content-Type', 'application/json')
      .expect(expectedStatus)
      .end((err, res) => {
        expect(err).toBeNull();
        expect(res.body).not.toBeNull();
        expect(res.body.name).toBe('itm-services');
        expect(res.body.status).toBe(200);
        done();
      });
    });
  });
};

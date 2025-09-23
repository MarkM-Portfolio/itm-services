/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

module.exports = () => (req, res) => {
  const buildVersion = { version: process.env.BUILD_VERSION || 'unknown version' };
  res.status(200).json(buildVersion);
};

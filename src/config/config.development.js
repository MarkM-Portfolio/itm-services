/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

module.exports = (() => {
  const config = {};
  if (process.env.npm_config_server_port) {
    config.port = process.env.npm_config_server_port;
  }
  return config;
})();

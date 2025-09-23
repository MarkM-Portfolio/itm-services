/* Copyright IBM Corp. 2017  All Rights Reserved.                    */
import { isMongoX509Enabled } from '../config/itm-config';

const initialStatus = isMongoX509Enabled();

module.exports = () => (req, res) => {
  const currentStatus = isMongoX509Enabled();
  if (initialStatus !== currentStatus) {
    res.status(500).json({ name: 'itm-services', status: 500, error: `mongo x509 configuration changed to ${currentStatus}` });
  } else {
    res.status(200).json({ name: 'itm-services', status: 200 });
  }
};

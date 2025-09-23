/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import c from 'src/utils/constant-def';
import modelUtils from 'src/utils/model-utils';

module.exports = (Image) => {
  modelUtils.overridePresence(Image);
  Image.validatesPresenceOf('url', {
    message: 'msg_itm_cannot_be_blank',
  });
  Image.validatesLengthOf('url', {
    min: c.URL_MIN_LENGTH,
    max: c.URL_MAX_LENGTH,
    message: {
      null: 'msg_itm_cannot_null',
      blank: 'msg_itm_cannot_be_blank',
      min: ['msg_itm_property_too_short', c.URL_MIN_LENGTH],
      max: ['msg_itm_property_too_long', c.URL_MAX_LENGTH],
    },
  });
};

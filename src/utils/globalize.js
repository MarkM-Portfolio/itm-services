/* Copyright IBM Corp. 2017  All Rights Reserved.                    */

import SG from 'strong-globalize';
import globalize from 'strong-globalize/lib/globalize';
import fs from 'fs';
import path from 'path';
import Negotiator from 'negotiator';
import { loggerFactory } from '@connections/utils-logger';

const logger = loggerFactory({ level: process.env.LOG_LEVEL || 'info' });

SG.SetRootDir(path.join(__dirname, '..'));

const langs = fs.readdirSync(path.join(__dirname, '../intl'));
langs.forEach((lang) => {
  globalize.loadGlobalize(lang);
});

export default class CustomSG extends SG {
  setLangFromRequest(req) {
    const negotiator = new Negotiator(req);
    const langFromReq = negotiator.language();
    let lang = (langFromReq === '*') ?
      globalize.setDefaultLanguage() :
      langFromReq.substring(0, 2);
    if (lang === 'zh') {
      // zh --> zh-CN --> zh-CHS --> zh-SG --> zh-Hans --> (Simplified)
      // zh-TW --> zh-CHT --> zh-HK --> zh-MO --> zh-Hant --> (Traditional)
      lang = 'zh-Hans';
      const region = langFromReq.toLowerCase().substring(3);
      if (region === 'tw' ||
          region === 'cht' ||
          region === 'hk' ||
          region === 'mo' ||
          region === 'hant') {
        lang = 'zh-Hant';
      }
    }
    // pt    --> pt-PT
    // pt-pt --> pt-PT
    // pt-BR --> pt
    if (lang === 'pt') {
      const region = langFromReq.toLowerCase();
      if (region === 'pt-br') {
        lang = 'pt';
      } else {
        lang = 'pt-PT';
      }
    }
    this.setLanguage(lang);
    req.lang = this.getLanguage();
    logger.silly(`input from request lang = ${langFromReq}, really configured lang = ${req.lang}`);
    return req.lang;
  }
}

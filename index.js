'use strict';

const JsonDatabase = require('./JsonDatabase');

/**
 * كل مجموعة بيانات (Collection) لها ملف JSON مستقل داخل storage/
 */
const configDB = new JsonDatabase('config.json');
const statsDB = new JsonDatabase('stats.json');
const playersDB = new JsonDatabase('players.json');
const logsDB = new JsonDatabase('logs.json');
const messagesDB = new JsonDatabase('messages.json');

module.exports = {
  configDB,
  statsDB,
  playersDB,
  logsDB,
  messagesDB,
};

'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { logsDB } = require('../database');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[config.bot.logLevel] ?? LEVELS.info;

const LOG_DIR = path.join(__dirname, '..', 'storage', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function timestamp() {
  return new Date().toISOString();
}

function colorize(level, text) {
  const colors = {
    error: '\x1b[31m',
    warn: '\x1b[33m',
    info: '\x1b[36m',
    debug: '\x1b[90m',
  };
  const reset = '\x1b[0m';
  return `${colors[level] || ''}${text}${reset}`;
}

function writeToFile(category, entry) {
  const filePath = path.join(LOG_DIR, `${category}.log`);
  const line = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}\n`;
  fs.appendFile(filePath, line, () => {});
}

/**
 * category: connection | disconnect | error | minecraft | discord | general
 */
async function log(level, category, message, meta = {}) {
  const entry = { timestamp: timestamp(), level, category, message, meta };

  if (LEVELS[level] <= currentLevel) {
    const prefix = `[${entry.timestamp}] [${category.toUpperCase()}]`;
    console.log(colorize(level, `${prefix} ${message}`));
  }

  writeToFile(category, entry);

  try {
    await logsDB.pushLimited(category, entry, 1000);
  } catch (err) {
    // لا نريد أن يعطل فشل تسجيل اللوق تشغيل البوت
    console.error('فشل حفظ اللوق في قاعدة البيانات:', err.message);
  }
}

module.exports = {
  error: (category, message, meta) => log('error', category, message, meta),
  warn: (category, message, meta) => log('warn', category, message, meta),
  info: (category, message, meta) => log('info', category, message, meta),
  debug: (category, message, meta) => log('debug', category, message, meta),
};

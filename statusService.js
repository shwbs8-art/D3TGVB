'use strict';

const { status } = require('minecraft-server-util');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * يفحص حالة سيرفر Minecraft بشكل مستقل عن اتصال البوت نفسه (Server List Ping)
 * يعيد null إذا كان السيرفر غير متاح
 */
async function getServerStatus() {
  try {
    const result = await status(config.minecraft.host, config.minecraft.port, {
      timeout: 5000,
      enableSRV: true,
    });

    return {
      online: true,
      playersOnline: result.players.online,
      playersMax: result.players.max,
      playerSample: (result.players.sample || []).map((p) => p.name),
      version: result.version?.name || 'غير معروف',
      motd: result.motd?.clean || '',
      ping: result.roundTripLatency,
    };
  } catch (err) {
    logger.debug('minecraft', `فشل فحص حالة السيرفر: ${err.message}`);
    return {
      online: false,
      playersOnline: 0,
      playersMax: 0,
      playerSample: [],
      version: 'غير معروف',
      motd: '',
      ping: null,
    };
  }
}

module.exports = { getServerStatus };

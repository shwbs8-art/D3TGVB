'use strict';

const botManager = require('../minecraft/BotManager');
const behaviors = require('../minecraft/behaviors');
const notifications = require('../handlers/notificationHandler');
const statsHandler = require('../handlers/statsHandler');
const { playersDB } = require('../database');
const logger = require('../utils/logger');

const DEATH_PATTERNS = [
  / was slain by /i,
  / was shot by /i,
  / was killed by /i,
  / died/i,
  / drowned/i,
  / blew up/i,
  / fell /i,
  / burned to death/i,
  / was burnt/i,
  / withered away/i,
  / starved to death/i,
  / suffocated/i,
];

let lastKnownServerUp = null;

function registerMinecraftEvents(discordClient) {
  botManager.attachBehaviors(behaviors);

  botManager.on('spawn', async () => {
    logger.info('minecraft', 'حدث Spawn: البوت جاهز داخل العالم');
    await notifications.botConnected(discordClient);
    await statsHandler.updateStatsMessage(discordClient);

    if (lastKnownServerUp === false) {
      await notifications.serverRestarted(discordClient);
    }
    lastKnownServerUp = true;
  });

  botManager.on('disconnected', async (reason) => {
    await notifications.botDisconnected(discordClient, reason);
    await statsHandler.updateStatsMessage(discordClient);
  });

  botManager.on('kicked', async (reason) => {
    await notifications.botDisconnected(discordClient, JSON.stringify(reason));
    await statsHandler.updateStatsMessage(discordClient);
  });

  botManager.on('reconnecting', async (attempt) => {
    await notifications.botReconnecting(discordClient, attempt);
  });

  botManager.on('error', async () => {
    await statsHandler.updateStatsMessage(discordClient);
  });

  botManager.on('playerJoined', async (player) => {
    await playersDB.update(player.username, (current) => ({
      ...(current || {}),
      username: player.username,
      lastJoin: new Date().toISOString(),
      status: 'online',
    }));
    await notifications.playerJoined(discordClient, player.username);
    await statsHandler.updateStatsMessage(discordClient);
  });

  botManager.on('playerLeft', async (player) => {
    await playersDB.update(player.username, (current) => ({
      ...(current || {}),
      username: player.username,
      lastLeave: new Date().toISOString(),
      status: 'offline',
    }));
    await notifications.playerLeft(discordClient, player.username);
    await statsHandler.updateStatsMessage(discordClient);
  });

  botManager.on('serverMessage', async (text) => {
    if (DEATH_PATTERNS.some((pattern) => pattern.test(text))) {
      const username = text.split(' ')[0];
      if (username) {
        await notifications.playerDeath(discordClient, username, null);
      }
    }
  });
}

module.exports = { registerMinecraftEvents };

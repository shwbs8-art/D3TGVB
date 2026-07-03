'use strict';

const { goals } = require('mineflayer-pathfinder');
const logger = require('../utils/logger');

let followInterval = null;

function getBot(botManager) {
  if (!botManager.isConnected || !botManager.bot) {
    throw new Error('البوت غير متصل بالسيرفر حاليًا.');
  }
  return botManager.bot;
}

function stopFollowing() {
  if (followInterval) {
    clearInterval(followInterval);
    followInterval = null;
  }
}

function followPlayer(botManager, username) {
  const bot = getBot(botManager);
  stopFollowing();

  const target = bot.players[username]?.entity;
  if (!target) {
    throw new Error(`اللاعب "${username}" غير موجود أو غير مرئي حاليًا.`);
  }

  const goal = new goals.GoalFollow(target, 2);
  bot.pathfinder.setGoal(goal, true);

  followInterval = setInterval(() => {
    const player = bot.players[username]?.entity;
    if (!player) {
      logger.warn('minecraft', `توقف الاتباع لأن اللاعب ${username} لم يعد مرئيًا`);
      stopFollowing();
      bot.pathfinder.setGoal(null);
    }
  }, 5000);

  logger.info('minecraft', `البوت بدأ يتبع اللاعب ${username}`);
}

function stopFollow(botManager) {
  const bot = getBot(botManager);
  stopFollowing();
  bot.pathfinder.setGoal(null);
  logger.info('minecraft', 'تم إيقاف الاتباع');
}

async function goTo(botManager, x, y, z) {
  const bot = getBot(botManager);
  stopFollowing();
  const goal = new goals.GoalBlock(Math.floor(x), Math.floor(y), Math.floor(z));

  return new Promise((resolve, reject) => {
    bot.pathfinder.setGoal(goal);

    const onGoalReached = () => {
      cleanup();
      resolve();
    };
    const onPathUpdate = (result) => {
      if (result.status === 'noPath') {
        cleanup();
        reject(new Error('تعذر إيجاد مسار إلى هذا الموقع.'));
      }
    };
    const cleanup = () => {
      bot.removeListener('goal_reached', onGoalReached);
      bot.removeListener('path_update', onPathUpdate);
    };

    bot.once('goal_reached', onGoalReached);
    bot.on('path_update', onPathUpdate);

    // مهلة أمان: 60 ثانية كحد أقصى
    setTimeout(() => {
      cleanup();
      resolve();
    }, 60000);
  });
}

function getCoordinates(botManager) {
  const bot = getBot(botManager);
  const pos = bot.entity.position;
  return {
    x: Math.floor(pos.x),
    y: Math.floor(pos.y),
    z: Math.floor(pos.z),
    dimension: bot.game?.dimension || 'unknown',
  };
}

function jump(botManager) {
  const bot = getBot(botManager);
  bot.setControlState('jump', true);
  setTimeout(() => {
    try {
      bot.setControlState('jump', false);
    } catch {
      // تجاهل إن انقطع الاتصال أثناء التنفيذ
    }
  }, 300);
}

async function sleepNow(botManager) {
  const bot = getBot(botManager);
  const bed = bot.findBlock({
    matching: (block) => block && block.name && block.name.includes('bed'),
    maxDistance: 16,
  });
  if (!bed) {
    throw new Error('لا يوجد سرير قريب من البوت.');
  }
  await bot.sleep(bed);
}

async function wakeUp(botManager) {
  const bot = getBot(botManager);
  if (!bot.isSleeping) {
    throw new Error('البوت ليس نائمًا حاليًا.');
  }
  await bot.wake();
}

function getPlayerList(botManager) {
  const bot = getBot(botManager);
  return Object.keys(bot.players).filter((name) => name !== bot.username);
}

/**
 * يسحب لاعبًا إلى موقع البوت (يتطلب أن يملك حساب البوت صلاحيات Operator/OP على السيرفر)
 */
function pullPlayer(botManager, username) {
  const bot = getBot(botManager);
  if (!bot.players[username]) {
    throw new Error(`اللاعب "${username}" غير موجود أو غير متصل حاليًا.`);
  }
  const command = `/tp ${username} ${bot.username}`;
  bot.chat(command);
  logger.info('minecraft', `تم إرسال أمر سحب اللاعب ${username} إلى موقع البوت`);
}

/**
 * يطرد لاعبًا من السيرفر (يتطلب صلاحيات Operator/OP لحساب البوت)
 */
function kickPlayer(botManager, username, reason) {
  const bot = getBot(botManager);
  const command = reason ? `/kick ${username} ${reason}` : `/kick ${username}`;
  bot.chat(command);
  logger.info('minecraft', `تم إرسال أمر طرد اللاعب ${username}${reason ? ` (السبب: ${reason})` : ''}`);
}

/**
 * يحظر لاعبًا من السيرفر (يتطلب صلاحيات Operator/OP لحساب البوت)
 */
function banPlayer(botManager, username, reason) {
  const bot = getBot(botManager);
  const command = reason ? `/ban ${username} ${reason}` : `/ban ${username}`;
  bot.chat(command);
  logger.info('minecraft', `تم إرسال أمر حظر اللاعب ${username}${reason ? ` (السبب: ${reason})` : ''}`);
}

/**
 * يتحكم بوقت السيرفر (نهار/ليل/ظهر/منتصف الليل) — يتطلب صلاحيات Operator/OP لحساب البوت
 */
const TIME_MAP = {
  day: { command: 'day', label: 'نهار ☀️' },
  night: { command: 'night', label: 'ليل 🌙' },
  noon: { command: 'noon', label: 'ظهر 🕛' },
  midnight: { command: 'midnight', label: 'منتصف الليل 🌑' },
};

function setTime(botManager, mode) {
  const bot = getBot(botManager);
  const entry = TIME_MAP[mode];
  if (!entry) throw new Error(`وضع وقت غير معروف: ${mode}`);
  bot.chat(`/time set ${entry.command}`);
  logger.info('minecraft', `تم تغيير وقت السيرفر إلى ${entry.label}`);
  return entry.label;
}

/**
 * يتحكم بالطقس (صافي/مطر/رعد) — يتطلب صلاحيات Operator/OP لحساب البوت
 */
const WEATHER_MAP = {
  clear: { command: 'clear', label: 'صافي ☀️' },
  rain: { command: 'rain', label: 'مطر 🌧️' },
  thunder: { command: 'thunder', label: 'عاصفة رعدية ⛈️' },
};

function setWeather(botManager, mode) {
  const bot = getBot(botManager);
  const entry = WEATHER_MAP[mode];
  if (!entry) throw new Error(`وضع طقس غير معروف: ${mode}`);
  bot.chat(`/weather ${entry.command}`);
  logger.info('minecraft', `تم تغيير طقس السيرفر إلى ${entry.label}`);
  return entry.label;
}

module.exports = {
  followPlayer,
  stopFollow,
  goTo,
  getCoordinates,
  jump,
  sleepNow,
  wakeUp,
  getPlayerList,
  pullPlayer,
  kickPlayer,
  banPlayer,
  setTime,
  setWeather,
};

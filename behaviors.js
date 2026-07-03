'use strict';

const logger = require('../utils/logger');
const { randomInt, randomChoice, sleep } = require('../utils/helpers');

/**
 * منظومة السلوك الطبيعي للبوت: تجعله يتصرف كأقرب ما يكون للاعب حقيقي.
 * جميع المؤقتات تُلغى بشكل نظيف عند فقد الاتصال (stop()).
 */
class Behaviors {
  constructor() {
    this.bot = null;
    this.timers = [];
    this.running = false;
  }

  start(bot) {
    this.bot = bot;
    this.running = true;

    this._scheduleLoop(() => this._lookAround(), 2500, 6000);
    this._scheduleLoop(() => this._maybeWander(), 6000, 16000);
    this._scheduleLoop(() => this._maybeJump(), 8000, 25000);
    this._scheduleLoop(() => this._maybeSwingArm(), 10000, 30000);
    this._scheduleLoop(() => this._maybeSneak(), 25000, 60000);
    this._scheduleLoop(() => this._checkHunger(), 10000, 10000);
    this._scheduleLoop(() => this._checkDayNightCycle(), 3000, 3000);
    this._scheduleLoop(() => this._avoidHazards(), 1500, 1500);
    this._scheduleLoop(() => this._openNearbyDoors(), 4000, 4000);

    logger.info('minecraft', 'تم تفعيل نظام السلوك الطبيعي (حركة/نظر/نوم/أكل)');
  }

  stop() {
    this.running = false;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.bot = null;
  }

  _scheduleLoop(fn, minMs, maxMs) {
    const run = async () => {
      if (!this.running) return;
      try {
        await fn();
      } catch (err) {
        logger.debug('minecraft', `تجاهل خطأ سلوكي بسيط: ${err.message}`);
      }
      if (!this.running) return;
      const next = randomInt(minMs, maxMs);
      const t = setTimeout(run, next);
      this.timers.push(t);
    };
    const initial = randomInt(1000, minMs);
    const t = setTimeout(run, initial);
    this.timers.push(t);
  }

  // ---------- النظر حول البوت / نحو أقرب لاعب ----------
  _lookAround() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;

    const nearestPlayer = this._findNearestPlayer(10);
    if (nearestPlayer && nearestPlayer.entity) {
      bot.lookAt(nearestPlayer.entity.position.offset(0, 1.6, 0), true);
      return;
    }

    const yaw = Math.random() * Math.PI * 2 - Math.PI;
    const pitch = (Math.random() - 0.5) * 0.6;
    bot.look(yaw, pitch, true);
  }

  _findNearestPlayer(maxDistance = 10) {
    const bot = this.bot;
    if (!bot) return null;
    let nearest = null;
    let nearestDist = Infinity;

    for (const username in bot.players) {
      if (username === bot.username) continue;
      const player = bot.players[username];
      if (!player.entity) continue;
      const dist = player.entity.position.distanceTo(bot.entity.position);
      if (dist < nearestDist && dist <= maxDistance) {
        nearest = player;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  // ---------- التجول العشوائي الخفيف ----------
  async _maybeWander() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    if (Math.random() > 0.8) return; // يتجول أغلب الأوقات، مثل لاعب حقيقي واقف يتحرك بخفة
    if (this._isSleeping()) return;

    const directions = ['forward', 'back', 'left', 'right'];
    const dir = randomChoice(directions);
    const control = this._directionToControl(dir);

    const shouldSprint = dir === 'forward' && Math.random() < 0.35;
    if (shouldSprint) bot.setControlState('sprint', true);

    bot.setControlState(control, true);
    await sleep(randomInt(500, 2200));
    bot.setControlState(control, false);
    if (shouldSprint) bot.setControlState('sprint', false);
  }

  // ---------- تلويح اليد بشكل عشوائي (يعطي إحساس أنه حي/نشِط) ----------
  _maybeSwingArm() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    if (this._isSleeping()) return;
    if (Math.random() > 0.5) return;
    try {
      bot.swingArm('right');
    } catch {
      // تجاهل إن انقطع الاتصال أثناء التنفيذ
    }
  }

  // ---------- الاختباء (Sneak) لفترة قصيرة، يحاكي حذر لاعب حقيقي ----------
  async _maybeSneak() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    if (this._isSleeping()) return;
    if (Math.random() > 0.4) return;

    bot.setControlState('sneak', true);
    await sleep(randomInt(1000, 3000));
    try {
      bot.setControlState('sneak', false);
    } catch {
      // تجاهل إن انقطع الاتصال أثناء التنفيذ
    }
  }

  _directionToControl(dir) {
    switch (dir) {
      case 'forward':
        return 'forward';
      case 'back':
        return 'back';
      case 'left':
        return 'left';
      default:
        return 'right';
    }
  }

  // ---------- القفز العشوائي ----------
  async _maybeJump() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    if (Math.random() > 0.55) return;
    if (this._isSleeping()) return;
    this.jumpOnce();
  }

  jumpOnce() {
    const bot = this.bot;
    if (!bot) return;
    bot.setControlState('jump', true);
    setTimeout(() => {
      try {
        bot.setControlState('jump', false);
      } catch {
        // البوت قد يكون فُصل بين الأمرين
      }
    }, 300);
  }

  // ---------- الأكل عند الجوع ----------
  async _checkHunger() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;
    if (bot.food === undefined || bot.food >= 18) return;

    const foodItem = bot.inventory
      .items()
      .find((item) => this._isEdible(item.name));

    if (!foodItem) return;

    try {
      await bot.equip(foodItem, 'hand');
      await bot.consume();
      logger.info('minecraft', `البوت أكل ${foodItem.name} لأن مستوى الجوع كان منخفضًا`);
    } catch (err) {
      logger.debug('minecraft', `تعذر الأكل الآن: ${err.message}`);
    }
  }

  _isEdible(name) {
    const edibles = [
      'bread', 'apple', 'baked_potato', 'cooked_beef', 'cooked_porkchop',
      'cooked_chicken', 'cooked_mutton', 'cooked_rabbit', 'cooked_cod',
      'cooked_salmon', 'carrot', 'melon_slice', 'golden_apple', 'beetroot',
      'potato', 'pumpkin_pie', 'cookie', 'mushroom_stew',
    ];
    return edibles.includes(name);
  }

  // ---------- النوم التلقائي ليلاً والاستيقاظ صباحًا ----------
  async _checkDayNightCycle() {
    const bot = this.bot;
    if (!bot || !bot.entity || !bot.time) return;

    const isNight = bot.time.timeOfDay >= 13000 && bot.time.timeOfDay <= 23000;

    if (isNight && !this._isSleeping()) {
      const bed = bot.findBlock({
        matching: (block) => block && block.name && block.name.includes('bed'),
        maxDistance: 16,
      });
      if (bed) {
        try {
          await bot.sleep(bed);
          logger.info('minecraft', 'حان الليل، البوت ذهب للنوم في أقرب سرير 🛏️');
        } catch (err) {
          logger.debug('minecraft', `تعذر النوم: ${err.message}`);
        }
      }
    } else if (!isNight && this._isSleeping()) {
      try {
        await bot.wake();
        logger.info('minecraft', 'أصبح الصباح، البوت استيقظ ☀️');
      } catch (err) {
        logger.debug('minecraft', `تعذر الاستيقاظ: ${err.message}`);
      }
    }
  }

  _isSleeping() {
    return !!(this.bot && this.bot.isSleeping);
  }

  // ---------- تجنب الحفر/الحمم (فحص بسيط قبل السير للأمام) ----------
  _avoidHazards() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;

    const pos = bot.entity.position;
    const below = bot.blockAt(pos.offset(0, -1, 0));
    const dangerNames = ['lava', 'fire', 'magma_block'];

    if (below && dangerNames.some((n) => below.name && below.name.includes(n))) {
      bot.setControlState('forward', false);
      bot.setControlState('back', false);
      this.jumpOnce();
      logger.warn('minecraft', 'تم اكتشاف خطر (حمم/نار) أسفل البوت، تم تجنبه');
    }
  }

  // ---------- فتح الأبواب القريبة عند الحاجة ----------
  async _openNearbyDoors() {
    const bot = this.bot;
    if (!bot || !bot.entity) return;

    const doorBlock = bot.findBlock({
      matching: (block) => block && block.name && block.name.includes('door'),
      maxDistance: 3,
    });

    if (doorBlock && doorBlock.getProperties && doorBlock.getProperties().open === false) {
      try {
        await bot.activateBlock(doorBlock);
        logger.debug('minecraft', 'تم فتح باب قريب');
      } catch {
        // ليس كل الأبواب قابلة للتفعيل بنفس الطريقة، نتجاهل بصمت
      }
    }
  }
}

module.exports = new Behaviors();

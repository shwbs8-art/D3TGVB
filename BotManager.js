'use strict';

const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const EventEmitter = require('events');
const config = require('../config');
const logger = require('../utils/logger');
const { sleep } = require('../utils/helpers');

/**
 * يدير دورة حياة بوت Mineflayer بالكامل:
 * الاتصال، إعادة الاتصال التلقائي، التسجيل، تسجيل الدخول، وتتبّع الحالة
 */
class BotManager extends EventEmitter {
  constructor() {
    super();
    this.bot = null;
    this.isConnected = false;
    this.isReconnecting = false;
    this.startTime = null;
    this.hasAuthenticated = false;
    this.reconnectAttempts = 0;
    this._manualStop = false;
    this._behaviors = null; // يُحقن لاحقًا من minecraft/behaviors.js لتفادي الاعتماد الدائري
  }

  attachBehaviors(behaviors) {
    this._behaviors = behaviors;
  }

  connect() {
    this._manualStop = false;
    logger.info('connection', `جارٍ الاتصال بالسيرفر ${config.minecraft.host}:${config.minecraft.port}...`);

    const options = {
      host: config.minecraft.host,
      port: config.minecraft.port,
      username: config.minecraft.username,
      version: config.minecraft.version || false,
      auth: config.minecraft.auth,
    };

    try {
      this.bot = mineflayer.createBot(options);
    } catch (err) {
      logger.error('error', `فشل إنشاء البوت: ${err.message}`);
      this._scheduleReconnect();
      return;
    }

    this.bot.loadPlugin(pathfinder);
    this._registerCoreEvents();
  }

  _registerCoreEvents() {
    const bot = this.bot;

    bot.once('spawn', async () => {
      this.isConnected = true;
      this.hasAuthenticated = false;
      this.startTime = Date.now();
      this.reconnectAttempts = 0;
      logger.info('connection', 'تم الاتصال بالسيرفر ودخول العالم بنجاح ✅');

      const defaultMove = new Movements(bot);
      bot.pathfinder.setMovements(defaultMove);

      await this._handleAuth();

      this.emit('spawn');
      if (this._behaviors) this._behaviors.start(bot);
    });

    bot.on('kicked', (reason) => {
      logger.warn('disconnect', `تم طرد البوت من السيرفر: ${this._stringifyReason(reason)}`);
      this.emit('kicked', reason);
    });

    bot.on('error', (err) => {
      logger.error('error', `خطأ في اتصال Minecraft: ${err.message}`);
      this.emit('error', err);
    });

    bot.on('end', (reason) => {
      const wasConnected = this.isConnected;
      this.isConnected = false;
      if (this._behaviors) this._behaviors.stop();

      if (wasConnected) {
        logger.warn('disconnect', `انقطع الاتصال بالسيرفر (${reason || 'غير معروف'})`);
        this.emit('disconnected', reason);
      }

      if (!this._manualStop) {
        this._scheduleReconnect();
      }
    });

    bot.on('death', () => {
      logger.info('minecraft', 'مات البوت داخل اللعبة، سيتم الإحياء تلقائيًا');
      setTimeout(() => {
        try {
          bot.respawn();
        } catch (err) {
          logger.error('error', `فشل إحياء البوت: ${err.message}`);
        }
      }, 1000);
    });

    bot.on('playerJoined', (player) => {
      if (player.username === bot.username) return;
      this.emit('playerJoined', player);
    });

    bot.on('playerLeft', (player) => {
      if (player.username === bot.username) return;
      this.emit('playerLeft', player);
    });

    bot.on('entityHurt', (entity) => {
      if (entity === bot.entity) {
        this.emit('botHurt');
      }
    });

    bot.on('message', (jsonMsg) => {
      // نستمع لرسائل السيرفر فقط لأغراض التسجيل/المصادقة، لا نكتب أبدًا في الشات
      const text = jsonMsg.toString();
      this._checkAuthMessages(text);
      this.emit('serverMessage', text);
    });
  }

  _stringifyReason(reason) {
    try {
      if (typeof reason === 'string') return reason;
      return JSON.stringify(reason);
    } catch {
      return String(reason);
    }
  }

  async _handleAuth() {
    if (!config.minecraft.autoRegister && !config.minecraft.autoLogin) return;
    if (!config.minecraft.password) {
      logger.warn('connection', 'لا توجد كلمة مرور معرّفة (MC_PASSWORD) لتسجيل الدخول التلقائي');
      return;
    }

    await sleep(1500);

    if (config.minecraft.autoRegister) {
      const cmd = config.minecraft.registerCommand.replace(/{password}/g, config.minecraft.password);
      this._sendAuthCommand(cmd, 'محاولة تسجيل حساب جديد (Register)');
      await sleep(1000);
    }

    if (config.minecraft.autoLogin) {
      const cmd = config.minecraft.loginCommand.replace(/{password}/g, config.minecraft.password);
      this._sendAuthCommand(cmd, 'محاولة تسجيل الدخول (Login)');
    }
  }

  _sendAuthCommand(command, description) {
    try {
      this.bot.chat(command);
      logger.info('connection', description);
    } catch (err) {
      logger.error('error', `فشل إرسال أمر المصادقة: ${err.message}`);
    }
  }

  _checkAuthMessages(text) {
    const successPatterns = [/successfully (logged|registered)/i, /تم تسجيل الدخول/, /logged in/i];
    if (successPatterns.some((p) => p.test(text))) {
      this.hasAuthenticated = true;
    }
  }

  _scheduleReconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    this.reconnectAttempts += 1;

    const delay = config.bot.reconnectDelaySeconds * 1000;
    logger.info(
      'connection',
      `سيتم إعادة الاتصال خلال ${config.bot.reconnectDelaySeconds} ثوانٍ (محاولة رقم ${this.reconnectAttempts})...`
    );

    setTimeout(() => {
      this.isReconnecting = false;
      this.emit('reconnecting', this.reconnectAttempts);
      this.connect();
    }, delay);
  }

  manualReconnect() {
    logger.info('connection', 'طلب إعادة اتصال يدوي...');
    this._manualStop = true;
    try {
      if (this.bot) this.bot.end('manual-reconnect');
    } catch {
      // تجاهل الخطأ إن كان البوت غير متصل أصلًا
    }
    this._manualStop = false;
    setTimeout(() => this.connect(), 1000);
  }

  getUptimeSeconds() {
    if (!this.startTime || !this.isConnected) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

module.exports = new BotManager();

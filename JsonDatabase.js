'use strict';

const fs = require('fs');
const path = require('path');

/**
 * قاعدة بيانات JSON بسيطة وآمنة (Thread-safe عبر قفل كتابة تسلسلي)
 * تُستخدم لتخزين: Config, Stats, Players, Logs, Message IDs
 */
class JsonDatabase {
  constructor(fileName) {
    this.filePath = path.join(__dirname, '..', 'storage', fileName);
    this._writeQueue = Promise.resolve();
    this._ensureFile();
  }

  _ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2), 'utf8');
    }
  }

  read() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      return raw.trim() ? JSON.parse(raw) : {};
    } catch (err) {
      // في حال تلف الملف نعيد كائن فارغ بدل تعطيل البوت بالكامل
      return {};
    }
  }

  _writeSync(data) {
    const tmpPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.filePath);
  }

  write(data) {
    // نضمن تسلسل الكتابة لتفادي تضارب الوصول المتزامن
    this._writeQueue = this._writeQueue.then(() => {
      this._writeSync(data);
    });
    return this._writeQueue;
  }

  get(key, defaultValue = undefined) {
    const data = this.read();
    return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : defaultValue;
  }

  async set(key, value) {
    const data = this.read();
    data[key] = value;
    await this.write(data);
    return value;
  }

  async update(key, updaterFn, defaultValue = {}) {
    const data = this.read();
    const current = Object.prototype.hasOwnProperty.call(data, key) ? data[key] : defaultValue;
    const updated = updaterFn(current);
    data[key] = updated;
    await this.write(data);
    return updated;
  }

  async delete(key) {
    const data = this.read();
    delete data[key];
    await this.write(data);
  }

  getAll() {
    return this.read();
  }

  async push(key, item) {
    const data = this.read();
    if (!Array.isArray(data[key])) data[key] = [];
    data[key].push(item);
    await this.write(data);
    return data[key];
  }

  async pushLimited(key, item, maxLength = 500) {
    const data = this.read();
    if (!Array.isArray(data[key])) data[key] = [];
    data[key].push(item);
    if (data[key].length > maxLength) {
      data[key] = data[key].slice(data[key].length - maxLength);
    }
    await this.write(data);
    return data[key];
  }
}

module.exports = JsonDatabase;

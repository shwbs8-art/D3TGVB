'use strict';

/**
 * ينسق مدة زمنية (بالثواني) إلى صيغة قابلة للقراءة: يوم / ساعة / دقيقة / ثانية
 */
function formatDuration(totalSeconds) {
  totalSeconds = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}ي`);
  if (hours) parts.push(`${hours}س`);
  if (minutes) parts.push(`${minutes}د`);
  if (!days && !hours) parts.push(`${seconds}ث`);

  return parts.join(' ') || '0ث';
}

/**
 * ينسق الوقت الحالي بتوقيت واضح للعرض في Discord
 */
function formatNow() {
  return new Date().toLocaleString('ar-IQ', {
    hour12: true,
    timeZone: 'Asia/Baghdad',
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * يحول ثواني إلى Discord timestamp ديناميكي <t:...:R>
 */
function discordRelativeTimestamp(date = new Date()) {
  return `<t:${Math.floor(date.getTime() / 1000)}:R>`;
}

module.exports = {
  formatDuration,
  formatNow,
  sleep,
  randomInt,
  randomChoice,
  discordRelativeTimestamp,
};

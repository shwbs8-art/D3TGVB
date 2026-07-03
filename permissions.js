'use strict';

const config = require('../config');

/**
 * يتحقق من صلاحية المستخدم لاستخدام أوامر/أزرار الإدارة الحساسة.
 * إن لم يتم تحديد DISCORD_ADMIN_ROLE_ID في الإعدادات، يُسمح للجميع (سلوك افتراضي آمن ومتوقع).
 */
function isAdmin(interaction) {
  if (!config.discord.adminRoleId) return true;
  return !!interaction.member?.roles?.cache?.has(config.discord.adminRoleId);
}

module.exports = { isAdmin };

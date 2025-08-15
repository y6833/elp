/**
 * 格式化工具函数
 */

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期
 * @param {string} format - 格式化模板
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化货币
 * @param {number} amount - 金额
 * @param {string} currency - 货币代码
 * @param {string} locale - 地区代码
 * @returns {string} 格式化后的货币字符串
 */
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  if (typeof amount !== 'number') {
    throw new Error('Amount must be a number');
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    // 降级处理
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 格式化数字
 * @param {number} num - 数字
 * @param {object} options - 格式化选项
 * @returns {string} 格式化后的数字
 */
export function formatNumber(num, options = {}) {
  const {
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    useGrouping = true
  } = options;
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping
  }).format(num);
}
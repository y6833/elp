/**
 * 工具函数模块 - 用于演示单元测试
 */

/**
 * 计算两个数的和
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
export function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('参数必须是数字');
  }
  return a + b;
}

/**
 * 计算两个数的乘积
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
export function multiply(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('参数必须是数字');
  }
  return a * b;
}

/**
 * 除法运算
 * @param {number} a 
 * @param {number} b 
 * @returns {number}
 */
export function divide(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('参数必须是数字');
  }
  if (b === 0) {
    throw new Error('除数不能为零');
  }
  return a / b;
}

/**
 * 检查是否为偶数
 * @param {number} num 
 * @returns {boolean}
 */
export function isEven(num) {
  if (typeof num !== 'number') {
    throw new Error('参数必须是数字');
  }
  return num % 2 === 0;
}

/**
 * 数组求和
 * @param {number[]} numbers 
 * @returns {number}
 */
export function sum(numbers) {
  if (!Array.isArray(numbers)) {
    throw new Error('参数必须是数组');
  }
  
  if (numbers.length === 0) {
    return 0;
  }
  
  return numbers.reduce((total, num) => {
    if (typeof num !== 'number') {
      throw new Error('数组元素必须是数字');
    }
    return total + num;
  }, 0);
}

/**
 * 获取数组中的最大值
 * @param {number[]} numbers 
 * @returns {number}
 */
export function max(numbers) {
  if (!Array.isArray(numbers)) {
    throw new Error('参数必须是数组');
  }
  
  if (numbers.length === 0) {
    throw new Error('数组不能为空');
  }
  
  return Math.max(...numbers);
}

/**
 * 格式化货币
 * @param {number} amount 
 * @param {string} currency 
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'USD') {
  if (typeof amount !== 'number') {
    throw new Error('金额必须是数字');
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  });
  
  return formatter.format(amount);
}

/**
 * 延迟执行函数
 * @param {number} ms 
 * @returns {Promise}
 */
export function delay(ms) {
  if (typeof ms !== 'number' || ms < 0) {
    throw new Error('延迟时间必须是非负数');
  }
  
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * 生成随机数
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function randomBetween(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number') {
    throw new Error('参数必须是数字');
  }
  
  if (min > max) {
    throw new Error('最小值不能大于最大值');
  }
  
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
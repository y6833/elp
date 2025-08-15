/**
 * 工具函数的单元测试
 */

import {
  add,
  multiply,
  divide,
  isEven,
  sum,
  max,
  formatCurrency,
  delay,
  randomBetween
} from '../utils.js';

describe('数学运算函数', () => {
  describe('add 函数', () => {
    test('应该正确计算两个正数的和', () => {
      expect(add(2, 3)).toBe(5);
      expect(add(10, 20)).toBe(30);
    });
    
    test('应该正确处理负数', () => {
      expect(add(-2, 3)).toBe(1);
      expect(add(-5, -3)).toBe(-8);
    });
    
    test('应该正确处理零', () => {
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
      expect(add(0, 0)).toBe(0);
    });
    
    test('应该正确处理小数', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
      expect(add(1.5, 2.5)).toBe(4);
    });
    
    test('参数不是数字时应该抛出错误', () => {
      expect(() => add('2', 3)).toThrow('参数必须是数字');
      expect(() => add(2, '3')).toThrow('参数必须是数字');
      expect(() => add(null, 3)).toThrow('参数必须是数字');
      expect(() => add(undefined, 3)).toThrow('参数必须是数字');
    });
  });
  
  describe('multiply 函数', () => {
    test('应该正确计算两个数的乘积', () => {
      expect(multiply(3, 4)).toBe(12);
      expect(multiply(-2, 5)).toBe(-10);
      expect(multiply(-3, -4)).toBe(12);
    });
    
    test('乘以零应该返回零', () => {
      expect(multiply(5, 0)).toBe(0);
      expect(multiply(0, 5)).toBe(0);
    });
    
    test('参数不是数字时应该抛出错误', () => {
      expect(() => multiply('2', 3)).toThrow('参数必须是数字');
    });
  });
  
  describe('divide 函数', () => {
    test('应该正确计算除法', () => {
      expect(divide(10, 2)).toBe(5);
      expect(divide(15, 3)).toBe(5);
      expect(divide(-10, 2)).toBe(-5);
    });
    
    test('除以零应该抛出错误', () => {
      expect(() => divide(10, 0)).toThrow('除数不能为零');
    });
    
    test('参数不是数字时应该抛出错误', () => {
      expect(() => divide('10', 2)).toThrow('参数必须是数字');
    });
  });
  
  describe('isEven 函数', () => {
    test('应该正确判断偶数', () => {
      expect(isEven(2)).toBe(true);
      expect(isEven(4)).toBe(true);
      expect(isEven(0)).toBe(true);
      expect(isEven(-2)).toBe(true);
    });
    
    test('应该正确判断奇数', () => {
      expect(isEven(1)).toBe(false);
      expect(isEven(3)).toBe(false);
      expect(isEven(-1)).toBe(false);
    });
    
    test('参数不是数字时应该抛出错误', () => {
      expect(() => isEven('2')).toThrow('参数必须是数字');
    });
  });
});

describe('数组操作函数', () => {
  describe('sum 函数', () => {
    test('应该正确计算数组元素的和', () => {
      expect(sum([1, 2, 3, 4])).toBe(10);
      expect(sum([10, -5, 3])).toBe(8);
    });
    
    test('空数组应该返回 0', () => {
      expect(sum([])).toBe(0);
    });
    
    test('单元素数组应该返回该元素', () => {
      expect(sum([5])).toBe(5);
    });
    
    test('参数不是数组时应该抛出错误', () => {
      expect(() => sum('not array')).toThrow('参数必须是数组');
      expect(() => sum(123)).toThrow('参数必须是数组');
    });
    
    test('数组包含非数字元素时应该抛出错误', () => {
      expect(() => sum([1, '2', 3])).toThrow('数组元素必须是数字');
      expect(() => sum([1, null, 3])).toThrow('数组元素必须是数字');
    });
  });
  
  describe('max 函数', () => {
    test('应该返回数组中的最大值', () => {
      expect(max([1, 5, 3, 2])).toBe(5);
      expect(max([-1, -5, -3])).toBe(-1);
      expect(max([10])).toBe(10);
    });
    
    test('空数组应该抛出错误', () => {
      expect(() => max([])).toThrow('数组不能为空');
    });
    
    test('参数不是数组时应该抛出错误', () => {
      expect(() => max('not array')).toThrow('参数必须是数组');
    });
  });
});

describe('格式化函数', () => {
  describe('formatCurrency 函数', () => {
    test('应该正确格式化美元', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });
    
    test('应该支持不同货币', () => {
      expect(formatCurrency(100, 'EUR')).toMatch(/€100.00|100.00\s*€/);
    });
    
    test('参数不是数字时应该抛出错误', () => {
      expect(() => formatCurrency('100')).toThrow('金额必须是数字');
    });
  });
});

describe('异步函数', () => {
  describe('delay 函数', () => {
    test('应该在指定时间后 resolve', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // 允许一些误差
    });
    
    test('延迟时间为 0 应该立即 resolve', async () => {
      const start = Date.now();
      await delay(0);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(50);
    });
    
    test('参数不是数字时应该抛出错误', () => {
      expect(() => delay('100')).toThrow('延迟时间必须是非负数');
    });
    
    test('负数延迟时间应该抛出错误', () => {
      expect(() => delay(-100)).toThrow('延迟时间必须是非负数');
    });
  });
});

describe('随机函数', () => {
  describe('randomBetween 函数', () => {
    test('应该返回指定范围内的数字', () => {
      const result = randomBetween(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);
    });
    
    test('最小值等于最大值时应该返回该值', () => {
      expect(randomBetween(5, 5)).toBe(5);
    });
    
    test('最小值大于最大值时应该抛出错误', () => {
      expect(() => randomBetween(10, 5)).toThrow('最小值不能大于最大值');
    });
    
    test('参数不是数字时应该抛出错误', () => {
      expect(() => randomBetween('1', 10)).toThrow('参数必须是数字');
      expect(() => randomBetween(1, '10')).toThrow('参数必须是数字');
    });
    
    // 测试随机性 (运行多次确保在范围内)
    test('多次调用应该产生不同的结果', () => {
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        results.add(randomBetween(1, 100));
      }
      
      // 20次调用应该至少产生几个不同的值
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
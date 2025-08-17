export const utils = {
  calculate(a, b) {
    if (b === 0) {
      throw new Error('除数不能为零');
    }
    return a / b;
  },
  
  formatNumber(num) {
    return num.toLocaleString();
  },
  
  // 故意的错误函数
  buggyFunction() {
    const obj = null;
    return obj.property; // 这会抛出错误
  }
};
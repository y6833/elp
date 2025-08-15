import { Calculator } from './utils';

const calc = new Calculator();

console.log('ESBuild TypeScript 构建测试');
console.log('10 + 5 =', calc.add(10, 5));
console.log('10 - 5 =', calc.subtract(10, 5));
console.log('10 * 5 =', calc.multiply(10, 5));
console.log('10 / 5 =', calc.divide(10, 5));
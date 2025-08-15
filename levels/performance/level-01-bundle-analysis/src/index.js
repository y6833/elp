import _ from 'lodash';
import moment from 'moment';
import { Chart } from 'chart.js';

console.log('Bundle 分析示例应用');

// 使用 lodash
const numbers = [1, 2, 3, 4, 5];
const doubled = _.map(numbers, n => n * 2);
console.log('Doubled numbers:', doubled);

// 使用 moment
const now = moment();
console.log('Current time:', now.format('YYYY-MM-DD HH:mm:ss'));

// 使用 Chart.js
const ctx = document.getElementById('myChart');
if (ctx) {
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
      datasets: [{
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        borderWidth: 1
      }]
    }
  });
}

// 动态导入示例
document.getElementById('loadModule')?.addEventListener('click', async () => {
  const { heavyModule } = await import('./heavy-module.js');
  heavyModule();
});
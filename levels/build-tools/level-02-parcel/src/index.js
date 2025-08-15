import './style.css';

console.log('Parcel 应用启动成功！');

const app = document.getElementById('app');
const button = document.createElement('button');
button.textContent = '点击测试';
button.addEventListener('click', () => {
    alert('Parcel 热更新工作正常！');
});

app.appendChild(button);
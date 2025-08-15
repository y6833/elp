import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  React.createElement(App, { title: 'SWC + React 应用' })
);

console.log('SWC 编译的应用启动成功！');
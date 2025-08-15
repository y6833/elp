import React from 'react';

const LazyComponent = () => {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h2>懒加载组件</h2>
      <p>这个组件是通过懒加载方式加载的！</p>
      <p>只有在需要时才会下载和执行。</p>
    </div>
  );
};

export default LazyComponent;
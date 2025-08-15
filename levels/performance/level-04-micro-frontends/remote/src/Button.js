import React from 'react';

const RemoteButton = () => {
  const handleClick = () => {
    alert('这是来自远程应用的按钮！');
  };

  return (
    <div style={{ 
      padding: '15px', 
      backgroundColor: '#e3f2fd', 
      border: '2px solid #2196f3',
      borderRadius: '8px',
      margin: '10px 0'
    }}>
      <h3 style={{ color: '#1976d2', margin: '0 0 10px 0' }}>
        远程组件
      </h3>
      <p style={{ margin: '0 0 10px 0', color: '#666' }}>
        这个组件来自远程应用 (端口 3002)
      </p>
      <button 
        onClick={handleClick}
        style={{
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        远程按钮
      </button>
    </div>
  );
};

export default RemoteButton;
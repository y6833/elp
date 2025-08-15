import React, { useEffect, useRef } from 'react';

const HeavyChart = () => {
  const chartRef = useRef(null);

  useEffect(() => {
    // 模拟重型图表库的加载和初始化
    const loadChart = async () => {
      // 这里可以动态导入图表库
      // const Chart = await import('chart.js');
      
      console.log('初始化图表...');
      
      // 模拟图表渲染
      if (chartRef.current) {
        chartRef.current.innerHTML = `
          <div style="width: 400px; height: 300px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); 
                      display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">
            模拟图表组件<br/>
            (实际项目中这里会是真实的图表)
          </div>
        `;
      }
    };

    loadChart();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '10px' }}>
      <h3>重型图表组件</h3>
      <div ref={chartRef}></div>
      <p>这个组件包含大量的图表库代码，通过懒加载优化性能。</p>
    </div>
  );
};

export default HeavyChart;
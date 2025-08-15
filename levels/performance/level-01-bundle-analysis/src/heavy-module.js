// 模拟一个大型模块
export function heavyModule() {
  console.log('Heavy module loaded!');
  
  // 模拟大量计算
  const data = new Array(10000).fill(0).map((_, i) => ({
    id: i,
    value: Math.random() * 1000,
    timestamp: Date.now()
  }));
  
  console.log('Processed', data.length, 'items');
  return data;
}
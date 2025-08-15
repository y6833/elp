import React, { useState } from 'react';

interface Props {
  title: string;
}

const App: React.FC<Props> = ({ title }) => {
  const [count, setCount] = useState<number>(0);

  const increment = (): void => {
    setCount(prev => prev + 1);
  };

  return (
    <div>
      <h1>{title}</h1>
      <p>计数器: {count}</p>
      <button onClick={increment}>增加</button>
    </div>
  );
};

export default App;
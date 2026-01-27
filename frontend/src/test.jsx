import React from 'react';

const Test = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: 'blue' }}>Test Page - If you see this, React is working!</h1>
      <p style={{ color: 'black' }}>Current time: {new Date().toLocaleString()}</p>
      <button onClick={() => alert('Button works!')}>Test Button</button>
    </div>
  );
};

export default Test;

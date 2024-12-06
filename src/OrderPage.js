import React, { useState, useEffect } from 'react';

// The functional component
const OrderPage = (props) => {
  // Local state using useState
  const [stateValue, setStateValue] = useState('Initial Value');

  // useEffect hook for side effects (e.g., fetching data)
  useEffect(() => {
    // Example: fetching data or performing setup
    console.log('Component mounted or stateValue changed');
    
    // Cleanup function (optional)
    return () => {
      console.log('Cleanup before component unmounts');
    };
  }, [stateValue]); // Dependency array (runs when stateValue changes)

  // Event handler example
  const handleClick = () => {
    setStateValue('New Value');
  };

  return (
    <div className="my-component">
      <h1>My React Component</h1>
      <p>Current State Value: {stateValue}</p>

      <button onClick={handleClick}>Change Value</button>

      {/* You can pass props to child components */}
      <ChildComponent someProp="Hello from parent!" />
    </div>
  );
};

// Example of a child component
const ChildComponent = ({ someProp }) => {
  return <p>{someProp}</p>;
};

export default OrderPage;

import React from 'react';

interface BaselineRouteProps {
  children: JSX.Element;
}


const BaselineRoute: React.FC<BaselineRouteProps> = ({ children }) => {
  return children;
};

export default BaselineRoute;
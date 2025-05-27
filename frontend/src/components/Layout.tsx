import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

const Layout: React.FC = () => {
  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-4 md:px-5 md:py-5">
        <Outlet />
      </div>
    </>
  );
};

export default Layout; 
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Navigation from './Navigation';

const Layout: React.FC = () => {
  return (
    <>
      <Navigation />
      <Container fluid className="dashboard-container">
        <Outlet />
      </Container>
    </>
  );
};

export default Layout; 
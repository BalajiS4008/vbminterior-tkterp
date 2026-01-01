import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileBottomNavigation from './BottomNavigation';

const BOTTOM_NAV_HEIGHT = 64;

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100%',
          backgroundColor: theme.palette.background.default,
          pb: { xs: `${BOTTOM_NAV_HEIGHT + 16}px`, md: 0 },
        }}
      >
        {/* Header */}
        <Header onMenuClick={handleToggleSidebar} />

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2, md: 3 },
            overflow: 'auto',
            width: '100%',
            maxWidth: '100%',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNavigation />}
    </Box>
  );
};

export default MainLayout;

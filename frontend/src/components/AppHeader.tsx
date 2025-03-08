import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useTheme,
  useMediaQuery,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Message as MessageIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const menuItems = [
  { path: '/batches', label: 'Batches', icon: <MessageIcon /> },
  { path: '/templates', label: 'Templates', icon: <DescriptionIcon /> },
  { path: '/customers', label: 'Customers', icon: <PeopleIcon /> },
  { path: '/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
];

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const currentTab = menuItems.findIndex(item => 
    location.pathname.startsWith(item.path)
  );

  return (
    <AppBar position="sticky">
      <Toolbar>
        {isMobile ? (
          <>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              SMS Management
            </Typography>
            <IconButton
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
              edge="end"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              {menuItems.map(({ path, label, icon }) => (
                <MenuItem
                  key={path}
                  onClick={() => handleNavigation(path)}
                  selected={location.pathname.startsWith(path)}
                >
                  <Box component="span" sx={{ mr: 2 }}>
                    {icon}
                  </Box>
                  {label}
                </MenuItem>
              ))}
            </Menu>
          </>
        ) : (
          <>
            <Typography variant="h6" component="div" sx={{ mr: 4 }}>
              SMS Management
            </Typography>
            <Tabs
              value={currentTab !== -1 ? currentTab : 0}
              textColor="inherit"
              indicatorColor="secondary"
              sx={{ flexGrow: 1 }}
            >
              {menuItems.map(({ path, label }) => (
                <Tab
                  key={path}
                  label={label}
                  onClick={() => navigate(path)}
                />
              ))}
            </Tabs>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

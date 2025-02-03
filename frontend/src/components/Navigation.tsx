import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Toolbar,
} from '@mui/material';
import {
  Message as MessageIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

const menuItems = [
  { path: '/batches', label: 'Batches', icon: <MessageIcon /> },
  { path: '/templates', label: 'Templates', icon: <DescriptionIcon /> },
  { path: '/customers', label: 'Customers', icon: <PeopleIcon /> },
  { path: '/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
];

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <List>
        {menuItems.map(({ path, label, icon }) => (
          <ListItem key={path} disablePadding>
            <ListItemButton
              selected={location.pathname.startsWith(path)}
              onClick={() => navigate(path)}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

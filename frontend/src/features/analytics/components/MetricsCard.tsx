import React from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Tooltip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { alpha } from '@mui/material/styles';

interface MetricsCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  loading?: boolean;
  tooltip?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  unit,
  trend,
  loading = false,
  tooltip,
  color = 'primary'
}) => {
  const renderTrend = () => {
    if (typeof trend === 'undefined') return null;

    const isPositive = trend >= 0;
    const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
    const trendColor = isPositive ? 'success.main' : 'error.main';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', color: trendColor }}>
        <Icon fontSize="small" />
        <Typography variant="body2" sx={{ ml: 0.5 }}>
          {Math.abs(trend)}%
        </Typography>
      </Box>
    );
  };

  const cardContent = (
    <CardContent>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Typography variant="h4" component="div" color={`${color}.main`} sx={{ mb: 1 }}>
            {value}
            {unit && (
              <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 0.5 }}>
                {unit}
              </Typography>
            )}
          </Typography>
          {renderTrend()}
        </>
      )}
    </CardContent>
  );

  return (
    <Card
      sx={{
        height: '100%',
        backgroundColor: (theme) => alpha(theme.palette[color].main, 0.05),
        '&:hover': {
          backgroundColor: (theme) => alpha(theme.palette[color].main, 0.08),
        },
      }}
    >
      {tooltip ? (
        <Tooltip title={tooltip} arrow placement="top">
          {cardContent}
        </Tooltip>
      ) : (
        cardContent
      )}
    </Card>
  );
};

export default MetricsCard;

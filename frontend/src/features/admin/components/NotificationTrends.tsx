import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { useNotificationTrends } from '../hooks/useNotificationTrends';
import { BatchAlert } from '@/types/alerts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface NotificationTrendsProps {
  notifications: BatchAlert[];
}

export default function NotificationTrends({ notifications }: NotificationTrendsProps) {
  const { dailyTrends, topChannels, averageReadTime, peakNotificationDay } = useNotificationTrends(notifications);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notification Trends
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Read Time
              </Typography>
              <Typography variant="h4">
                {formatDuration(averageReadTime)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Peak Day
              </Typography>
              <Typography variant="h4">
                {peakNotificationDay.count}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {new Date(peakNotificationDay.date).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Trends Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Daily Volume
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <RechartsTooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#ff1744"
                  name="Errors"
                />
                <Line
                  type="monotone"
                  dataKey="warnings"
                  stroke="#ffa000"
                  name="Warnings"
                />
                <Line
                  type="monotone"
                  dataKey="readRate"
                  stroke="#00c853"
                  name="Read Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Channel Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Channel Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topChannels}
                  dataKey="count"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={(entry) => `${entry.channel}: ${entry.count}`}
                >
                  {topChannels.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Read Rate Trends */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" gutterBottom>
              Read Rate Trends
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="readRate"
                  stroke="#00c853"
                  name="Read Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

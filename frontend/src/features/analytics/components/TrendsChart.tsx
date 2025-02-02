import React from 'react';
import { Card, CardContent, CardHeader, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendData } from '../types';

interface TrendsChartProps {
  title: string;
  data: TrendData[];
  dataKey: string;
  color?: string;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
}

const TrendsChart: React.FC<TrendsChartProps> = ({
  title,
  data,
  dataKey,
  color = '#2196f3',
  valueFormatter = (value) => value.toString(),
  loading = false
}) => {
  // Format timestamp for x-axis
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric'
    });
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 1.5, backgroundColor: 'background.paper' }}>
          <Box sx={{ mb: 1 }}>
            {formatXAxis(label)}
          </Box>
          {payload.map((entry: any) => (
            <Box
              key={entry.dataKey}
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: entry.color
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: entry.color,
                  mr: 1
                }}
              />
              {valueFormatter(entry.value)}
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <Card sx={{ height: '100%', minHeight: 400 }}>
      <CardHeader title={title} />
      <CardContent sx={{ height: 'calc(100% - 72px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
            />
            <YAxis tickFormatter={valueFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              isAnimationActive={!loading}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TrendsChart;

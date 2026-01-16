import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type TrafficData = {
  metrics: Array<{
    date: string;
    sessions: number;
    users: number;
    pageviews: number;
  }>;
  totals: {
    totalSessions: number;
    totalUsers: number;
    totalPageviews: number;
  };
};

type GATrafficChartProps = {
  data: TrafficData;
};

/**
 * Traffic chart for Google Analytics data
 */
export const GATrafficChart: React.FC<GATrafficChartProps> = ({ data }) => {
  const chartData = data.metrics.map((metric) => ({
    ...metric,
    // Format date for display
    dateDisplay: new Date(metric.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="dateDisplay"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            tickFormatter={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="sessions"
            name="Sessions"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="users"
            name="Users"
            stroke="hsl(220 70% 50%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="pageviews"
            name="Pageviews"
            stroke="hsl(142 70% 45%)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

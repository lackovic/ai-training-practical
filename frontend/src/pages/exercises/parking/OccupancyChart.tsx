import React, { useState, useEffect, useCallback } from 'react';
import { Card, Spinner, Alert } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import usePalette from '../../../hooks/usePalette';
import { fetchApi } from '../../../utils/apiClient';

interface OccupancyPoint {
  time: string;
  occupied: number;
}

interface OccupancyData {
  points: OccupancyPoint[];
  total: number;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const OccupancyChart = () => {
  const [data, setData] = useState<OccupancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const palette = usePalette();

  const load = useCallback(() => {
    fetchApi<OccupancyData>('/parking/occupancy')
      .then((d) => setData(d ?? null))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const chartData = {
    labels: data?.points.map((p) => formatTime(p.time)) ?? [],
    datasets: [
      {
        label: 'Occupied bays',
        data: data?.points.map((p) => p.occupied) ?? [],
        borderColor: palette.danger,
        backgroundColor: palette.danger + '22',
        fill: true,
        tension: 0,
        stepped: true,
        pointRadius: data && data.points.length <= 40 ? 4 : 0,
        pointHoverRadius: 5,
      },
      {
        label: 'Total bays',
        data: data?.points.map(() => data.total) ?? [],
        borderColor: palette['gray-400'],
        borderDash: [6, 3],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) =>
            ctx.datasetIndex === 0
              ? `Occupied: ${ctx.parsed.y} / ${data?.total}`
              : `Total: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: data ? data.total + 1 : undefined,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        grid: { color: 'transparent' },
      },
    },
  };

  return (
    <Card className="mt-4">
      <Card.Header>
        <Card.Title className="mb-0">Occupancy Over Time</Card.Title>
        <h6 className="card-subtitle text-muted">Bays booked and released today</h6>
      </Card.Header>
      <Card.Body>
        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && (!data || data.points.length === 0) && (
          <p className="text-muted text-center py-4 mb-0">
            No events recorded yet — book or release a bay to see the chart.
          </p>
        )}
        {!loading && !error && data && data.points.length > 0 && (
          <div style={{ height: 260 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default OccupancyChart;

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import usePalette from '../../../hooks/usePalette';
import { fetchApi } from '../../../utils/apiClient';

interface MonthlyAnalytics {
  id: number;
  month: number;
  year: number;
  sessionDuration: number;
  pageViews: number;
  totalVisits: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AnalyticsChartExercise = () => {
  const [analyticsData, setAnalyticsData] = useState<MonthlyAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const palette = usePalette();

  useEffect(() => {
    fetchApi<MonthlyAnalytics[]>('/analytics/monthly')
      .then((data) => setAnalyticsData(data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const labels = analyticsData.map(
    (d) => `${MONTH_NAMES[d.month - 1]} ${d.year}`
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Page Views',
        data: analyticsData.map((d) => d.pageViews),
        borderColor: palette.success,
        backgroundColor: palette.success + '33',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: 'Total Visits',
        data: analyticsData.map((d) => d.totalVisits),
        borderColor: palette.warning,
        backgroundColor: palette.warning + '33',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: {
        grid: { color: 'transparent' },
      },
    },
  };

  return (
    <React.Fragment>
      <Helmet title="Analytics Chart" />
      <Container fluid className="p-0">
        <h1 className="h3 mb-3">Analytics Chart</h1>

        <Row>
          <Col>
            <Card>
              <Card.Header>
                <Card.Title>Monthly Analytics Chart</Card.Title>
                <h6 className="card-subtitle text-muted">Display the fetched monthly analytics data here.</h6>
              </Card.Header>
              <Card.Body>
                {loading && (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status" />
                  </div>
                )}
                {error && <Alert variant="danger">{error}</Alert>}
                {!loading && !error && (
                  <div style={{ height: 360 }}>
                    <Line data={chartData} options={chartOptions} />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </React.Fragment>
  );
};

export default AnalyticsChartExercise;

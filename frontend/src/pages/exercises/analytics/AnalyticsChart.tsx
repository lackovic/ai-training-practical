import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { Copy, Sparkles } from 'lucide-react';
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

const promptBlockStyle: React.CSSProperties = {
  background: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '6px',
  padding: '10px 14px',
  fontSize: '0.9rem',
  lineHeight: '1.5',
  cursor: 'pointer',
};

const RevealablePrompt = ({ children }: { children: string }) => {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!revealed) {
    return (
      <a href="#" className="small" onClick={(e) => { e.preventDefault(); setRevealed(true); }}>
        <Sparkles size={14} className="me-1" />show me an example prompt
      </a>
    );
  }

  return (
    <div style={promptBlockStyle} onClick={handleCopy} title="Click to copy" className="mt-1">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <span>{children}</span>
        <span className="text-muted flex-shrink-0" style={{ fontSize: '0.75rem' }}>
          {copied ? 'Copied!' : <Copy size={14} />}
        </span>
      </div>
    </div>
  );
};

const AnalyticsChartExercise = () => {
  const [showIntroAlert, setShowIntroAlert] = useState(true);
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
      <Helmet title="Analytics Chart Exercise" />
      <Container fluid className="p-0">
        <h1 className="h3 mb-3">Analytics Chart Exercise</h1>

        {showIntroAlert && (
          <Card className="mb-4 border-primary">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-2">Analytics Chart Exercise</h5>
                  <p className="mb-2">
                    Your goal is to display the company's monthly website analytics data as a chart
                    on this page. The data already exists in the backend — you need to find it and
                    visualise it.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowIntroAlert(false)}
                />
              </div>

              <div className="rounded p-3 mb-3" style={{ background: '#d1e7dd' }}>
                <strong>How it works:</strong> Try each task yourself first by describing what you
                want to Claude. If you get stuck, click "show me an example prompt" for a
                ready-made prompt you can copy and paste. After each task, refresh this page to
                see your changes.
              </div>

              <div className="rounded p-3 mb-3" style={{ background: '#cfe2ff' }}>
                <strong>What you'll learn:</strong> AI isn't just a code generator — it's an
                explorer. You can point it at an unfamiliar codebase and ask "what's here?" before
                deciding what to build. It can also choose and integrate tools (like charting
                libraries) on your behalf — you describe the result, it makes the technical decisions.
              </div>

              <h6 className="mb-3">Tasks</h6>

              <div className="mb-3">
                <div className="fw-semibold mb-1">1. Find the Data</div>
                <div className="mb-1">There is an API endpoint somewhere in the backend that serves monthly analytics data. Ask your AI assistant to find it and tell you what data is available.</div>
                <RevealablePrompt>Search through this project's backend code and find the API endpoint that serves monthly analytics data. Tell me what the endpoint is and what fields the data contains.</RevealablePrompt>
              </div>

              <div className="mb-0">
                <div className="fw-semibold mb-1">2. Build the Chart</div>
                <div className="mb-1">Once you know where the data is, display it as a chart on this page. You can choose which metrics to display (e.g. page views and total visits over time).</div>
                <RevealablePrompt>On the analytics chart page, replace the placeholder with a chart that fetches the monthly analytics data and displays page views and total visits over time. Pick a suitable charting library and make it look good.</RevealablePrompt>
              </div>

              <p className="text-muted mt-3 mb-0" style={{ fontSize: '0.85rem' }}>
                <strong>Tip:</strong> The first task is deliberately vague — part of the exercise is
                seeing how Claude can explore the codebase to find things for you.
              </p>
            </Card.Body>
          </Card>
        )}

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

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { Copy, Sparkles } from 'lucide-react';
import { fetchApi } from '../../../utils/apiClient';

interface ParkingZone {
  id: number;
  name: string;
  description?: string;
  totalBays: number;
  availableBays: number;
  occupiedBays: number;
}

function getAvailabilityVariant(availableBays: number, totalBays: number): string {
  if (totalBays === 0) return 'secondary';
  const ratio = availableBays / totalBays;
  if (ratio > 0.6) return 'success';
  if (ratio >= 0.3) return 'warning';
  return 'danger';
}

function getAvailabilityLabel(availableBays: number, totalBays: number): string {
  if (totalBays === 0) return 'No bays';
  const ratio = availableBays / totalBays;
  if (ratio > 0.6) return 'Mostly free';
  if (ratio >= 0.3) return 'Filling up';
  return 'Nearly full';
}

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

const ParkingAvailability = () => {
  const [showIntroAlert, setShowIntroAlert] = useState(true);
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<ParkingZone[]>('/parking/zones')
      .then((data) => setZones(data ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <React.Fragment>
      <Helmet title="Car Park Availability Exercise" />
      <Container fluid className="p-0">
        <h1 className="h3 mb-3">Car Park Availability Exercise</h1>

        {showIntroAlert && (
          <Card className="mb-4 border-primary">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-2">Welcome to the Car Park Availability Exercise!</h5>
                  <p className="mb-2">
                    You are going to build a complete car park availability system from scratch —
                    database, API, and user interface. There is <strong>nothing set up yet</strong>.
                    Claude will build everything for you.
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
                ready-made prompt you can copy and paste. After tasks 3 and 4, refresh this page
                to see your changes.
              </div>

              <div className="rounded p-3 mb-3" style={{ background: '#cfe2ff' }}>
                <strong>What you'll learn:</strong> You can build a complete feature from scratch —
                database, API, and user interface — just by describing what you want the system to
                do. The AI designs the data model, follows the project's existing conventions, and
                creates the UI from your description. You don't need to know the technology.
              </div>

              <h6 className="mb-3">Tasks</h6>

              <div className="mb-3">
                <div className="fw-semibold mb-1">1. Database Model</div>
                <div className="mb-1">Design and create the database for parking zones and bays. Each bay belongs to a zone and has a status (available or occupied). Seed it with sample data (e.g. 3 zones with 10 bays each).</div>
                <RevealablePrompt>Look at the existing database models in this project for reference. Set up a database for a car park with parking zones (each with a name) and parking bays (each belonging to a zone, with a bay number and a status of available or occupied). Seed it with 3 zones with about 10 bays each, all starting as available.</RevealablePrompt>
              </div>

              <div className="mb-3">
                <div className="fw-semibold mb-1">2. Backend API</div>
                <div className="mb-1">Create API endpoints to retrieve all zones with their availability, retrieve bays for a specific zone, book a bay, and release a bay.</div>
                <RevealablePrompt>Look at how the existing task API is structured and follow the same patterns. Create API endpoints for the car park so I can: get all zones with how many bays are available; get the bays for a specific zone; book a bay; and release a bay.</RevealablePrompt>
              </div>

              <div className="mb-3">
                <div className="fw-semibold mb-1">3. Availability Dashboard</div>
                <div className="mb-1">Build the frontend UI on this page. Display each zone as a card showing the zone name, total bays, and how many are available. Use colour coding to indicate availability (e.g. green for mostly free, amber for filling up, red for nearly full).</div>
                <RevealablePrompt>On the car park page, replace the placeholder card with a dashboard that shows each zone as a card. Each card should display the zone name, how many bays are free, and be colour-coded — green when mostly free, amber when filling up, red when nearly full.</RevealablePrompt>
              </div>

              <div className="mb-3">
                <div className="fw-semibold mb-1">4. Bay Management</div>
                <div className="mb-1">Allow users to click into a zone to see individual bays. Each bay should show its status and have a button to book or release it.</div>
                <RevealablePrompt>When I click on a zone card, replace the zone overview with a view of the individual bays. Each bay should show whether it's free or taken and have a button to book or release it. Add a way to go back to the zone overview.</RevealablePrompt>
              </div>

              <hr />

              <h6 className="mb-3">Bonus Challenges</h6>

              <div className="mb-3">
                <div className="fw-semibold mb-1">5. Visual Bay Map</div>
                <div className="mb-1">Replace the bay list with a visual floorplan-style layout — render bays as coloured squares in a grid that resembles an actual car park. Click a square to book or release.</div>
              </div>

              <div className="mb-3">
                <div className="fw-semibold mb-1">6. Live Updates</div>
                <div className="mb-1">Add automatic polling (e.g. every 5 seconds) so the dashboard refreshes without a page reload. Multiple users should be able to see each other's bookings appear in real time.</div>
              </div>

              <div className="mb-0">
                <div className="fw-semibold mb-1">7. Booking Details</div>
                <div className="mb-1">When booking a bay, prompt for a driver name and vehicle registration. Display this information on occupied bays and add a search feature to find a vehicle across all zones.</div>
              </div>
            </Card.Body>
          </Card>
        )}

        <Card>
          <Card.Header>
            <Card.Title>Car Park Overview</Card.Title>
            <h6 className="card-subtitle text-muted">
              Live zone availability
            </h6>
          </Card.Header>
          <Card.Body>
            {loading && (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading zones…
              </div>
            )}
            {error && (
              <Alert variant="danger">Failed to load zones: {error}</Alert>
            )}
            {!loading && !error && (
              <Row xs={1} sm={2} lg={3} className="g-3">
                {zones.map((zone) => {
                  const variant = getAvailabilityVariant(zone.availableBays, zone.totalBays);
                  const label = getAvailabilityLabel(zone.availableBays, zone.totalBays);
                  const borderStyle: React.CSSProperties = {
                    borderTop: `4px solid var(--bs-${variant})`,
                  };
                  return (
                    <Col key={zone.id}>
                      <Card className="h-100" style={borderStyle}>
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="mb-0">{zone.name}</Card.Title>
                            <span className={`badge bg-${variant}`}>{label}</span>
                          </div>
                          {zone.description && (
                            <p className="text-muted small mb-2">{zone.description}</p>
                          )}
                          <div className="mt-2">
                            <span className="fs-4 fw-bold">{zone.availableBays}</span>
                            <span className="text-muted"> / {zone.totalBays} available</span>
                          </div>
                          <div className="progress mt-2" style={{ height: '6px' }}>
                            <div
                              className={`progress-bar bg-${variant}`}
                              style={{ width: `${zone.totalBays ? (zone.availableBays / zone.totalBays) * 100 : 0}%` }}
                            />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card.Body>
        </Card>
      </Container>
    </React.Fragment>
  );
};

export default ParkingAvailability;

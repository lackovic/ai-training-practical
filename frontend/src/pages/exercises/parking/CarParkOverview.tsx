import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import { fetchApi } from '../../../utils/apiClient';

interface ParkingZone {
  id: number;
  name: string;
  description?: string;
  totalBays: number;
  availableBays: number;
  occupiedBays: number;
}

interface ParkingBay {
  id: number;
  bayNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED';
  zoneId: number;
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
  if (ratio > 0) return 'Nearly full';
  return 'Full';
}

const BAY_BORDER = '2px solid rgba(255,255,255,0.25)';

interface BaySquareProps {
  bay: ParkingBay;
  openSide: 'left' | 'right';
  isActioning: boolean;
  onClick: () => void;
}

const BaySquare = ({ bay, openSide, isActioning, onClick }: BaySquareProps) => {
  const isAvailable = bay.status === 'AVAILABLE';
  const bg = isActioning ? '#6c757d' : isAvailable ? '#198754' : '#dc3545';
  return (
    <div
      title={`Bay ${bay.bayNumber} — ${isAvailable ? 'Available (click to book)' : 'Occupied (click to release)'}`}
      onClick={() => !isActioning && onClick()}
      style={{
        width: '96px',
        height: '52px',
        flexShrink: 0,
        backgroundColor: bg,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        cursor: isActioning ? 'default' : 'pointer',
        fontSize: '0.75rem',
        fontWeight: '600',
        borderTop: BAY_BORDER,
        borderBottom: BAY_BORDER,
        borderLeft: openSide === 'left' ? 'none' : BAY_BORDER,
        borderRight: openSide === 'right' ? 'none' : BAY_BORDER,
        borderRadius: openSide === 'right' ? '4px 0 0 4px' : '0 4px 4px 0',
        userSelect: 'none',
        transition: 'background-color 0.15s',
      }}
    >
      {isActioning ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <>
          <span>{bay.bayNumber}</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{isAvailable ? 'free' : 'taken'}</span>
        </>
      )}
    </div>
  );
};

const CarParkOverview = () => {
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [bays, setBays] = useState<ParkingBay[]>([]);
  const [baysLoading, setBaysLoading] = useState(false);
  const [baysError, setBaysError] = useState<string | null>(null);
  const [actioningBayId, setActioningBayId] = useState<number | null>(null);

  const refreshZones = useCallback(() =>
    fetchApi<ParkingZone[]>('/parking/zones').then((data) => setZones(data ?? [])),
  []);

  useEffect(() => {
    refreshZones()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshZones]);

  const openZone = (zone: ParkingZone) => {
    setSelectedZone(zone);
    setBaysError(null);
    setBaysLoading(true);
    fetchApi<ParkingBay[]>(`/parking/zones/${zone.id}/bays`)
      .then((data) => setBays(data ?? []))
      .catch((err: Error) => setBaysError(err.message))
      .finally(() => setBaysLoading(false));
  };

  const handleBayAction = async (bay: ParkingBay) => {
    const endpoint = bay.status === 'AVAILABLE'
      ? `/parking/bays/${bay.id}/book`
      : `/parking/bays/${bay.id}/release`;
    setActioningBayId(bay.id);
    try {
      await fetchApi(endpoint, { method: 'POST' });
      const [updatedBays, updatedZones] = await Promise.all([
        fetchApi<ParkingBay[]>(`/parking/zones/${bay.zoneId}/bays`),
        fetchApi<ParkingZone[]>('/parking/zones'),
      ]);
      setBays(updatedBays ?? []);
      const freshZones = updatedZones ?? [];
      setZones(freshZones);
      setSelectedZone((prev) => prev ? (freshZones.find((z) => z.id === prev.id) ?? prev) : null);
    } catch (err: any) {
      setBaysError(err.message);
    } finally {
      setActioningBayId(null);
    }
  };

  const midpoint = Math.ceil(bays.length / 2);
  const leftBays = bays.slice(0, midpoint);
  const rightBays = bays.slice(midpoint);

  return (
    <Card>
      <Card.Header>
        {selectedZone ? (
          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setSelectedZone(null)}
              className="d-flex align-items-center gap-1 py-0"
            >
              <ArrowLeft size={14} />
              All zones
            </Button>
            <Card.Title className="mb-0">{selectedZone.name}</Card.Title>
          </div>
        ) : (
          <>
            <Card.Title>Car Park Overview</Card.Title>
            <h6 className="card-subtitle text-muted">Live zone availability — click a zone to manage bays</h6>
          </>
        )}
      </Card.Header>
      <Card.Body>
        {!selectedZone && (
          <>
            {loading && (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading zones…
              </div>
            )}
            {error && <Alert variant="danger">Failed to load zones: {error}</Alert>}
            {!loading && !error && (
              <Row xs={1} sm={2} lg={3} className="g-3">
                {zones.map((zone) => {
                  const variant = getAvailabilityVariant(zone.availableBays, zone.totalBays);
                  const label = getAvailabilityLabel(zone.availableBays, zone.totalBays);
                  return (
                    <Col key={zone.id}>
                      <Card
                        className="h-100"
                        style={{ borderTop: `4px solid var(--bs-${variant})`, cursor: 'pointer' }}
                        onClick={() => openZone(zone)}
                      >
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
          </>
        )}

        {selectedZone && (
          <>
            {baysLoading && (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                Loading bays…
              </div>
            )}
            {baysError && <Alert variant="danger">Failed to load bays: {baysError}</Alert>}
            {!baysLoading && !baysError && (
              <>
                <div style={{ background: '#ced4da', borderRadius: '8px', padding: '16px', display: 'inline-flex', gap: '0' }}>
                  {/* Left column — bays open toward the aisle on the right */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {leftBays.map((bay) => (
                      <BaySquare
                        key={bay.id}
                        bay={bay}
                        openSide="right"
                        isActioning={actioningBayId === bay.id}
                        onClick={() => handleBayAction(bay)}
                      />
                    ))}
                  </div>

                  {/* Central aisle */}
                  <div style={{
                    width: '52px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    color: 'rgba(0,0,0,0.3)',
                    fontSize: '0.7rem',
                    userSelect: 'none',
                  }}>
                    <span>↓</span>
                    <span>↑</span>
                  </div>

                  {/* Right column — bays open toward the aisle on the left */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {rightBays.map((bay) => (
                      <BaySquare
                        key={bay.id}
                        bay={bay}
                        openSide="left"
                        isActioning={actioningBayId === bay.id}
                        onClick={() => handleBayAction(bay)}
                      />
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#198754', borderRadius: '2px', display: 'inline-block' }} />
                    Available
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '2px', display: 'inline-block' }} />
                    Occupied
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default CarParkOverview;

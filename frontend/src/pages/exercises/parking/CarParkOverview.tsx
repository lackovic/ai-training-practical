import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Row, Col, Card, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import { ArrowLeft } from 'lucide-react';
import { fetchApi } from '../../../utils/apiClient';

const POLL_INTERVAL = 5000;

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
  driverName: string | null;
  vehicleRegistration: string | null;
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
  const subtitle = isAvailable ? 'free' : (bay.vehicleRegistration ?? 'taken');
  return (
    <div
      title={isAvailable
        ? `Bay ${bay.bayNumber} — Available`
        : `Bay ${bay.bayNumber} — ${bay.driverName ?? ''} ${bay.vehicleRegistration ?? ''}`.trim()}
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
        overflow: 'hidden',
      }}
    >
      {isActioning ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <>
          <span>{bay.bayNumber}</span>
          <span style={{ fontSize: '0.6rem', opacity: 0.85, maxWidth: '88px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </span>
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

  const [bookingBay, setBookingBay] = useState<ParkingBay | null>(null);
  const [driverName, setDriverName] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');

  const refreshZones = useCallback(() =>
    fetchApi<ParkingZone[]>('/parking/zones').then((data) => setZones(data ?? [])),
  []);

  useEffect(() => {
    refreshZones()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshZones]);

  const selectedZoneIdRef = useRef<number | null>(null);
  useEffect(() => { selectedZoneIdRef.current = selectedZone?.id ?? null; });

  useEffect(() => {
    const id = setInterval(() => {
      const zoneId = selectedZoneIdRef.current;
      if (zoneId !== null) {
        Promise.all([
          fetchApi<ParkingBay[]>(`/parking/zones/${zoneId}/bays`),
          fetchApi<ParkingZone[]>('/parking/zones'),
        ]).then(([updatedBays, updatedZones]) => {
          if (updatedBays) setBays(updatedBays);
          if (updatedZones) {
            setZones(updatedZones);
            setSelectedZone((prev) =>
              prev ? (updatedZones.find((z) => z.id === prev.id) ?? prev) : null
            );
          }
        }).catch(() => {});
      } else {
        fetchApi<ParkingZone[]>('/parking/zones')
          .then((data) => setZones(data ?? []))
          .catch(() => {});
      }
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  const openZone = (zone: ParkingZone) => {
    setSelectedZone(zone);
    setBaysError(null);
    setBaysLoading(true);
    fetchApi<ParkingBay[]>(`/parking/zones/${zone.id}/bays`)
      .then((data) => setBays(data ?? []))
      .catch((err: Error) => setBaysError(err.message))
      .finally(() => setBaysLoading(false));
  };

  const refreshBaysAndZones = async (zoneId: number) => {
    const [updatedBays, updatedZones] = await Promise.all([
      fetchApi<ParkingBay[]>(`/parking/zones/${zoneId}/bays`),
      fetchApi<ParkingZone[]>('/parking/zones'),
    ]);
    setBays(updatedBays ?? []);
    const freshZones = updatedZones ?? [];
    setZones(freshZones);
    setSelectedZone((prev) => prev ? (freshZones.find((z) => z.id === prev.id) ?? prev) : null);
  };

  const handleBook = async () => {
    if (!bookingBay) return;
    setActioningBayId(bookingBay.id);
    try {
      await fetchApi(`/parking/bays/${bookingBay.id}/book`, {
        method: 'POST',
        body: JSON.stringify({ driverName: driverName.trim(), vehicleRegistration: vehicleReg.trim() }),
      });
      await refreshBaysAndZones(bookingBay.zoneId);
      setBookingBay(null);
    } catch (err: any) {
      setBaysError(err.message);
    } finally {
      setActioningBayId(null);
    }
  };

  const handleRelease = async () => {
    if (!bookingBay) return;
    setActioningBayId(bookingBay.id);
    try {
      await fetchApi(`/parking/bays/${bookingBay.id}/release`, { method: 'POST' });
      await refreshBaysAndZones(bookingBay.zoneId);
      setBookingBay(null);
    } catch (err: any) {
      setBaysError(err.message);
    } finally {
      setActioningBayId(null);
    }
  };

  const openBookingModal = (bay: ParkingBay) => {
    setBookingBay(bay);
    setDriverName('');
    setVehicleReg('');
  };

  const isOccupied = bookingBay?.status === 'OCCUPIED';
  const isActioning = bookingBay ? actioningBayId === bookingBay.id : false;
  const canBook = driverName.trim().length > 0 && vehicleReg.trim().length > 0;

  const midpoint = Math.ceil(bays.length / 2);
  const leftBays = bays.slice(0, midpoint);
  const rightBays = bays.slice(midpoint);

  return (
    <>
      <Card>
        <Card.Header>
          {selectedZone ? (
            <div className="d-flex justify-content-between align-items-center">
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
              <span className="d-flex align-items-center gap-1 text-success" style={{ fontSize: '0.75rem' }}>
                <Spinner animation="grow" size="sm" />
                Live
              </span>
            </div>
          ) : (
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <Card.Title className="mb-0">Car Park Overview</Card.Title>
                <h6 className="card-subtitle text-muted">Click a zone to manage bays</h6>
              </div>
              <span className="d-flex align-items-center gap-1 text-success" style={{ fontSize: '0.75rem' }}>
                <Spinner animation="grow" size="sm" />
                Live
              </span>
            </div>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {leftBays.map((bay) => (
                        <BaySquare
                          key={bay.id}
                          bay={bay}
                          openSide="right"
                          isActioning={actioningBayId === bay.id}
                          onClick={() => openBookingModal(bay)}
                        />
                      ))}
                    </div>

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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {rightBays.map((bay) => (
                        <BaySquare
                          key={bay.id}
                          bay={bay}
                          openSide="left"
                          isActioning={actioningBayId === bay.id}
                          onClick={() => openBookingModal(bay)}
                        />
                      ))}
                    </div>
                  </div>

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

      {/* Booking / details modal */}
      <Modal show={bookingBay !== null} onHide={() => !isActioning && setBookingBay(null)} centered>
        <Modal.Header closeButton={!isActioning}>
          <Modal.Title>
            {isOccupied ? `Bay ${bookingBay?.bayNumber} — Occupied` : `Book Bay ${bookingBay?.bayNumber}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isOccupied ? (
            <dl className="mb-0 row">
              <dt className="col-sm-4">Driver</dt>
              <dd className="col-sm-8">{bookingBay?.driverName ?? '—'}</dd>
              <dt className="col-sm-4">Vehicle</dt>
              <dd className="col-sm-8 mb-0">{bookingBay?.vehicleRegistration ?? '—'}</dd>
            </dl>
          ) : (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Driver name</Form.Label>
                <Form.Control
                  autoFocus
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canBook && !isActioning && handleBook()}
                  placeholder="e.g. Jane Smith"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Vehicle registration</Form.Label>
                <Form.Control
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canBook && !isActioning && handleBook()}
                  placeholder="e.g. AB12 CDE"
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setBookingBay(null)} disabled={isActioning}>
            {isOccupied ? 'Close' : 'Cancel'}
          </Button>
          {isOccupied ? (
            <Button variant="success" onClick={handleRelease} disabled={isActioning}>
              {isActioning ? <Spinner animation="border" size="sm" /> : 'Release bay'}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleBook} disabled={isActioning || !canBook}>
              {isActioning ? <Spinner animation="border" size="sm" /> : 'Book bay'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CarParkOverview;

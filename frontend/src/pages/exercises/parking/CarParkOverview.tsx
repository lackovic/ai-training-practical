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
  return 'Nearly full';
}

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
              <Row xs={2} sm={3} md={4} lg={5} className="g-3">
                {bays.map((bay) => {
                  const isAvailable = bay.status === 'AVAILABLE';
                  const isActioning = actioningBayId === bay.id;
                  return (
                    <Col key={bay.id}>
                      <Card
                        className="h-100 text-center"
                        style={{ borderTop: `4px solid var(--bs-${isAvailable ? 'success' : 'danger'})` }}
                      >
                        <Card.Body className="p-2 d-flex flex-column align-items-center justify-content-between gap-2">
                          <div className="fw-bold">Bay {bay.bayNumber}</div>
                          <span className={`badge bg-${isAvailable ? 'success' : 'danger'}`}>
                            {isAvailable ? 'Available' : 'Occupied'}
                          </span>
                          <Button
                            variant={isAvailable ? 'outline-danger' : 'outline-success'}
                            size="sm"
                            className="w-100"
                            disabled={isActioning}
                            onClick={() => handleBayAction(bay)}
                          >
                            {isActioning
                              ? <Spinner animation="border" size="sm" />
                              : isAvailable ? 'Book' : 'Release'}
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default CarParkOverview;

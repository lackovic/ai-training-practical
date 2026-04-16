import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Container } from 'react-bootstrap';
import CarParkOverview from './CarParkOverview';
import OccupancyChart from './OccupancyChart';

const ParkingAvailability = () => {
  const [isLive, setIsLive] = useState(true);

  return (
    <React.Fragment>
      <Helmet title="Car Park Availability" />
      <Container fluid className="p-0">
        <h1 className="h3 mb-3">Car Park Availability</h1>
        <CarParkOverview isLive={isLive} onStatusChange={setIsLive} />
        <OccupancyChart onStatusChange={setIsLive} />
      </Container>
    </React.Fragment>
  );
};

export default ParkingAvailability;

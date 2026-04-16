import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler';
import {
  handleGetAllZones,
  handleGetBaysByZone,
  handleBookBay,
  handleReleaseBay,
} from '../controllers/parking.controller';
import {
  zoneIdValidationRules,
  bayIdValidationRules,
  validate,
} from '../middleware/parking.validator';

const router = Router();

// GET /api/parking/zones — all zones with availability counts
router.get('/zones', asyncHandler(handleGetAllZones));

// GET /api/parking/zones/:zoneId/bays — bays for a specific zone
router.get('/zones/:zoneId/bays', zoneIdValidationRules, validate, asyncHandler(handleGetBaysByZone));

// POST /api/parking/bays/:bayId/book — mark a bay as occupied
router.post('/bays/:bayId/book', bayIdValidationRules, validate, asyncHandler(handleBookBay));

// POST /api/parking/bays/:bayId/release — mark a bay as available
router.post('/bays/:bayId/release', bayIdValidationRules, validate, asyncHandler(handleReleaseBay));

export default router;

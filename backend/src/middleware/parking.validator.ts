import { param, body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const zoneIdValidationRules = [
  param('zoneId').isInt({ min: 1 }).withMessage('zoneId must be a positive integer'),
];

export const bayIdValidationRules = [
  param('bayId').isInt({ min: 1 }).withMessage('bayId must be a positive integer'),
];

export const searchValidationRules = [
  query('q').trim().notEmpty().withMessage('Search query q is required'),
];

export const bookBayValidationRules = [
  ...bayIdValidationRules,
  body('driverName').trim().notEmpty().withMessage('Driver name is required'),
  body('vehicleRegistration').trim().notEmpty().withMessage('Vehicle registration is required'),
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

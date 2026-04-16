import { param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const zoneIdValidationRules = [
  param('zoneId').isInt({ min: 1 }).withMessage('zoneId must be a positive integer'),
];

export const bayIdValidationRules = [
  param('bayId').isInt({ min: 1 }).withMessage('bayId must be a positive integer'),
];

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

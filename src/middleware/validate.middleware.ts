import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/errorTypes.js';

export const validateBody = (schema: ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return next(
        new ValidationError(parsed.error.issues.map((issue) => issue.message).join(', ')),
      );
    }

    req.body = parsed.data;
    next();
  };
};

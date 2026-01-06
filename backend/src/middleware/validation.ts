import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        next(new AppError(400, messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
};

export const authSchemas = {
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      username: z.string().min(3).max(20).optional(),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),
};

export const riddleSchemas = {
  submit: z.object({
    body: z.object({
      riddleId: z.string().cuid(),
      answer: z.string().min(1, 'Answer is required'),
      timeSpent: z.number().min(0).optional(),
      hintsUsed: z.number().min(0).optional(),
    }),
  }),

  getHint: z.object({
    params: z.object({
      riddleId: z.string().cuid(),
    }),
    query: z.object({
      hintNumber: z.string().transform(Number),
    }),
  }),
};

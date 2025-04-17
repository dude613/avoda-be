import { Request, Response, NextFunction, RequestHandler } from "express";

// This wrapper makes async controllers compatible with Express
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next))
      .then((result) => {
        if (result && !res.headersSent) {
          return res.json(result);
        }
      })
      .catch(next);
  };
};

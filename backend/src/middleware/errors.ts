import type { NextFunction, Request, Response } from "express";

export function notFound(_request: Request, response: Response) {
  return response.status(404).json({ message: "Route not found." });
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  console.error(error);
  return response.status(500).json({ message: "Something went wrong. Please try again." });
}

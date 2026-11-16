import type { Response } from "express";

export class SuccessResponse<T> {
  success = true;
  message: string;
  data: T;

  constructor(data: T, message = "Success") {
    this.data = data;
    this.message = message;
  }
}

/** Sends data using the API's standard success envelope. */
export function sendSuccess<T>(res: Response, data: T, message = "Success", status = 200) {
  return res.status(status).json(new SuccessResponse(data, message));
}

/**
 * Simple helper to send a consistent JSON response shape.
 */
export class ApiResponse {
  static success(
    message: string,
    data: unknown = null,
    statusCode: number = 200
  ) {
    return {
      success: true,
      statusCode,
      message,
      data,
    };
  }

  /** Every error response must use this exact shape */
  static error(message: string) {
    return {
      success: false as const,
      message,
    };
  }
}

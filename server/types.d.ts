import "express-serve-static-core";

declare module 'express-serve-static-core' {
  interface Response {
    advancedResults?: {
      success: boolean;
      count: number;
      pagination?: unknown;
      data: unknown[];
    };
  }
}

import { Request } from "express";
import { AuthConstants } from "../constants/auth";

/**
 * Read session token from Authorization: Bearer <token>.
 */
export class TokenHelper {
  static extractBearer(req: Request): string | undefined {
    const header = req.headers.authorization;

    if (!header || typeof header !== "string") {
      return undefined;
    }

    const [scheme, token] = header.split(" ");

    if (scheme !== AuthConstants.HEADER_SCHEME || !token) {
      return undefined;
    }

    return token.trim() || undefined;
  }
}

export const extractBearerToken = TokenHelper.extractBearer;

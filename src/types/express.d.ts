import { JwtPayload } from "jsonwebtoken";
import { User } from "../lib/prisma.js";
declare global {
  namespace Express {
    interface Request {
      user?: User;
      projectId: number;
      memberId: number;
    }
  }
}

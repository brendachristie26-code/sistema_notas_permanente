import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  workspaceId: number;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  const workspaceIdHeader = opts.req.headers["x-workspace-id"];
  const parsedId = workspaceIdHeader ? Number(workspaceIdHeader) : 1;
  const workspaceId = Number.isNaN(parsedId) ? 1 : parsedId;

  return {
    req: opts.req,
    res: opts.res,
    user,
    workspaceId,
  };
}

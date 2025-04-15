import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

interface BaseNameAlertPreference {
  enabled: boolean;
  token?: string;
  url?: string;
  baseName: string;
  expiryDate: string;
}

function getUserBaseNameAlertKey(fid: number, baseName: string): string {
  return `alert:${fid}:${baseName}`;
}

export async function GET(request: Request) {
  const fid = request.headers.get("X-Farcaster-FID");

  // Get baseName from URL query params instead of body
  const url = new URL(request.url);
  const baseName = url.searchParams.get("baseName");

  if (!fid) {
    return Response.json({ error: "FID is required" }, { status: 400 });
  }

  if (!baseName) {
    return Response.json({ error: "baseName is required" }, { status: 400 });
  }

  try {
    const preference = await redis.get(
      getUserBaseNameAlertKey(parseInt(fid), baseName),
    );
    return Response.json(preference || { enabled: false });
  } catch (error) {
    console.error("Error getting reminder preferences: ", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

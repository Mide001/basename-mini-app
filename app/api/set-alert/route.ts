import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { fid, basename, expiryDate } = await req.json();

  if (!fid || !basename || !expiryDate) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const expiryKey = `alerts:${expiryDate}`;
  await redis?.rpush(expiryKey, JSON.stringify({ fid, basename }));

  return NextResponse.json({ success: true });
}

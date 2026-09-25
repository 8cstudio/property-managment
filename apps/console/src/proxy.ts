import { type NextRequest, NextResponse } from "next/server";

/** Next.js 16 request interception. Auth and tenant checks are added here later. */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

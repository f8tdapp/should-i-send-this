import type { NextRequest } from "next/server";

import { handleAnalyzeRequest } from "./handler";

export async function POST(request: NextRequest) {
  return handleAnalyzeRequest(request);
}

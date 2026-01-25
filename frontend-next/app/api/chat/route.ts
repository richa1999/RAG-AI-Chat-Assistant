import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { message, stream, session_id } = await req.json();
  const authorization = req.headers.get("authorization");

  console.log("API Route - Authorization header:", authorization ? "Present" : "Missing");

  // Use backend service name for Docker, localhost for dev
  const apiUrl = process.env.BACKEND_URL || "http://localhost:8000";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (authorization) {
    headers["Authorization"] = authorization;
  }

  // Use streaming endpoint if requested
  if (stream) {
    const res = await fetch(`${apiUrl}/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, session_id }),
    });

    // Return the stream directly
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // Regular non-streaming response
  const res = await fetch(`${apiUrl}/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, session_id }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}

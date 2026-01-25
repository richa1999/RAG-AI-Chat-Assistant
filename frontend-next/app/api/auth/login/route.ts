import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const apiUrl = process.env.BACKEND_URL || "http://localhost:8000";

  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { detail: "Connection error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { pincode } = await req.json();

  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  const data = await res.json();

  if (data[0]?.Status !== "Success") {
    return NextResponse.json({ error: "Invalid PIN code" }, { status: 400 });
  }

  const city = data[0].PostOffice?.[0]?.District;
  const state = data[0].PostOffice?.[0]?.State;

  return NextResponse.json({ city, state });
}
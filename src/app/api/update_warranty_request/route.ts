import { NextResponse } from "next/server";
import pool from "../../../../utils/db";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: "Unauthorized", message: "You are unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { auth_id, pk_id, comments, status, request_type, rejection_id, rejection_other, isRejected, customer_phone } = body;

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Insert into user_request_addressed
    await connection.query(
      `INSERT INTO user_request_addressed 
       (fk_request_id, auth_user_id, comments, request_type, request_status, fk_rejection_id, other_rejection, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pk_id, auth_id, comments, request_type, status, rejection_id, rejection_other, new Date()]
    );

    // Step 2: Update user_warranty_requests
    await connection.query(
      `UPDATE user_warranty_requests 
       SET status_id = ?, addressed_id = ?, fk_reject_id = ?
       WHERE go_activity_id = ?`,
      [status,pk_id]
    );
    await connection.query(
      `UPDATE user_warranty_requests 
       SET status_id = ?, addressed_id = ?, fk_reject_id = ?
       WHERE pk_request_id = ?`,
      [status, auth_id, rejection_id, pk_id]
    );

    // Step 3: Insert into logs
    const createdJson = {
      fk_request_id: pk_id,
      auth_id: auth_id,
      changed_comments: comments,
      request_type: request_type,
      changed_status: status,
    };

    await connection.query(
      `INSERT INTO logs (activity_type, change_json, created_at) VALUES (?, ?, ?)`,
      ["Update Warranty Request", JSON.stringify(createdJson), new Date()]
    );

    // ✅ COMMIT after all DB operations are successful
    await connection.commit();
    connection.release();

    // Step 4: Send Aisensy message
    // const campaignName = "Reject_message";

    const aisensyPayload = {
      apiKey: process.env.NEXT_PUBLIC_AISENSY_API_KEY,
      campaignName:"Reject_message",
      destination: `${customer_phone}`,
      userName: "Varroc Aftermarket",
      templateParams: ["Hello abhi", isRejected ? "Rejected" : "Approved"],
      source: "new-landing-page form",
      media: {},
      buttons: [],
      carouselCards: [],
      location: {},
      attributes: {},
      paramsFallbackValue: {
        FirstName: "user"
      }
    };

    console.log("this is the payload for aisensy"+JSON.stringify(aisensyPayload));
    

    const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aisensyPayload),
    });

    const result = await res.json();
    console.log("Aisensy response:", result);
    if(result.success==='true'){
      return NextResponse.json({ status: 1, message: "Request updated message sent to customer" });
    }{
      return NextResponse.json({ status: 1, message: "Request updated but message delivery failed to customer"});
    }
  } catch (e: any) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Transaction failed:", e);
    return NextResponse.json(
      { status: 0, error: e.message || "Internal Server Error", code: e.code || null },
      { status: 500 }
    );
  }
}

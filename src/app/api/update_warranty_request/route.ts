import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
  total: number;
}

export async function POST(request: Request) {
  console.log("this is the request",request);
  
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized', message: "You are unauthorized" }, { status: 403 });
  }
  const body = await request.json();
  const { auth_id, pk_id, comments, status, request_type, rejection_id, rejection_other } = body;

  try {
    const connection = await pool.getConnection();

    const insertData = await connection.query(
      `INSERT INTO user_request_addressed 
           (fk_request_id, auth_user_id, comments, request_type, request_status,fk_rejection_id,other_rejection,created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pk_id, auth_id, comments, request_type, status, rejection_id, rejection_other, new Date()]
    );

    const updateData = await connection.query(
      `UPDATE user_warranty_requests 
           SET status_id = ?, addressed_id = ? ,fk_reject_id=?
           WHERE pk_request_id = ?`,
      [status, auth_id,rejection_id, pk_id]
    );
    const createdJson = {
      "fk_request_id": pk_id,
      "auth_id": auth_id,
      "changed_comments": comments,
      "request_type": request_type,
      "changed_status": status
    }
    const insertLog = await connection.query(
      `INSERT INTO logs (activity_type,change_json,created_at) VALUES (?,?,?)`,
      ["Update Warranty Request", JSON.stringify(createdJson), new Date()]
    );
    connection.release();

    return NextResponse.json({ status: 1, message: "Request Updated" });
  } catch (e: any) {
    console.log(e);

    return NextResponse.json(
      {
        status: 0,
        error: e.message || "Internal Server Error",
        code: e.code || null,
      },
      { status: 500 } // Optional: set HTTP status code
    );
  }
}
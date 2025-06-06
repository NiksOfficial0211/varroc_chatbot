import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
  total: number;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized',message:"You are unauthorized" }, { status: 403 });
  }
  const body = await request.json();
  const { request_id } = body;

  try {
    const connection = await pool.getConnection();

    let query = `
      SELECT 
        ua.*,
        rt.request_type AS request_type,
        rs.status AS request_status
        FROM user_warranty_requests ua
        JOIN request_types rt ON ua.request_type_id = rt.request_type_id 
        JOIN request_status rs ON ua.status_id = rs.status_id
    `;

    // Dynamic WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];

    if (request_id) {
      conditions.push(`ua.pk_request_id = ?`);
      values.push(request_id);
    }
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }


    const [userRequests] = await connection.execute<RowDataPacket[]>(query, values);

    const [batteryData]=await connection.execute(
      `SELECT *,DATE_FORMAT(manufacturing_date, '%Y-%m-%d') as manufacturing_date FROM product_info WHERE battery_serial_number=?`,[userRequests[0].product_serial_no])

    const [addressedData] = await connection.execute(
      `SELECT
          ura.*,
          rt.request_type AS request_type,
          rs.status AS request_status,
          aut.username as addressedBY,
          rr.rejection_msg AS rejection_msg
          FROM user_request_addressed ura
          JOIN auth aut ON ura.auth_user_id = aut.auth_id 
          JOIN request_types rt ON ura.request_type = rt.request_type_id 
          LEFT JOIN request_rejections rr ON ura.fk_rejection_id = rr.pk_reject_id 
          JOIN request_status rs ON ura.request_status = rs.status_id WHERE fk_request_id = ?`,
      [request_id]
    );

    

    // Example: Get battery info for each request
    const [images] = await connection.execute(
      `SELECT
          pk_id,
          image_url,
          fk_request_id,
          is_invoice
           FROM user_request_attachements WHERE fk_request_id = ?`, [request_id]);
    connection.release();
    return NextResponse.json({
      status: 1, message: "Data Received", data: { request: userRequests, addressedData: addressedData,battery_details:batteryData, images: images }
    });
  } catch (e) {
    console.log(e);

    return NextResponse.json({ status: 0, error: "Exception Occured" })
  }
}
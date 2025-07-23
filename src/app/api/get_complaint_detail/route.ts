import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
  total: number;
}

export async function POST(request: Request) {

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized', message: "You are unauthorized" }, { status: 403 });
  }
  const body = await request.json();
  const { pk_id } = body;



  try {
    const connection = await pool.getConnection();

    let query = `
      SELECT 
        ucr.*,
        rs.status AS request_status
        FROM user_complaint_requests ucr
        JOIN request_status rs ON ucr.status_id = rs.status_id 
    `;

    // Dynamic WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];


    if (pk_id) {
      conditions.push(`ucr.pk_id = ?`);
      values.push(pk_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    // values.push(limit, offset);
    console.log(query);

    const [userRequests] = await connection.execute<RowDataPacket[]>(query, values);
    const [batteryData] = await connection.execute(
      `SELECT *,DATE_FORMAT(manufacturing_date, '%Y-%m-%d') as manufacturing_date FROM product_info WHERE battery_serial_number=?`, [userRequests[0].battery_serial_no])

    const [duplicateDataRows] = await connection.execute(`
      SELECT 
        ucr.*,
        rs.status AS request_status
        FROM user_complaint_requests ucr
        JOIN request_status rs ON ucr.status_id = rs.status_id
        WHERE battery_serial_no = ? && complaint__id != ?
    `, [userRequests[0].battery_serial_no, userRequests[0].complaint__id]);


    const [warrantyRecord]= await connection.execute(`SELECT 
        ua.*,
        rt.request_type AS request_type,
        rs.status AS request_status
        FROM user_warranty_requests ua
        JOIN request_types rt ON ua.request_type_id = rt.request_type_id 
        JOIN request_status rs ON ua.status_id = rs.status_id WHERE ua.product_serial_no=?`,[userRequests[0].battery_serial_no])

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
          JOIN request_status rs ON ura.request_status = rs.status_id WHERE ura.request_type=2 AND ura.fk_request_id = ?`,
      [pk_id]
    );
    const [images] = await connection.execute(
      `SELECT
          pk_id,
          image_url,
          fk_request_id,
          is_invoice
           FROM user_claim_attachements WHERE fk_request_id = ?`, [pk_id]);
    connection.release();
    return NextResponse.json({
      status: 1, message: "Data Received", data: { complaint_data: userRequests, addressedData: addressedData, images: images, battery_details: batteryData, duplicate_data: duplicateDataRows,warrantyRaised:warrantyRecord }
    });

  } catch (e) {

    return NextResponse.json({ status: 0, error: "Exception Occured" })
  }
}
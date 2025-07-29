import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
  total: number;
}
interface DuplicateFreechatWithAddressed {
  dup_warranty: RowDataPacket;
  addressedData: RowDataPacket[];
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
          JOIN request_status rs ON ura.request_status = rs.status_id WHERE ura.request_type=1 AND ura.fk_request_id = ? `,
      [request_id]
    );

    const [duplicateWarrantyRows] = await connection.execute<RowDataPacket[]>(`
  SELECT 
    ua.*,
    rt.request_type AS request_type,
    rs.status AS request_status
    FROM user_warranty_requests ua
    JOIN request_types rt ON ua.request_type_id = rt.request_type_id 
    JOIN request_status rs ON ua.status_id = rs.status_id
    WHERE product_serial_no = ? AND request_id != ?
`, [userRequests[0].product_serial_no, userRequests[0].request_id]);

// Fetch addressed data for each duplicate warranty request
const dupIds = duplicateWarrantyRows.map(row => row.pk_id);
let duplicateFreechatDataWithAddressed: DuplicateFreechatWithAddressed[] = [];
let addressedRows: any[] | null ;
if (dupIds && dupIds.length > 0 && dupIds.length>1) {
   [addressedRows] = await connection.query<RowDataPacket[]>(`
    SELECT
      ura.*,
      rt.request_type AS request_type,
      rs.status AS request_status,
      aut.username AS addressedBY,
      rr.rejection_msg AS rejection_msg,
      ura.fk_request_id
    FROM user_request_addressed ura
    JOIN auth aut ON ura.auth_user_id = aut.auth_id 
    JOIN request_types rt ON ura.request_type = rt.request_type_id 
    LEFT JOIN request_rejections rr ON ura.fk_rejection_id = rr.pk_reject_id 
    JOIN request_status rs ON ura.request_status = rs.status_id 
    WHERE ura.request_type = 4 AND ura.fk_request_id IN (?)
  `, [dupIds]);

  // Merge addressed data with duplicate rows
  duplicateFreechatDataWithAddressed = duplicateWarrantyRows.map(row => ({
    dup_warranty: row,
    addressedData: addressedRows!.filter(addr => addr.fk_request_id === row.pk_id)
  }));
}else{
[addressedRows] = await connection.query<RowDataPacket[]>(`
    SELECT
      ura.*,
      rt.request_type AS request_type,
      rs.status AS request_status,
      aut.username AS addressedBY,
      rr.rejection_msg AS rejection_msg,
      ura.fk_request_id
    FROM user_request_addressed ura
    JOIN auth aut ON ura.auth_user_id = aut.auth_id 
    JOIN request_types rt ON ura.request_type = rt.request_type_id 
    LEFT JOIN request_rejections rr ON ura.fk_rejection_id = rr.pk_reject_id 
    JOIN request_status rs ON ura.request_status = rs.status_id 
    WHERE ura.request_type = 4 AND ura.fk_request_id = ?
  `, [dupIds]);

  // Merge addressed data with duplicate rows
  duplicateFreechatDataWithAddressed = duplicateWarrantyRows.map(row => ({
    dup_warranty: row,
    addressedData: addressedRows!.filter(addr => addr.fk_request_id === row.pk_id)
  }));
}


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
      status: 1, message: "Data Received", data: { request: userRequests, addressedData: addressedData,battery_details:batteryData, images: images,duplicate_data:duplicateFreechatDataWithAddressed }
    });
  } catch (e) {
    console.log(e);

    return NextResponse.json({ status: 0, error: "Exception Occured" })
  }
}
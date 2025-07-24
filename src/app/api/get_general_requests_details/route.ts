import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";

interface CountResult extends RowDataPacket {
  total: number;
}
interface DuplicateFreechatWithAddressed {
  dup_general: RowDataPacket;
  addressedData: RowDataPacket[];
}

export async function POST(request: Request) {

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized', message: "You are unauthorized" }, { status: 403 });
  }
  const body = await request.json();
  const { pk_id } = body;


  let connection: PoolConnection;
  try {
     connection = await pool.getConnection();

    let query = `
      SELECT 
        udr.*,
        rs.status AS request_status
        FROM user_freechat_requests udr
        JOIN request_status rs ON udr.status_id = rs.status_id 
    `;

    // Dynamic WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];


    if (pk_id) {
      conditions.push(`udr.pk_id = ?`);
      values.push(pk_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    // values.push(limit, offset);
    

    const [userRequests] = await connection.execute<RowDataPacket[]>(query, values);
    console.log(userRequests);
// Step 1: Fetch duplicate freechat requests
const [duplicateFreechatRows] = await connection.execute<RowDataPacket[]>(`
  SELECT 
    ufr.*,
    rs.status AS request_status
  FROM user_freechat_requests ufr
  JOIN request_status rs ON ufr.status_id = rs.status_id
  WHERE whatsapp_no = ? AND pk_id != ?
`, [userRequests[0].whatsapp_no, pk_id]);

// Step 2: For each, fetch addressed data
// Step 1: Fetch all addressed rows for duplicates in a single query
const dupIds = duplicateFreechatRows.map(row => row.pk_id);
let duplicateFreechatDataWithAddressed: DuplicateFreechatWithAddressed[] = [];

if (dupIds.length > 0) {
  const [addressedRows] = await connection.query<RowDataPacket[]>(`
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
  duplicateFreechatDataWithAddressed = duplicateFreechatRows.map(row => ({
    dup_general: row,
    addressedData: addressedRows.filter(addr => addr.fk_request_id === row.pk_id)
  }));
}




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
          JOIN request_status rs ON ura.request_status = rs.status_id WHERE ura.fk_request_id = ? AND ura.request_type=4`,
      [pk_id]
    );
 
    
    return NextResponse.json({
      status: 1, message: "Data Received", data: { enq_data: userRequests, addressed_data: addressedData, duplicate_data: duplicateFreechatDataWithAddressed}
    });

  } catch (e) {
    console.log(e);
    
    return NextResponse.json({ status: 0, message: "Exception Occured", error:e })
  }finally{
    if(connection!) connection.release();
  }
}
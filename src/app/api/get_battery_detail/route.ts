import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
  total: number;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized', message: "You are unauthorized" }, { status: 403 });
  }
  const body = await request.json();
  const { product_id } = body;

  try {
    const connection = await pool.getConnection();

    let query = `
          SELECT 
            pro.*, DATE_FORMAT(pro.manufacturing_date, '%Y-%m-%d') as manufacturing_date,
            created_by_user.username AS created_by_username,
            updated_by_user.username AS updated_by_username
            FROM product_info pro
            JOIN auth AS created_by_user ON pro.created_by = created_by_user.auth_id
            LEFT JOIN auth AS updated_by_user ON pro.updated_by = updated_by_user.auth_id 
    `;


    const conditions: string[] = [];
    const values: any[] = [];

    if (product_id) {
      conditions.push(`pro.pk_id = ?`);
      values.push(product_id);
    }
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }
    const [batteryDetail] = await connection.execute<RowDataPacket[]>(query, values);


    connection.release();
    return NextResponse.json({
      status: 1, message: "Data Received", data: batteryDetail
    });
  } catch (e) {
    console.log(e);

    return NextResponse.json({ status: 0, error: "Exception Occured" })
  }
}
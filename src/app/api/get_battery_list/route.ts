import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
    total: number;
  }

export async function  POST(request:NextRequest){
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized',message:"You are unauthorized" }, { status: 403 });
  }
    const body = await request.json();
    const { date,battery_model,battery_serial_number,page=1,limit  } = body;
    
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const offset = (parsedPage - 1) * parsedLimit;
    try{
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

    // Dynamic WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];

    if (date) {
      conditions.push(`DATE(pro.manufacturing_date) = ?`);
      values.push(date); // should be in 'YYYY-MM-DD' format
    }


    if (battery_model) {
      conditions.push(`pro.battery_model LIKE ?`);
      values.push(`%${battery_model}%`);
    }

    if (battery_serial_number) {
      conditions.push(`pro.battery_serial_number LIKE ?`);
      values.push(`%${battery_serial_number}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ")
    }

query += ` ORDER BY pro.created_at DESC LIMIT ${parsedLimit} OFFSET ${offset}`;
    // values.push(limit, offset);
    
    const [allBattery] = await connection.execute<RowDataPacket[]>(query, values);
    
   let countQuery = `SELECT COUNT(*) as total FROM product_info pro
     JOIN auth AS created_by_user ON pro.created_by = created_by_user.auth_id
      LEFT JOIN auth AS updated_by_user ON pro.updated_by = updated_by_user.auth_id`;

    if (conditions.length > 0) {
      countQuery += ` WHERE ` + conditions.join(" AND ");
    }
    const [countResult] = await connection.execute<CountResult[]>(countQuery, values);
    const totalCount = countResult[0]?.total || 0;

        connection.release();
        return NextResponse.json({status:1,message:"Data Received",data:allBattery,pageNumber:page,total:totalCount,
          from: offset + 1,
          to: Math.min(offset + allBattery.length, totalCount),
        });
    }catch(e){
        console.log(e);
        
        return NextResponse.json({status:0,error:"Exception Occured",message:"Exception Occured"})
    }
}
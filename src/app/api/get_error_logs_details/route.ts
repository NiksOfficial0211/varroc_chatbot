import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

export async function  POST(request:Request){
    
    console.log("this is the request",request);

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized',message:"You are unauthorized" }, { status: 403 });
  }
    const body = await request.json();
    const {pk_error_id  } = body;
    try{
        const connection = await pool.getConnection();
        let query = `SELECT rel.*,au.username as username FROM request_error_logs rel LEFT JOIN auth au ON rel.auth_id = au.auth_id`
        const conditions: string[] = [];
        const values: any[] = [];
        if (pk_error_id) {
          conditions.push(`pk_error_id = ?`);
          values.push(pk_error_id); // should be in 'YYYY-MM-DD' format
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ` + conditions.join(" AND ");
        }

        const [rows] = await connection.execute<RowDataPacket[]>(query, values);
  

        connection.release();
        return NextResponse.json({status:1,message:"All Logs",data:rows});
    }catch(e){
        console.log(e);
        
        return NextResponse.json({status:0,error:"Exception Occured"})
    }
}
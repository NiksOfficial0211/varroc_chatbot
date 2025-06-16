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
    const {pk_error_id,auth_id,updated_json} = body;
    try{
        const connection = await pool.getConnection();
        
  
    const updateData = await connection.query(
      `UPDATE request_error_logs 
           SET auth_id = ?, changed_json_log = ? 
           WHERE pk_error_id = ?`,
      [auth_id,JSON.stringify(updated_json),pk_error_id]
    );
        connection.release();
        return NextResponse.json({status:1,message:"Data Updated"});
    }catch(e){
        console.log(e);
        
        return NextResponse.json({status:0,error:"Exception Occured"})
    }
}
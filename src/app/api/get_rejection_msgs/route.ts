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
    const {request_type} = body;
    try{
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
          `SELECT pk_reject_id,rejection_msg FROM request_rejections WHERE request_type=?`,[request_type]
        );
        connection.release();
        return NextResponse.json({status:1,message:"All Rejection messages",data:rows});
    }catch(e){
        console.log(e);
        
        return NextResponse.json({status:0,error:"Exception Occured"})
    }
}
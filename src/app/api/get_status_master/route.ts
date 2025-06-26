import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
    total: number;
  }

export async function  POST(request:Request){
    
    const body = await request.json();
    const {request_type} = body;
    
    try{
        const connection = await pool.getConnection();
        const [rows] = await connection.query(
          `SELECT status_id,status FROM request_status WHERE request_type= ?`,[request_type]
        );
      

        connection.release();
        return NextResponse.json({status:1,message:"All Status",data:rows});
    }catch(e){
        console.log(e);
        
        return NextResponse.json({status:0,error:"Exception Occured"})
    }
}
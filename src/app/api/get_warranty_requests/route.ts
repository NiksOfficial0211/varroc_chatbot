import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
    total: number;
  }

export async function  POST(request:Request){
  console.log("this is the request",request);

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized',message:"You are unauthorized" }, { status: 403 });
  }
    const body = await request.json();
    const { date,request_id,phone_no,name,status,reject_id,page=1,limit=10  } = body;
    
    
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const offset = (parsedPage - 1) * parsedLimit;
    
    try{
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

    if (date) {
      conditions.push(`DATE(ua.created_at) = ?`);
      values.push(date); // should be in 'YYYY-MM-DD' format
    }

    if (request_id) {
      conditions.push(`ua.request_id = ?`);
      values.push(request_id);
    }

    if (phone_no) {
      conditions.push(`ua.user_phone like ?`);
      values.push(`%${phone_no}%`);
    }

    if (name) {
      conditions.push(`ua.user_name LIKE ?`);
      values.push(`%${name}%`);
    }

    if (status) {
      conditions.push(`ua.status_id = ?`);
      values.push(status);
    }
    if (reject_id) {
      conditions.push(`ua.fk_reject_id = ?`);
      values.push(reject_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

query += ` ORDER BY ua.created_at DESC LIMIT ${parsedLimit} OFFSET ${offset}`;
    // values.push(limit, offset);
    console.log(query);
    
    const [userRequests] = await connection.execute<RowDataPacket[]>(query, values);
    
    const enrichedRequests = await Promise.all(
      userRequests.map(async (request: any) => {
        // Example: Get battery info for each request
        let addressedQuery = 
          `SELECT
          ura.*,
          rt.request_type AS request_type,
          rr.rejection_msg AS rejection_msg,
          rs.status AS request_status 
          FROM user_request_addressed ura
          JOIN request_types rt ON ura.request_type = rt.request_type_id 
          LEFT JOIN request_rejections rr ON ura.fk_rejection_id = rr.pk_reject_id 
          JOIN request_status rs ON ura.request_status = rs.status_id `;

        
      const conditions: string[] = [];
      const values: any[] = [];
      conditions.push(`ura.fk_request_id = ?`);
      values.push(request.pk_request_id); // should be in 'YYYY-MM-DD' format
    
    if (conditions.length > 0) {
      addressedQuery += ` WHERE ` + conditions.join(" AND ");
    }
    addressedQuery += ` ORDER BY ura.pk_id DESC LIMIT 1`;
    const [addressedData]=await connection.execute(addressedQuery,values)
        return {
          ...request,
          addressedDetails: addressedData || null,
        };
      })
    );

        connection.release();
        return NextResponse.json({status:1,message:"Data Received",data:enrichedRequests,pageNumber:page
        });
    }catch(e){
        console.log(e);
        
        return NextResponse.json({status:0,error:"Exception Occured"})
    }
}
import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";

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
    const { date,enquiry_id,phone_no,status,city,state_address,page=1,limit=10  } = body;
    
    
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const offset = (parsedPage - 1) * parsedLimit;
    let connection: PoolConnection ;
    try{
        connection = await pool.getConnection();
   
        let query = `
      SELECT 
        udr.*,
        rs.status AS request_status
      FROM user_dealership_request udr
      JOIN request_status rs ON udr.status_id = rs.status_id
    `;

    // Dynamic WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];

    if (date) {
      conditions.push(`DATE(udr.created_at) = ?`);
      values.push(date); // should be in 'YYYY-MM-DD' format
    }

    if (enquiry_id) {
      conditions.push(`udr.dealership_id = ?`);
      values.push(enquiry_id);
    }

    if (phone_no) {
      conditions.push(`udr.raised_whatsapp_no like ?`);
      values.push(`%${phone_no}%`);
    }

    if (state_address) {
      conditions.push(`udr.state_address = ?`);
      values.push(state_address);
    }
    if (city) {
      conditions.push(`udr.city = ?`);
      values.push(city);
    }

    if (status) {
      conditions.push(`udr.status_id = ?`);
      values.push(status);
    }
   

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY udr.created_at DESC LIMIT ${parsedLimit} OFFSET ${offset}`;
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
          rs.status AS request_status 
          FROM user_request_addressed ura
          JOIN request_types rt ON ura.request_type = rt.request_type_id 
          JOIN request_status rs ON ura.request_status = rs.status_id`;

        
      const conditions: string[] = [];
      const values: any[] = [];

      conditions.push(`ura.fk_request_id = ?`);
      values.push(request.dealership_id); 
      conditions.push(`ura.request_type = ?`);
      values.push("3"); 
    
    if (conditions.length > 0) {
      addressedQuery += ` WHERE ` + conditions.join(" AND ");
    }
    const [addressedData]=await connection.execute(addressedQuery,values)
        return {
          ...request,
          addressedDetails: addressedData || null,
        };
      })
    );
let countQuery = `SELECT COUNT(*) as total 
    FROM user_freechat_requests ufr
      JOIN request_status rs ON ufr.status_id = rs.status_id`;

    if (conditions.length > 0) {
      countQuery += ` WHERE ` + conditions.join(" AND ");
    }
    const [countResult] = await connection.execute<CountResult[]>(countQuery, values);
    const totalCount = countResult[0]?.total || 0;
        
        return NextResponse.json({status:1,message:"All Dealership Enquiries List",data:enrichedRequests,pageNumber:page,
          total:totalCount,
          from: offset + 1,
          to: Math.min(offset + enrichedRequests.length, totalCount),
        });
    }catch(e){
        console.log(e);
        
        return NextResponse.json({status:0,message:"Exception Occured",error:e})
    }finally{
      if(connection!) connection.release; 
    }
}
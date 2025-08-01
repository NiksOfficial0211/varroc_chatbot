import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { RowDataPacket } from "mysql2";

interface CountResult extends RowDataPacket {
    total: number;
  }

export async function  POST(request:Request){
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized',message:"You are unauthorized" }, { status: 403 });
  }
    const body = await request.json();
    const { user_id } = body;
    let connection ;
    try{
        
        connection = await pool.getConnection();
        const [totalWarrantyRequestRows] = await connection.execute<CountResult[]>(
            'SELECT COUNT(*) AS total FROM user_warranty_requests'
          );
          const [totalComplaintRequests] = await connection.execute<CountResult[]>(
            'SELECT COUNT(*) AS total FROM user_complaint_requests'
          );
          const [totalDealershipRequest] = await connection.execute<CountResult[]>(
            'SELECT COUNT(*) AS total FROM user_dealership_request'
          );
        const [totalAddressedCount] = await connection.execute<CountResult[]>(
            'SELECT COUNT(*) AS total FROM user_request_addressed'
          );

          const [warrantyPendingRequests] = await connection.execute<CountResult[]>(
            'SELECT COUNT(*) AS total FROM user_warranty_requests where status_id=1'//1=pending
          );  
          const [complaintPendingRequests] = await connection.execute<CountResult[]>(
            'SELECT COUNT(*) AS total FROM user_complaint_requests where status_id=6'//6=pending
          ); 
          const [dealershipPendingRequests] = await connection.execute<CountResult[]>(
            'SELECT COUNT(*) AS total FROM user_dealership_request where status_id=10'//10=pending
          ); 
           const [generalPendingRequests] = await connection.execute<CountResult[]>(
            'SELECT COUNT(*) AS total FROM user_freechat_requests where status_id=14'//14=new
          );   
        const [userActivities] = await connection.execute(`SELECT 
                ua.pk_activity_id,ua.name,
                ua.phone,ua.request_type_id,
                ua.status_id,ua.request_id,
                ua.go_activity_id,
                rt.request_type AS request_type,
                rs.status AS request_status
                FROM user_activities ua
                JOIN request_types rt ON ua.request_type_id = rt.request_type_id 
                JOIN request_status rs ON ua.status_id = rs.status_id
                WHERE DATE(ua.created_at) = CURDATE()
                ORDER BY ua.created_at DESC
                
            `);
            
        return NextResponse.json({status:1,message:"Data Received",data:{
            total_Request:totalWarrantyRequestRows[0].total + totalComplaintRequests[0].total+totalDealershipRequest[0].total+generalPendingRequests[0].total,
            total_Warranty_Request:totalWarrantyRequestRows[0].total,
            addressed_count:totalAddressedCount[0].total,
            warranty_pending_request:warrantyPendingRequests[0].total,
            complaints_pending_request:complaintPendingRequests[0].total,
            business_pending_requests:dealershipPendingRequests[0].total,
            general_pending_requests:generalPendingRequests[0].total,
            activities:userActivities
        }});
    }catch(e){
        console.log(e);
        
        return NextResponse.json({status:0,message:"Exception Occured"})
    }
    finally{
    if (connection) connection.release();
  }
}
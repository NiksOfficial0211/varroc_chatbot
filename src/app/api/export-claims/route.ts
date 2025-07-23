import { funSendApiException } from "@/app/pro_utils/const_functions";
import { RowDataPacket } from "mysql2";
import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import pool from "../../../../utils/db";
import moment from "moment";


export async function POST(req: NextRequest) {


  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized',message:"You are unauthorized" }, { status: 403 });
  }
    const body = await req.json();
    const { date,request_id,phone_no,name,status,reject_id  } = body;
    
    try{
        const connection = await pool.getConnection();
   
        let query = `
              SELECT 
          ucr.pk_id,
          ucr.complaint__id,
          ucr.customer_name,
          ucr.battery_serial_no,
          ucr.user_phone,
          ucr.complaint_type,
          ucr.raised_whatsapp_no,
          ucr.complaint_description,
          ucr.status_id,
          ucr.addressed_by,
          ucr.created_at AS ucr_created_at,
          ucr.updated_at AS ucr_updated_at,

            rs.status AS request_status
          FROM user_complaint_requests ucr
          JOIN request_status rs ON ucr.status_id = rs.status_id
      `;

    // Dynamic WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];

    if (date) {
      conditions.push(`DATE(ucr.created_at) = ?`);
      values.push(date); // should be in 'YYYY-MM-DD' format
    }

    if (request_id) {
      conditions.push(`ucr.complaint__id = ?`);
      values.push(request_id);
    }

    if (phone_no) {
      conditions.push(`ucr.user_phone like ?`);
      values.push(`%${phone_no}%`);
    }
    if (status) {
      conditions.push(`ucr.status_id = ?`);
      values.push(status);
    }

    if (reject_id) {
      conditions.push(`ucr.fk_reject_id = ?`);
      values.push(reject_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY ucr.created_at ASC`;
    const [userRequests] = await connection.execute<RowDataPacket[]>(query, values);
    console.log("all user request data",userRequests);
    
    const enrichedRequests = await Promise.all(
      userRequests.map(async (request: any) => {
        // Example: Get battery info for each request
        let addressedQuery = 
          `SELECT
          ura.*,
          rt.request_type AS request_type,
          aut.username as addressedBY,
          rr.rejection_msg AS rejection_msg,
          rs.status AS request_status 
          FROM user_request_addressed ura
          JOIN auth aut ON ura.auth_user_id = aut.auth_id 
          JOIN request_types rt ON ura.request_type = rt.request_type_id 
          LEFT JOIN request_rejections rr ON ura.fk_rejection_id = rr.pk_reject_id 
          JOIN request_status rs ON ura.request_status = rs.status_id`;

        
        const conditions: string[] = [];
      const values: any[] = [];

    conditions.push(`ura.request_type = ?`);
      values.push("2"); 
      
      conditions.push(`ura.fk_request_id = ?`);
      values.push(request.pk_id); 
    
    if (conditions.length > 0) {
      addressedQuery += ` WHERE ura.request_type=2 ` + conditions.join(" AND ");
    }
    const [addressedData]=await connection.execute(addressedQuery,values)
        return {
          ...request,
          addressedDetails: addressedData || null,
        };
      })
    );

    // return NextResponse.json({data:enrichedRequests})

    const flatData = enrichedRequests.map((item:any,index:any) => ({
            sr_no: index+1,
            complaint__id:item.complaint__id,
            request_date:item.ucr_created_at?formatDate(item.ucr_created_at):'',
            customer_name:item.customer_name,
            customer_phone:item.user_phone,
            serial_no:item.battery_serial_no,
            complaint_type:item.complaint_type,
            complaint_detscription:item.complaint_description,
            request_status:item.request_status,
            whatsapp_number:item.raised_whatsapp_no,
            request_comments:item.addressedDetails && item.addressedDetails.length>0 && item.addressedDetails[0].comments?item.addressedDetails[0].comments:"--",
            requst_updated_date:item.ucr_updated_at?formatDate(item.ucr_updated_at):'',
            updated_by:item.addressedDetails && item.addressedDetails.length>0 && item.addressedDetails[0].addressedBY? item.addressedDetails[0].addressedBY:"--",
            master_serial_no:item.battery_serial_number,
            master_battery_model:item.battery_model,
            master_varroc_part_code:item.varroc_part_code,
            manufacturing_date:formatDateDDMMYYYY(item.manufacturing_date),
            proposed_mrp:item.proposed_mrp,
            description:item.battery_description,
      }));
          
    //-----------------------Convert data to CSV

    // return NextResponse.json({ status: 1, message: "Request received reference id sent to customer",data:flatData }, { status: 200 });

    const csv = Papa.unparse(flatData);
    

    // ---------------------Create response with headers
    return new NextResponse(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/xlsx",
            "Content-Disposition": 'attachment; filename="data.xlsx"',
        },
    });

}catch(e){
  console.log("export claims exception",e);
  
    return funSendApiException(e)
}
}


function formatDate(inputDate: string,timeZone = 'Asia/Kolkata') {
    const date = new Date(inputDate);

    const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value;
    return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')} ${get('dayPeriod')}`;
  }

  const formatDateDDMMYYYY = (date: any, isTime = false) => {
      if (!date) return '';
      const parsedDate = moment(date);
      return parsedDate.format('DD-MM-YYYY');
    };
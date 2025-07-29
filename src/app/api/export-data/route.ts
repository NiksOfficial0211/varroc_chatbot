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
    ua.pk_request_id,
    ua.request_id,
    ua.product_serial_no,
    ua.product_purchase_date,
    ua.user_name,
    ua.user_phone,
    ua.status_id,
    ua.request_type_id,
    ua.warranty_start_date,
    ua.warranty_end_date,
    ua.created_at AS ua_created_at,
    ua.updated_at AS ua_updated_at,
    rt.request_type AS request_type,
    rs.status AS request_status,
    
    pi.battery_serial_number,
    pi.battery_model,
    pi.varroc_part_code,
    pi.manufacturing_date,
    DATE_FORMAT(pi.manufacturing_date, '%Y-%m-%d') AS formatted_manufacturing_date,
    pi.proposed_mrp,
    pi.battery_description

  FROM user_warranty_requests ua
  JOIN request_types rt ON ua.request_type_id = rt.request_type_id 
  JOIN request_status rs ON ua.status_id = rs.status_id
  LEFT JOIN product_info pi ON pi.battery_serial_number = ua.product_serial_no
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

    query += ` ORDER BY ua.created_at ASC`;
    const [userRequests] = await connection.execute<RowDataPacket[]>(query, values);
    
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
      values.push("1"); 
      
      conditions.push(`ura.fk_request_id = ?`);
      values.push(request.pk_request_id); // should be in 'YYYY-MM-DD' format
    
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
    console.log(enrichedRequests);
    
    // return NextResponse.json({data:enrichedRequests})

    const flatData = enrichedRequests.map((item:any,index:any) => ({
            sr_no: index+1,
            request_id:item.request_id,
            request_date:formatDate(item.ua_created_at),
            customer_name:item.user_name,
            customer_phone:item.user_phone.length==10?"91"+item.user_phone:item.user_phone,
            serial_no:item.product_serial_no,
            purchase_date:formatDateDDMMYYYY(item.product_purchase_date),
            request_type:item.request_type,
            request_status:item.request_status,
            warranty_start_date:formatDateDDMMYYYY(item.warranty_start_date),
            warranty_end_date:formatDateDDMMYYYY(item.warranty_end_date),
            request_comments:item.addressedDetails && item.addressedDetails.length>0 && item.addressedDetails[0].comments?item.addressedDetails[0].comments:"",
            requst_updated_date:formatDate(item.ua_updated_at),
            updated_by:item.addressedDetails && item.addressedDetails.length>0 && item.addressedDetails[0].addressedBY? item.addressedDetails[0].addressedBY:"",
            master_serial_no:item.battery_serial_number,
            master_battery_model:item.battery_model,
            master_varroc_part_code:item.varroc_part_code,
            manufacturing_date:formatDateDDMMYYYY(item.manufacturing_date),
            proposed_mrp:item.proposed_mrp,
            description:item.battery_description,
      }));
    //-----------------------Convert data to CSV
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
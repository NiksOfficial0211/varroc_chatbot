import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../utils/db";
import db from "../../../../utils/db";
import { funSendApiException, parseForm } from "@/app/pro_utils/const_functions";


export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized',message:"You are unauthorized" }, { status: 403 });
  }

    const body = await request.json();
    const {isCSV,valid_data,invalid_data } = body;
    // const validRows = JSON.parse(valid_data);
    const validRows = valid_data;
    // const errorRows = JSON.parse(invalid_data);
    const errorRows = invalid_data;
    
    try{
       
        if (validRows.length) {
            await db.query(
                `INSERT INTO product_info 
                (created_by,battery_model, varroc_part_code, battery_serial_number, 
                manufacturing_date,battery_description,proposed_mrp,warranty,is_sold,created_at) VALUES ? 
                    ON DUPLICATE KEY UPDATE
                        created_by = VALUES(created_by),
                        battery_model = VALUES(battery_model),
                        varroc_part_code = VALUES(varroc_part_code),
                        manufacturing_date = VALUES(manufacturing_date),
                        battery_description = VALUES(battery_description),
                        proposed_mrp = VALUES(proposed_mrp),
                        warranty = VALUES(warranty),
                        is_sold = VALUES(is_sold),
                        created_at = VALUES(created_at)
                `,
                [validRows]
            );
        }

        if (errorRows.length) {
            await db.query(
                `INSERT INTO battery_upload_errors (rowNumber, message, rawData) VALUES ?`,
                [errorRows]
            );
        }
        const createdJson={
            "Total_valid_rows":validRows.length,
            "Total_invalid_rows":errorRows.length,
            "auth_id":validRows.length>0?validRows[0].auth_id:"",
            "valid_upload_start_serial_no":validRows.length>0?validRows[0].battery_serial_number:"",
            "invalid_upload_start_serial_no":errorRows.length>0?errorRows[0].battery_serial_number:"",
            "valid_upload_end_serial_no":validRows.length>0?validRows[validRows.length-1].battery_serial_number:"",
            "invalid_upload_end_serial_no":errorRows.length>0?errorRows[errorRows.length-1].battery_serial_number:"",
            
          }
        const insertLog = await db.query(
            `INSERT INTO logs (activity_type,change_json,created_at) VALUES (?,?,?)`,
            ["bulk Upload Data",JSON.stringify(createdJson),new Date()]
          );


        return NextResponse.json({status:1,message:"Data uploaded successfully"}, { status: 200 })

}catch(e){
    console.log(e);
    
    return funSendApiException(e);
}   

}


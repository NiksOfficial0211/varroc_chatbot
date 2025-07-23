import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import { funSendApiException } from "@/app/pro_utils/const_functions";

export async function POST(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
        return NextResponse.json({ error: "Unauthorized", message: "You are unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const connection = await pool.getConnection();
    try{
    const { pk_id, changedPinCode,update_type } = body;
    console.log();
    
    const cleanedPinCode =
        changedPinCode?.trim() !== '' ? changedPinCode.trim() : null;
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanedPinCode}`);
    const data = await res.json();
    let cleanedCityName = null;
    console.log("pin code response",res);
    console.log("pin code response",data);
    
    if (data[0]?.Status === "Success") {
        cleanedCityName = data[0].PostOffice?.[0]?.District;
    }else{
        return NextResponse.json({ status:0,success: false, message: "No city found for the pin code" }, { status: 200 });

    }

    let result:any;
    if(update_type==1){
    const [updateResult]= await connection.query(
        `UPDATE user_warranty_requests 
       SET user_pin_code=? ,
      retailer_city_name=? 
       WHERE pk_request_id = ?`,
        [cleanedPinCode, cleanedCityName, pk_id]
    );
    result=updateResult
}   else if(update_type==2){
    const [updateResult]= await connection.query(
        `UPDATE user_dealership_request 
       SET pincode=? ,
      city=? 
       WHERE pk_deal_id = ?`,
        [cleanedPinCode, cleanedCityName, pk_id]
    );
    result=updateResult
}else{
    const [updateResult]= await connection.query(
        `UPDATE user_freechat_requests 
       SET pincode=? ,
      city=? 
       WHERE pk_id = ?`,
        [cleanedPinCode, cleanedCityName, pk_id]
    );
    result=updateResult;

}
    console.log(result);
    
    if (result.affectedRows > 0 || result.changedRows === 0) {
            return NextResponse.json({status:1, success: true, message: "Update successful" }, { status: 200 });
        } else {
            return NextResponse.json({ status:0,success: false, message: "Failed to update city" }, { status: 200 });
        }
    }catch(e:any){
        return funSendApiException(e.message);
    } finally {
        connection.release();
    }
}
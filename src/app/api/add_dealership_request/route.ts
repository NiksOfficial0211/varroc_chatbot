import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../utils/db';
import { formatDateYYYYMMDD, generateComplaintID, generateDelearshipRequestID, generateMixedString, generateMixedStringWithNumbers, generateRequestID, parseForm, stableStringify } from '@/app/pro_utils/const_functions';
import { AddCommonLog, AddUserRequestActivity } from '@/app/pro_utils/db_add_requests';
import { ResultSetHeader } from 'mysql2';
import fs from "fs/promises";
import { writeFile } from "fs/promises";
import path from "path";
import { headers } from 'next/headers';
import { promises as fsPromises } from 'fs'; // <-- for promise-based methods like readFile
import { supabase } from '../../../../utils/supabaseClient';
import crypto from 'crypto';


interface fileURLInter {
  url: any;
  isInvoice: boolean
}

export async function POST(request: NextRequest) {

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized', message: "You are unauthorized" }, { status: 403 });
  }


 
  const body = await request.json();
  
  let connection;
  try{
  const normalized = stableStringify(body);
// 2. Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  
  connection = await pool.getConnection();
  const [hashPresent] = await connection.execute<any[]>(`SELECT hash_key FROM all_request_hash
                WHERE hash_key = ?
                `,[hash]);
  if(hashPresent.length == 0){              
  // try{
    const activityAdded = await AddCommonLog(null,null,"DealerShip Raised Body",body)
  // }catch(err){
  //   return NextResponse.json({ status: 0, error: err }, { status: 500 });
  // }


  const { whatsapp_number,full_name,contact_number,pincode,state_address,business_age,shop_type } = body;
    
  try {

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [hashPresent] = await connection.execute<any[]>(`INSERT INTO all_request_hash
                (hash_key,created_at) VALUES (?,?)
                `,[hash,new Date()]); 
    const [resultID] = await connection.execute<any[]>(`SELECT dealership_id FROM user_dealership_request
                WHERE DATE(created_at) >= CURDATE()
                ORDER BY created_at DESC
                LIMIT 1`);

    const requestIDstring = generateDelearshipRequestID(resultID)
     
      const cleanedWhatsAppNumber =
      whatsapp_number?.trim() !== '' ? whatsapp_number.trim() : null;

      const cleanedFullName =
      full_name?.trim() !== '' ? full_name.trim() : null;
      const cleanedContactNumber =
      contact_number?.trim() !== '' ? contact_number.trim() : null;
      const cleanedPincode =
      pincode?.trim() !== '' ? pincode.trim() : null;
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanedPincode}`);
      const data = await res.json();
      let cleanedCityName = null;

      if (data[0]?.Status === "Success") {
        cleanedCityName = data[0].PostOffice?.[0]?.District;
      }
      const cleanedState =
      state_address?.trim() !== '' ? state_address.trim() : null;
      const cleanedBusinessAge =
      business_age?.trim() !== '' ? business_age.trim() : null;
      const cleanedShopType =
      shop_type?.trim() !== '' ? shop_type.trim() : null;

    // const cleanedDate = convertDDMMYYYYtoYYYYMMDD(product_purchase_date.trim());
    const [insertRequest] = await connection.execute(
      `INSERT INTO user_dealership_request 
     (dealership_id,
      full_name, 
      alternate_contact,
      pincode, 
      city,
      state_address, 
      business_age,
      shop_type, 
      raised_whatsapp_no,
      status_id, 
      created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?)`,

      [
        requestIDstring,
        cleanedFullName,
        cleanedContactNumber,
        cleanedPincode,
        cleanedCityName,
        cleanedState,
        cleanedBusinessAge,
        cleanedShopType,
        cleanedWhatsAppNumber,
        10, // status_id (New)
        new Date(), // created_at
      ]
    );

    const result = insertRequest as ResultSetHeader;

    const [insertActivity] = await connection.execute(
            `INSERT INTO user_activities 
             (phone,
              request_type_id,
              status_id,
              request_id,
              go_activity_id,created_at)
             VALUES (?,?,?,?,?,?)`,
            [
                cleanedWhatsAppNumber,
                3,
                1,
                requestIDstring,
                result.insertId,
                new Date()//for created at date
            ]
        );
    
        const aisensyPayload = {
          "apiKey": process.env.NEXT_PUBLIC_AISENSY_API_KEY,
          "campaignName": "enquiry_form_id",
          "destination": `${cleanedWhatsAppNumber}`,
          "userName": "Varroc Aftermarket",
          "templateParams": [
            `${requestIDstring}`
          ],
          "source": "new-landing-page form",
          "media": {},
          "buttons": [],
          "carouselCards": [],
          "location": {},
          "attributes": {},
          "paramsFallbackValue": {
            "FirstName": "user"
          }
        }

        const aisensyApiRes = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aisensyPayload),
        });

        const aisensyApiJson = await aisensyApiRes.json();
        await connection.commit();
        if (aisensyApiJson.success == 'true') {
          await connection.query(
          `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
          ["Add DealerShip Request Reference ID ",null,3, JSON.stringify(aisensyPayload), new Date()]
        );
          return NextResponse.json({ status: 1, message: "Request received reference id sent to customer" });
        }
        else {
          await connection.query(
          `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
          ["Add DealerShip Request Send Reference ID Failed",null,3, JSON.stringify(aisensyPayload), new Date()]
        );
          return NextResponse.json({ status: 1, message: "Request received but message delivery failed to customer" });
        }
  
  }
  catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error('DB Error:', err);
    const cleanedWhatsAppNumber =
      whatsapp_number?.trim() !== '' ? whatsapp_number.trim() : null;
    const failedAisensyPayload = {
      "apiKey": process.env.NEXT_PUBLIC_AISENSY_API_KEY,
      "campaignName": "form_failed_warranty_reg",
      "destination": `${cleanedWhatsAppNumber}`,
      "userName": "Varroc Aftermarket",
      "templateParams": [],
      "source": "new-landing-page form",
      "media": {},
      "buttons": [],
      "carouselCards": [],
      "location": {},
      "attributes": {},
      "paramsFallbackValue": {}
    }
    const aisensyApiRes = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(failedAisensyPayload),
        });
    if(connection){    
    if(aisensyApiRes){
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add DealerShip Request DB add exception But Exception message sent",null,1, JSON.stringify(failedAisensyPayload), new Date()]
    );
    return NextResponse.json({ status: 0, error: err }, { status: 500 });
    }else{
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add DealerShip Request DB add exception But Exception message sent",null,1, JSON.stringify(failedAisensyPayload), new Date()]
    );
    return NextResponse.json({ status: 0, error: err }, { status: 500 });
    }
  }        
  }
}else{
      const activityAdded = await AddCommonLog(null,null,"DealerShip Raised Body duplicate entry",body);
        return NextResponse.json({ status: 1, message:"Already Request is Registered" }, { status: 200 });


}
}catch(e){
return NextResponse.json({ status: 0, error: e }, { status: 500 });
}finally{
    if (connection) connection.release();
  }

}









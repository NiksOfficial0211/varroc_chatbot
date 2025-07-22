import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../utils/db';
import { formatDateYYYYMMDD, generateComplaintID, generateDelearshipRequestID, generateGeneralRequestID, generateMixedString, generateMixedStringWithNumbers, generateRequestID, parseForm, stableStringify } from '@/app/pro_utils/const_functions';
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
  const [addHash] = await connection.execute<any[]>(`INSERT INTO all_request_hash
                (hash_key,created_at) VALUES (?,?)
                `,[hash,new Date()]); 

  const { whatsapp_number,full_name,contact_number,pincode,state_address,enquiry_description } = body;
    
  try {

    
    await connection.beginTransaction();
    

    const [resultID] = await connection.execute<any[]>(`SELECT general_id FROM user_freechat_requests
                WHERE DATE(created_at) >= CURDATE()
                ORDER BY created_at DESC
                LIMIT 1`);

    const requestIDstring = generateGeneralRequestID(resultID)
     
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
      const cleanedDescription =
      enquiry_description?.trim() !== '' ? enquiry_description.trim() : null;
      

    // const cleanedDate = convertDDMMYYYYtoYYYYMMDD(product_purchase_date.trim());
    const [insertRequest] = await connection.execute(
      `INSERT INTO user_freechat_requests 
     (general_id,
      whatsapp_no,
      customer_name, 
      contact_no,
      pincode, 
      city,
      state, 
      description,
      
      status_id, 
      created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?)`,

      [
        requestIDstring,
        cleanedWhatsAppNumber,
        cleanedFullName,
        cleanedContactNumber,
        cleanedPincode,
        cleanedCityName,
        cleanedState,
        cleanedDescription,
        14, // status_id (New)
        new Date(), // created_at
      ]
    );

    const result = insertRequest as ResultSetHeader;

    const [insertActivity] = await connection.execute(
            `INSERT INTO user_activities 
             (name,phone,
              request_type_id,
              status_id,
              request_id,
              go_activity_id,created_at)
             VALUES (?,?,?,?,?,?,?)`,
            [
                cleanedFullName,cleanedWhatsAppNumber,
                4,
                1,
                requestIDstring,
                result.insertId,
                new Date()//for created at date
            ]
        );
    
        const aisensyPayload = {
          "apiKey": process.env.NEXT_PUBLIC_AISENSY_API_KEY,
          "campaignName": "general_enquiry_id",
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
    const [hashPresent] = await connection.execute<any[]>(`SELECT hash_key FROM all_request_hash
                WHERE hash_key = ?
                `,[hash]);
  if(hashPresent.length == 0){ 
    const [addHash] = await connection.execute<any[]>(`INSERT INTO all_request_hash
                (hash_key,created_at) VALUES (?,?)
                `,[hash,new Date()]);
    }
    console.error('DB Error:', err);
    const cleanedWhatsAppNumber =
      whatsapp_number?.trim() !== '' ? whatsapp_number.trim() : null;
    const failedAisensyPayload = {
      "apiKey": process.env.NEXT_PUBLIC_AISENSY_API_KEY,
      "campaignName": "form_fail_technical_issue",
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

     const extendedPayload = {
        ...failedAisensyPayload,
        actualException: err,
        timestamp: new Date().toISOString()
      }   
    if(connection){    
    if(aisensyApiRes){
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add DealerShip Request DB add exception But Exception message sent",null,1, JSON.stringify(extendedPayload), new Date()]
    );
    return NextResponse.json({ status: 0, error: err }, { status: 500 });
    }else{
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add DealerShip Request DB add exception But Exception message sent",null,1, JSON.stringify(extendedPayload), new Date()]
    );
    return NextResponse.json({ status: 0, error: err }, { status: 500 });
    }
  }        
  }
}
else{
  
      const activityAdded = await AddCommonLog(null,null,"DealerShip Raised Body duplicate entry",body);
        return NextResponse.json({ status: 1, message:"Already Request is Registered" }, { status: 200 });


}
}catch(e){
return NextResponse.json({ status: 0, error: e }, { status: 500 });
}finally{
    if (connection) connection.release();
  }

}









import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../utils/db';
import { formatDateYYYYMMDD, generateMixedString, generateMixedStringWithNumbers, generateRequestID, parseForm, stableStringify } from '@/app/pro_utils/const_functions';
import { AddCommonLog, AddUserRequestActivity } from '@/app/pro_utils/db_add_requests';
import { ResultSetHeader } from 'mysql2';
import fs from "fs/promises";
import { writeFile } from "fs/promises";
import path from "path";
import { headers } from 'next/headers';
import { promises as fsPromises } from 'fs'; // <-- for promise-based methods like readFile
import { supabase } from '../../../../utils/supabaseClient';
import { initialRequestID } from '@/app/pro_utils/string_constants';
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

  let fileURL: fileURLInter[] = [{
    url: '',
    isInvoice: false
  }];
 
  const body = await request.json();
  const normalized = stableStringify(body);

// 2. Generate SHA-256 hash
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  let connection;
  connection = await pool.getConnection();
  const [hashPresent] = await connection.execute<any[]>(`SELECT hash_key FROM all_request_hash
                WHERE hash_key = ?
                `,[hash]);

if (hashPresent.length == 0) {
  const activityAdded = await AddCommonLog(null,null,"Request Raised Body",body)
  const [addHash] = await connection.execute<any[]>(`INSERT INTO all_request_hash
                (hash_key,created_at) VALUES (?,?)
                `,[hash,new Date()]);  
  const { whatsapp_number, user_name,
    retailer_shop_name,
    user_email,
    user_phone,
    user_pin_code,
    product_serial_no, product_purchase_date, invoice, battery_image, documents } = body;
    
  
  try {

    // connection = await pool.getConnection();
    await connection.beginTransaction();

    const [resultID] = await connection.execute<any[]>(`SELECT request_id FROM user_warranty_requests
                WHERE DATE(created_at) >= CURDATE()
                ORDER BY created_at DESC
                LIMIT 1`);

    // const today = new Date();
    // const yyyy_mm_dd = today.toISOString().slice(0, 10); // e.g., "2025-06-30"
    // const [resultID]=await connection.execute<any[]>(`SELECT latest_request_num FROM request_id_counter
    //                WHERE pk_id_date = ? AND request_type=?
    //                ORDER BY created_at DESC
    //                LIMIT 1`,[yyyy_mm_dd,1]);
    
    //    let nextNumber = "00000";
    //     let lastLefID;
    //     if (resultID.length > 0) {
    //       nextNumber = parseInt(resultID[0].latest_request_num) + 1+"";
    //       lastLefID=initialRequestID+"-"+resultID
    //       await connection.execute(
    //         `UPDATE request_id_counter SET latest_request_num = ? WHERE pk_id_date = ?`,
    //         [nextNumber, yyyy_mm_dd]
    //       );
    //     } else {
          
    //       await connection.execute(
    //         `INSERT INTO request_id_counter (pk_id_date, latest_request_num ,request_type) VALUES (?, ?,?)`,
    //         [yyyy_mm_dd, nextNumber,1]
    //       );
    //     }

    const requestIDstring = generateRequestID(resultID)


    const cleanedRetailerShopName =
      retailer_shop_name?.trim() !== '' ? retailer_shop_name.trim() : null;

    const cleanedPinCode =
      user_pin_code?.trim() !== '' ? user_pin_code.trim() : null;

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanedPinCode}`);
    const data = await res.json();
    let cleanedCityName = null;

    if (data[0]?.Status === "Success") {
      cleanedCityName = data[0].PostOffice?.[0]?.District;
    }
    const cleanedWhatsAppNumber =
      whatsapp_number?.trim() !== '' ? whatsapp_number.trim() : null;

    const cleanedUserName =
      user_name?.trim() !== '' ? user_name.trim() : null;

    const cleanedSerialNo =
      product_serial_no?.trim() !== '' ? product_serial_no.trim().toUpperCase() : null;

    const cleanedDate =
      product_purchase_date?.trim() !== ''
        ? product_purchase_date.trim()
        : null;

    const cleanedPhone =
      user_phone !== undefined && user_phone !== null ? parseInt(user_phone.length==10?"91"+user_phone:user_phone) : null;


    // const cleanedDate = convertDDMMYYYYtoYYYYMMDD(product_purchase_date.trim());
    const [insertRequest] = await connection.execute(
      `INSERT INTO user_warranty_requests 
     (request_id,
      user_name, 
      retailer_shop_name, 
      user_phone,
      raised_whatsapp_number, 
      user_pin_code,
      retailer_city_name, 
      product_serial_no, 
      product_purchase_date, 
      request_type_id,
      status_id,
      created_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,

      [
        requestIDstring,
        cleanedUserName,
        cleanedRetailerShopName,
        cleanedPhone,
        cleanedWhatsAppNumber,
        cleanedPinCode,
        cleanedCityName,
        cleanedSerialNo,
        cleanedDate,
        1, // request_type_id
        1, // status_id (pending)
        new Date(), // created_at
      ]
    );

    const result = insertRequest as ResultSetHeader;

    // const activityAdded = await AddUserRequestActivity(cleanedUserName, cleanedPhone, 1, 1, requestIDstring, result.insertId)
    // if (!activityAdded) {
    //   return NextResponse.json({ status: 0, message: "Failed to add user activity" });
    // }
    const [insertActivity] = await connection.execute(
            `INSERT INTO user_activities 
             (name,phone,
              request_type_id,
              status_id,
              request_id,
              go_activity_id,created_at)
             VALUES (?,?,?,?,?,?,?)`,
            [
                cleanedUserName,cleanedPhone,
                1,
                1,
                requestIDstring,
                result.insertId,
                new Date()//for created at date
            ]
        );
    let mediaUploadFialed=false;
    if (documents) {

      for (let i = 0; i < documents.length; i++) {
        const mediaRes = await fetch("https://apis.aisensy.com/project-apis/v1/project/6835984c7ce8780c0854abb2/get-media",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-AiSensy-Project-API-Pwd": "85b4ec6a26590dbbbc7ee"
            },
            body: JSON.stringify(
              {
                "id": documents[i].id,//"1344347393330195",
                "response_type": "document"
              }
            ),
          }
        );
        console.log("this is the rsponse from aisensy api media", mediaRes);

        if (mediaRes && mediaRes.ok) {
          const buffer = await mediaRes.arrayBuffer();
          console.log("this is the buffer from image", buffer);

          const fileBuffer = Buffer.from(buffer);

          // Optional: detect MIME type if needed
          const mime = mediaRes.headers.get("Content-Type"); // e.g. 'image/jpeg', 'application/pdf'
          const filename = `${documents[i].id}_${Date.now()}.${mime?.includes("pdf") ? "pdf" : "jpg"}`;

          // const currentMonthShort = new Date().toLocaleString('default', { month: 'short' });
          // const currentDate = getCurrentDateFormatted();
          
          // const dirPath = path.join(process.cwd(), "/uploads/warranty", currentMonthShort, currentDate);
          // await fs.mkdir(dirPath, { recursive: true });
          // const filePath = path.join(dirPath, filename);
          // await writeFile(filePath, fileBuffer);

          

          let bucket = "warranty";
          const contentType = mime || 'application/octet-stream';

          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filename, fileBuffer, {
              contentType,
              upsert: true,
            });

          if (error) {
            console.error("Upload error:", error);
          }
          const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filename);
          console.log("this is the supabase upload url", publicUrlData);

          // const [insertImagesURL] = await connection.execute(
          //   `INSERT INTO user_request_attachements (
          //       fk_request_id,aisensy_image_id,image_url,is_invoice,created_at
          //       ) VALUES (?,?, ?, ?, ?)`, [result.insertId, documents[i].id, filePath, false, new Date()]
          // );

          const [insertImagesURL] = await connection.execute(
            `INSERT INTO user_request_attachements (
                fk_request_id,aisensy_image_id,image_url,is_invoice,created_at
                ) VALUES (?,?, ?, ?, ?)`, [result.insertId, documents[i].id, publicUrlData.publicUrl, false, new Date()]
          );
        } else {
          mediaUploadFialed=true;
        }
      }

    }
      if(mediaUploadFialed){
          await connection.rollback();
          
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
          if (aisensyApiRes && aisensyApiRes.ok) {
                      await connection.query(
                `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
                ["Add Warranty Request Media Upload failed message ",null,1, JSON.stringify(failedAisensyPayload), new Date()]
              );
              connection.release();
              return NextResponse.json({ status: 0, message: "Failed to get and upload images"}, { status: 200 });
          }else{
            await connection.query(
                  `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
                  ["Add Warranty Request Media Upload failed send message failed",null,1, JSON.stringify(failedAisensyPayload), new Date()]
                );
                connection.release();
              return NextResponse.json({ status: 0, message: "Failed to get and upload images"}, { status: 200 });
          }
          
      }else{

    const aisensyPayload = {
      "apiKey": process.env.NEXT_PUBLIC_AISENSY_API_KEY,
      "campaignName": "REG_WARRANTY_ID",
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
    console.log(aisensyPayload);

    const aisensyApiRes = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aisensyPayload),
    });

    const aisensyApiJson = await aisensyApiRes.json();
    console.log("Aisensy response:", result);
    await connection.commit();
    if (aisensyApiJson.success == 'true') {
       await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add Warranty Request Send Reference ID ",null,1, JSON.stringify(aisensyPayload), new Date()]
    );
    connection.release();
      return NextResponse.json({ status: 1, message: "Request received reference id sent to customer" }, { status: 200 });
    }
    else {
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add Warranty Request Send Reference ID Failed",null,1, JSON.stringify(aisensyPayload), new Date()]
    );
    connection.release();
      return NextResponse.json({ status: 1, message: "Request received but message delivery failed to customer" }, { status: 200 });

    }
  }
  }
  catch (err) {
    if (connection) {
      await connection.rollback();
    }
    const [addHash] = await connection.execute<any[]>(`INSERT INTO all_request_hash
                (hash_key,created_at) VALUES (?,?)
                `,[hash,new Date()]);
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
      ["Add Warranty Request DB add exception But Exception message sent",null,1, JSON.stringify(extendedPayload), new Date()]
    );
    return NextResponse.json({ status: 0, error: err }, { status: 500 });
    }else{
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add Warranty Request DB add exception But Exception message sent",null,1, JSON.stringify(extendedPayload), new Date()]
    );
    return NextResponse.json({ status: 0, error: err }, { status: 500 });
    }
  }    
  }finally{
    if (connection) connection.release();
  }
}else{
  
  const activityAdded = await AddCommonLog(null,null,"Request Raised Body Duplicate Entry",body);
  return NextResponse.json({ status: 1, message:"Already Request is Registered" }, { status: 200 });

}

}

function getCurrentDateFormatted(): string {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const yyyy = today.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}












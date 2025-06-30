import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../utils/db';
import { formatDateYYYYMMDD, generateComplaintID, generateMixedString, generateMixedStringWithNumbers, generateRequestID, parseForm } from '@/app/pro_utils/const_functions';
import { AddCommonLog, AddUserRequestActivity } from '@/app/pro_utils/db_add_requests';
import { ResultSetHeader } from 'mysql2';
import fs from "fs/promises";
import { writeFile } from "fs/promises";
import path from "path";
import { headers } from 'next/headers';
import { promises as fsPromises } from 'fs'; // <-- for promise-based methods like readFile
import { supabase } from '../../../../utils/supabaseClient';


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
  // try{
    const activityAdded = await AddCommonLog(null,null,"Complaint Raised Body",body)
  // }catch(err){
  //   return NextResponse.json({ status: 0, error: err }, { status: 500 });
  // }
  const { whatsapp_number,user_phone,serial_number,
    complaint_type, complaint_description, same_mobile, documents } = body;
    
  let connection;
  try {

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [resultID] = await connection.execute<any[]>(`SELECT complaint__id FROM user_complaint_requests
                WHERE DATE(created_at) = CURDATE()
                ORDER BY created_at DESC
                LIMIT 1`);

    const requestIDstring = generateComplaintID(resultID)

    const cleanedWhatsAppNumber =
      whatsapp_number?.trim() !== '' ? whatsapp_number.trim() : null;

    const cleanedSerialNo =
      serial_number?.trim() !== '' ? serial_number.trim().toUpperCase() : null;

    const cleanedComplaintType =
      complaint_type?.trim() !== ''
        ? complaint_type.trim()
        : null;
    const cleanedComplaintDesc =
     complaint_description && complaint_description.length>0 ? complaint_description?.trim() !== ''
        ? complaint_description.trim()
        : null:null;

    const cleanedPhone =
      user_phone !== undefined && user_phone !== null ? parseInt(user_phone) : null;


    // const cleanedDate = convertDDMMYYYYtoYYYYMMDD(product_purchase_date.trim());
    const [insertRequest] = await connection.execute(
      `INSERT INTO user_complaint_requests 
     (complaint__id,
      battery_serial_no, 
      same_number, 
      user_phone,
      complaint_type, 
      complaint_description,
      raised_whatsapp_no, 
      status_id, 
      created_at)
   VALUES (?,?,?,?,?,?,?,?,?)`,

      [
        requestIDstring,
        cleanedSerialNo,
        parseInt(same_mobile),
        cleanedPhone,
        cleanedComplaintType,
        cleanedComplaintDesc,
        cleanedWhatsAppNumber,
        6, // status_id (New)
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
                2,
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
                "response_type": "stream"
              }
            ),
          }
        );

        if (mediaRes && mediaRes.ok) {
          const buffer = await mediaRes.arrayBuffer();

          const fileBuffer = Buffer.from(buffer);

          // Optional: detect MIME type if needed
          const mime = mediaRes.headers.get("Content-Type"); // e.g. 'image/jpeg', 'application/pdf'
          const filename = `${documents[i].id}_${Date.now()}.${mime?.includes("pdf") ? "pdf" : "jpg"}`;

          // const currentMonthShort = new Date().toLocaleString('default', { month: 'short' });
          // const currentDate = getCurrentDateFormatted();

          // const filePath = path.join(process.cwd(), "/uploads/warranty", `${currentMonthShort}/${currentDate}`, filename);
          // await writeFile(filePath, fileBuffer);

          let bucket = "complaint";
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

          // const [updateDocURL] = await connection.execute(
          //   `UPDATE user_complaint_requests SET document_id=?,document_url=? WHERE pk_id=?`,[documents[i].id,filePath,result.insertId]
          // );
          // const [insertImagesURL] = await connection.execute(
          //   `INSERT INTO user_request_attachements (
          //       fk_request_id,aisensy_image_id,image_url,is_invoice,created_at
          //       ) VALUES (?,?, ?, ?, ?)`, [result.insertId, documents[i].id, filePath, false, new Date()]

          const [insertImagesURL] = await connection.execute(
            `INSERT INTO user_request_attachements (
                fk_request_id,aisensy_image_id,image_url,is_invoice,created_at
                ) VALUES (?,?, ?, ?, ?)`, [result.insertId, documents[i].id, publicUrlData.publicUrl, false, new Date()]
          );
          // const [updateDocURL] = await connection.execute(
          //   `UPDATE user_complaint_requests SET document_id = ?, document_url = ? WHERE pk_id=?`,[documents[i].id,publicUrlData.publicUrl,result.insertId]
          // );
        } else {
          mediaUploadFialed=true;
        }
      }

    }
      if(mediaUploadFialed){
          await connection.rollback();
          
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
          if (aisensyApiRes && aisensyApiRes.ok) {
                      await connection.query(
                `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
                ["Add Complaint Request Media Upload failed message ",null,1, failedAisensyPayload, new Date()]
              );
              connection.release();
              return NextResponse.json({ status: 0, message: "Failed to get and upload images"});
          }else{
            await connection.query(
                  `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
                  ["Add Complaint Request Media Upload failed send message failed",null,1, failedAisensyPayload, new Date()]
                );
                connection.release();
              return NextResponse.json({ status: 0, message: "Failed to get and upload images"});
          }
          connection.release();
        return NextResponse.json({ status: 1, message: "Request received but message delivery failed to customer" },{status:200});

      }else{
        const aisensyPayload = {
          "apiKey": process.env.NEXT_PUBLIC_AISENSY_API_KEY,
          "campaignName": "final_reference_id",
          "destination": `${cleanedWhatsAppNumber}`,
          "userName": "Varroc Aftermarket",
          "templateParams": [
            "Warranty Claim",
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
      ["Add Complaint Request Reference ID ",null,1, JSON.stringify(aisensyPayload), new Date()]
    );
      connection.release();
      return NextResponse.json({ status: 1, message: "Request received reference id sent to customer" });
    }
    else {
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add Complaint Request Send Reference ID Failed",null,1, JSON.stringify(aisensyPayload), new Date()]
    );
    connection.release();
      return NextResponse.json({ status: 1, message: "Request received but message delivery failed to customer" });

    }


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
      ["Add Complaint Request DB add exception But Exception message sent",null,1, JSON.stringify(failedAisensyPayload), new Date()]
    );
    return NextResponse.json({ status: 0, error: err }, { status: 500 });
    }else{
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add Complaint Request DB add exception But Exception message sent",null,1, JSON.stringify(failedAisensyPayload), new Date()]
    );
    return NextResponse.json({ status: 0, error: err }, { status: 500 });
    }
  }    
  
    
  }finally{
    if (connection) connection.release();
  }

}









// import { NextRequest, NextResponse } from 'next/server';
// import pool from '../../../../utils/db';
// import { generateRequestID, parseForm } from '@/app/pro_utils/const_functions';
// import { AddUserRequestActivity } from '@/app/pro_utils/db_add_requests';
// import { ResultSetHeader } from 'mysql2';
// import { promises as fsPromises } from 'fs'; // <-- for promise-based methods like readFile
// import fetch from 'node-fetch';
// import fs from 'fs';
// import FormData from 'form-data';
// import { supabase } from '../../../../utils/supabaseClient';


// interface fileURLInter {
//   url: any;
//   isInvoice: boolean
// }
// type FileUploadResponseType = {
//   documentURL: string;
//   error?: string;
// };
// interface MyUploadedFile {
//   originalFilename: string;
//   mimetype: string;
//   path: string; // ✅ this matches the actual file object
//   size: number;
//   newFilename: string;
// }

// export async function POST(request: NextRequest) {

//   const authHeader = request.headers.get('authorization');
//   const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

//   if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
//     return NextResponse.json({ error: 'Unauthorized', message: "You are unauthorized" }, { status: 403 });
//   }

//   let fileURL: fileURLInter[] = [{
//     url: '',
//     isInvoice: false
//   }];
//   try {

//     const { fields, files } = await parseForm(request);
//     console.log(files);

//     if (files && files.invoice && files.battery_image) {


//       const invoiceFile = files.invoice?.[0] as unknown as MyUploadedFile;
//       const batteryFile = files.battery_image?.[0] as unknown as MyUploadedFile;

//       if (!invoiceFile && !batteryFile) {
//         return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//       }

//       let bucket = "warranty";
//       if (fields.requestType?.[0] === "2") bucket = "complaint";
//       else if (fields.requestType?.[0] !== "1") bucket = "lead-req";

//       const uploadToSupabase = async (file: MyUploadedFile, isInvoice: boolean) => {
//         const buffer = await fsPromises.readFile(file.path);
//         const filename = `${Date.now()}-${file.originalFilename}`;
//         const contentType = file.mimetype || 'application/octet-stream';

//         const { data, error } = await supabase.storage
//           .from(bucket)
//           .upload(filename, buffer, {
//             contentType,
//             upsert: true,
//           });

//         if (error) {
//           console.error("Upload error:", error);
//           throw new Error(error.message);
//         }

//         const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filename);

//         return {
//           url: publicUrlData.publicUrl,
//           isInvoice,
//         };
//       };

//       // Build the fileURL array dynamically
//       let fileURL: fileURLInter[] = [];

//       try {
//         if (invoiceFile) {
//           const uploaded = await uploadToSupabase(invoiceFile, true);
//           fileURL.push(uploaded);
//         }
//         if (batteryFile) {
//           const uploaded = await uploadToSupabase(batteryFile, false);
//           fileURL.push(uploaded);
//         }
//       } catch (err) {
//         return NextResponse.json({ message: "Upload failed", error: (err as Error).message }, { status: 500 });
//       }
//     }

//     const connection = await pool.getConnection();
//     const [resultID] = await connection.execute<any[]>(`SELECT request_id FROM user_warranty_requests
//                 WHERE DATE(created_at) = CURDATE()
//                 ORDER BY created_at DESC
//                 LIMIT 1`);
//     // return NextResponse.json({ status: 1, message: "Request Received", data: request_id });
//     console.log(resultID);

//     const requestIDstring = generateRequestID(resultID)
//     console.log("dkjahdhgaq-a-dfs-af-adf-as-f-asf-as-d", requestIDstring);

//     const rawDate = (fields.product_purchase_date?.[0] ?? '')
//       .trim()
//       .replace(/['",]/g, '')  // remove ' " and , characters
//       .replaceAll('/', '-');
//     const cleanedDate = convertDDMMYYYYtoYYYYMMDD(rawDate);

//     console.log(cleanFieldValue(fields.user_name?.[0].trim()),
//       cleanFieldValue(fields.user_company_name?.[0].trim()),
//       cleanFieldValue(fields.user_email?.[0].trim() ?? ''),
//       cleanFieldValue(fields.user_address?.[0].trim() ?? ''),
//       cleanFieldValue(fields.product_serial_no?.[0].trim()),);

//     const [insertRequest] = await connection.execute(
//       `INSERT INTO user_warranty_requests 
//          (request_id,
//          user_name, 
//          user_company_name, 
//          user_email, 
//          user_phone, 
//          user_address, 
//          product_serial_no, 
//          product_purchase_date, 
//          request_type_id,
//          status_id,
//          created_at)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         requestIDstring,
//         cleanFieldValue(fields.user_name?.[0].trim()),
//         fields.user_company_name?.[0] ? cleanFieldValue(fields.user_company_name?.[0].trim()) : null,
//         fields.user_email?.[0] ? cleanFieldValue(fields.user_email?.[0].trim()) : null,
//         parseInt(cleanFieldValue(fields.user_phone?.[0].trim())), // 
//         fields.user_address?.[0] ? cleanFieldValue(fields.user_address?.[0].trim()) : null,
//         fields.product_serial_no?.[0] ? cleanFieldValue(fields.product_serial_no?.[0].trim()) : null,
//         cleanedDate,
//         1,//(New request goes in pending state)
//         1,//pending status
//         new Date()//for created at date
//       ]
//     );
//     const result = insertRequest as ResultSetHeader;
//     console.log(result);
//     if (fileURL.length > 0) {
//       for (let i = 0; i < fileURL.length; i++) {
//         if (fileURL[i].url.length > 0) {
//           const [insertImagesURL] = await connection.execute(
//             `INSERT INTO user_request_attachements (
//         fk_request_id,image_url,is_invoice,created_at
//          ) VALUES (?, ?, ?, ?)`, [result.insertId, fileURL[i].url, fileURL[i].isInvoice, new Date()]
//           )
//         }
//       }
//     }


//     const activityAdded = await AddUserRequestActivity(cleanFieldValue(fields.user_name?.[0].trim()), parseInt(cleanFieldValue(fields.user_phone?.[0].trim())), 1, 1, requestIDstring, result.insertId)
//     if (!activityAdded) {
//       return NextResponse.json({ status: 0, message: "Failed to add user activity" });
//     }
//     return NextResponse.json({ status: 1, message: "Request Received" });

//   } catch (err) {
//     console.error('DB Error:', err);
//     return NextResponse.json({ status: 0, error: 'Database error' }, { status: 500 });
//   }

// }


// function convertDDMMYYYYtoYYYYMMDD(dateStr: string): string {
//   console.log("thijfojsdnfjlnsdf ----------------", dateStr);

//   if (!/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return ''; // expect 27-06-2025
//   const [day, month, year] = dateStr.split('-');
//   return `${year}-${month}-${day}`;
// }

// function cleanFieldValue(value?: string): string {
//   if (!value) return '';
//   return value
//     .trim()
//     .replace(/^["',]+|["',]+$/g, '') // Removes leading/trailing quotes and commas
//     .trim();
// }




import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../utils/db';
import { formatDateYYYYMMDD, generateMixedString, generateMixedStringWithNumbers, generateRequestID, parseForm } from '@/app/pro_utils/const_functions';
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
  const activityAdded = await AddCommonLog(null,null,"Request Raised Body",body)

  const { whatsapp_number, user_name,
    retailer_shop_name,
    user_email,
    user_phone,
    user_pin_code,
    product_serial_no, product_purchase_date, invoice, battery_image, documents } = body;
    
  let connection;
  try {

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [resultID] = await connection.execute<any[]>(`SELECT request_id FROM user_warranty_requests
                WHERE DATE(created_at) = CURDATE()
                ORDER BY created_at DESC
                LIMIT 1`);
    const requestIDstring = generateRequestID(resultID)


    const cleanedRetailerShopName =
      retailer_shop_name?.trim() !== '' ? retailer_shop_name.trim() : null;

    // const cleanedUserEmail =
    //   user_email?.trim() !== '' ? user_email.trim() : null;

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
      user_phone !== undefined && user_phone !== null ? parseInt(user_phone) : null;


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
                "response_type": "stream"
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

          // const filePath = path.join(process.cwd(), "/uploads/warranty", `${currentMonthShort}/${currentDate}`, filename);
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
                ["Add Warranty Request Media Upload failed message ",null,1, failedAisensyPayload, new Date()]
              );
              connection.release();
              return NextResponse.json({ status: 0, message: "Failed to get and upload images"});
          }else{
            await connection.query(
                  `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
                  ["Add Warranty Request Media Upload failed send message failed",null,1, failedAisensyPayload, new Date()]
                );
                connection.release();
              return NextResponse.json({ status: 0, message: "Failed to get and upload images"});
          }
          
      }else{

    const aisensyPayload = {

      "apiKey": process.env.NEXT_PUBLIC_AISENSY_API_KEY,
      "campaignName": "reference_id_message",
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
      ["Add Warranty Request Send Reference ID ",null,1, aisensyPayload, new Date()]
    );
    connection.release();
      return NextResponse.json({ status: 1, message: "Request received reference id sent to customer" });
    }
    else {
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add Warranty Request Send Reference ID Failed",null,1, aisensyPayload, new Date()]
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
      ["Add Warranty Request DB add exception But Exception message sent",null,1, failedAisensyPayload, new Date()]
    );
    }else{
      await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Add Warranty Request DB add exception But Exception message sent",null,1, failedAisensyPayload, new Date()]
    );
    }
  }    
  
    return NextResponse.json({ status: 0, error: 'Database error' }, { status: 500 });
  }finally{
    if (connection) connection.release();
  }

}









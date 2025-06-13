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
import { AddUserRequestActivity } from '@/app/pro_utils/db_add_requests';
import { ResultSetHeader } from 'mysql2';
import fs from "fs/promises";

interface fileURLInter{
  url:any;
  isInvoice:boolean
}

export async function POST(request: NextRequest) {

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized',message:"You are unauthorized" }, { status: 403 });
  }

  let fileURL:fileURLInter[]=[{
    url: '',
    isInvoice: false
  }];
  // try {

  //   const { fields, files } = await parseForm(request);
  //   console.log(files);

  //   if (files) {
  //     for (const [fieldKey, fileArray] of Object.entries(files)) {
  //       for (const file of fileArray) {

  //         const fileBuffer = await fs.readFile(file.path); // Read file from temp path

  //         const fileBlob = new Blob([new Uint8Array(fileBuffer)], {
  //           type: file.headers['content-type'],
  //         });
  //         const formData = new FormData();
  //         formData.append("requestType", "1");
  //         formData.append("file", fileBlob, file.originalFilename);
  //         const fileUploadURL = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "/api/upload_files", {
  //           method: "POST",
  //           // headers:{"Content-Type":"multipart/form-data"},
  //           body: formData,
  //         });

  //         const fileUploadResponse = await fileUploadURL.json();
  //         console.log(fileUploadResponse);
  //         if(file.fieldName=='invoice'){
  //         fileURL.push({url:fileUploadResponse.documentURL,isInvoice:true})
  //         }else{
  //           fileURL.push({url:fileUploadResponse.documentURL,isInvoice:false})

  //         }
  //         if (fileUploadResponse.error) {
  //           return NextResponse.json({ error: "File upload api call error" }, { status: 500 });
  //         }
  //       }
  //     }
  //   }

  //   // const formatPurchaseDate = formatDateYYYYMMDD(fields.product_purchase_date[0]);
  //   const connection = await pool.getConnection();
  //   const [resultID] = await connection.execute<any[]>(`SELECT request_id FROM user_warranty_requests
  //               WHERE DATE(created_at) = CURDATE()
  //               ORDER BY created_at DESC
  //               LIMIT 1`);
  //   // return NextResponse.json({ status: 1, message: "Request Received", data: request_id });
  //   console.log(resultID);
    
  //   const requestIDstring = generateRequestID(resultID)
  //   console.log("dkjahdhgaq-a-dfs-af-adf-as-f-asf-as-d",requestIDstring);
    
  //   const rawDate = (fields.product_purchase_date?.[0] ?? '')
  //     .trim()
  //     .replace(/['",]/g, '')  // remove ' " and , characters
  //     .replaceAll('/', '-');
  //   const cleanedDate = convertDDMMYYYYtoYYYYMMDD(rawDate);

  //   console.log(cleanFieldValue(fields.user_name?.[0].trim()),
  //   cleanFieldValue(fields.user_company_name?.[0].trim()),
  //   cleanFieldValue(fields.user_email?.[0].trim() ?? ''),
  //   cleanFieldValue(fields.user_address?.[0].trim() ?? ''),
  //   cleanFieldValue(fields.product_serial_no?.[0].trim()),);
    
  //   const [insertRequest] = await connection.execute(
  //     `INSERT INTO user_warranty_requests 
  //        (request_id,
  //        user_name, 
  //        user_company_name, 
  //        user_email, 
  //        user_phone, 
  //        user_address, 
  //        product_serial_no, 
  //        product_purchase_date, 
  //        request_type_id,
  //        status_id,
  //        created_at)
  //        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  //     [
  //       requestIDstring,
  //       cleanFieldValue(fields.user_name?.[0].trim()),
  //       fields.user_company_name?.[0]? cleanFieldValue(fields.user_company_name?.[0].trim()): null,
  //       fields.user_email?.[0] ? cleanFieldValue(fields.user_email?.[0].trim()): null,
  //       parseInt(cleanFieldValue(fields.user_phone?.[0].trim())), // 
  //       fields.user_address?.[0]? cleanFieldValue(fields.user_address?.[0].trim()) : null,
  //       fields.product_serial_no?.[0]? cleanFieldValue(fields.product_serial_no?.[0].trim()):null,
  //       cleanedDate,
  //       1,//(New request goes in pending state)
  //       1,//pending status
  //       new Date()//for created at date
  //     ]
  //   );
  //   const result = insertRequest as ResultSetHeader;
  //   console.log(result);
  //   for(let i=0;i<fileURL.length;i++){
  //     if(fileURL[i].url.length>0){
  //     const [insertImagesURL]= await connection.execute(
  //       `INSERT INTO user_request_attachements (
  //       fk_request_id,image_url,is_invoice,created_at
  //        ) VALUES (?, ?, ?, ?)`,[result.insertId,fileURL[i].url,fileURL[i].isInvoice,new Date()]
  //     )
  //   }
  //   }
   
    
  //   const activityAdded = await AddUserRequestActivity(cleanFieldValue(fields.user_name?.[0].trim()),parseInt(cleanFieldValue(fields.user_phone?.[0].trim())), 1, 1, requestIDstring, result.insertId)
  //   if (!activityAdded) {
  //     return NextResponse.json({ status: 0, message: "Failed to add user activity" });
  //   }
  //   return NextResponse.json({ status: 1, message: "Request Received" });

  // } 
  
  try{
    const body = await request.json();
        const connection = await pool.getConnection();

    const [resultID] = await connection.execute<any[]>(`SELECT request_id FROM user_warranty_requests
                WHERE DATE(created_at) = CURDATE()
                ORDER BY created_at DESC
                LIMIT 1`);
    const requestIDstring = generateRequestID(resultID)
    const {user_name,
        user_company_name,
        user_email,
        user_phone,
        user_address,
        product_serial_no,product_purchase_date } = body;

     const rawDate = (product_purchase_date)
      .trim()
      .replace(/['",]/g, '')  // remove ' " and , characters
      .replaceAll('/', '-');
    const cleanedDate = convertDDMMYYYYtoYYYYMMDD(rawDate);
       const [insertRequest] = await connection.execute(
      `INSERT INTO user_warranty_requests 
         (request_id,
         user_name, 
         user_company_name, 
         user_email, 
         user_phone, 
         user_address, 
         product_serial_no, 
         product_purchase_date, 
         request_type_id,
         status_id,
         created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      // [
      //   requestIDstring,
      //   cleanFieldValue(user_name),
      //   user_company_name && user_company_name.length>0? cleanFieldValue(user_company_name): null,
      //   user_email && user_email.length>0 ? cleanFieldValue(user_email): null,
      //   parseInt(cleanFieldValue(user_phone)), // 
      //   user_address && user_address.length>0? cleanFieldValue(user_address) : null,
      //   product_serial_no? cleanFieldValue(product_serial_no.trim()):null,
      //   cleanedDate,
      //   1,//(New request goes in pending state)
      //   1,//pending status
      //   new Date()//for created at date
      // ]
      [
        requestIDstring,user_name,user_company_name,user_email,user_phone,user_address,product_serial_no,cleanedDate,1,1,new Date()
      ]
    );
    const result = insertRequest as ResultSetHeader;
    console.log(result);
    for(let i=0;i<fileURL.length;i++){
      if(fileURL[i].url.length>0){
      const [insertImagesURL]= await connection.execute(
        `INSERT INTO user_request_attachements (
        fk_request_id,image_url,is_invoice,created_at
         ) VALUES (?, ?, ?, ?)`,[result.insertId,fileURL[i].url,fileURL[i].isInvoice,new Date()]
      )
    }
    }
   
    
    const activityAdded = await AddUserRequestActivity(user_name,parseInt(user_phone), 1, 1, requestIDstring, result.insertId)
    if (!activityAdded) {
      return NextResponse.json({ status: 0, message: "Failed to add user activity" });
    }
    return NextResponse.json({ status: 1, message: "Request Received" });

  }
  catch (err) {
    console.error('DB Error:', err);
    return NextResponse.json({ status: 0, error: 'Database error' }, { status: 500 });
  }

}


function convertDDMMYYYYtoYYYYMMDD(dateStr: string): string {
  console.log("thijfojsdnfjlnsdf ----------------",dateStr);
  
  if (!/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return ''; // expect 27-06-2025
  const [day, month, year] = dateStr.split('-');
  return `${year}-${month}-${day}`;
}

function cleanFieldValue(value?: string): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/^["',]+|["',]+$/g, '') // Removes leading/trailing quotes and commas
    .trim();
}






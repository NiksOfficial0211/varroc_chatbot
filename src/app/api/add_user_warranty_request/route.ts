import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../utils/db';
import {generateRequestID, parseForm } from '@/app/pro_utils/const_functions';
import { AddUserRequestActivity } from '@/app/pro_utils/db_add_requests';
import { ResultSetHeader } from 'mysql2';
import { promises as fsPromises } from 'fs'; // <-- for promise-based methods like readFile
import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import { supabase } from '../../../../utils/supabaseClient';


interface fileURLInter{
  url:any;
  isInvoice:boolean
}
type FileUploadResponseType = {
  documentURL: string;
  error?: string;
};
interface MyUploadedFile {
  originalFilename: string;
  mimetype: string;
  filepath: string;
  size: number;
  newFilename: string;
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
  try {

    const { fields, files } = await parseForm(request);
    console.log(files);

//     if (files) {
//       for (const [fieldKey, fileArray] of Object.entries(files)) {
//         for (const file of fileArray) {

//           const fileBuffer = await fsPromises.readFile(file.path); // Read file from temp path

//           // const fileBlob = new Blob([new Uint8Array(fileBuffer)], {
//           //   type: file.headers['content-type'],
//           // });
//           const formData = new FormData();
//           formData.append("requestType", "1");
// //           const fileBlob = new Blob([new Uint8Array(fileBuffer)], {
// //             type: file.headers['content-type'],
// //           });
// //           formData.append("file", fileBlob, file.originalFilename);
//           // formData.append('file', fs.createReadStream(file.path), file.originalFilename);

//           // formData.append("file", fileBlob, file.originalFilename);

//           formData.append("file", fs.createReadStream(file.path), {
//             filename: file.originalFilename,
//             contentType: file.headers['content-type'],
//           });
//           const fileUploadURL = await fetch(process.env.NEXT_PUBLIC_BASE_URL + "/api/upload_files", {
//             method: 'POST',
//             body: formData,
//             headers: formData.getHeaders(),
//           });

//           const fileUploadResponse = await fileUploadURL.json() as FileUploadResponseType;
//           console.log(fileUploadResponse);
//           if (!fileUploadResponse || typeof fileUploadResponse !== 'object' || !('documentURL' in fileUploadResponse)) {
//             return NextResponse.json({ status:0,error: "Invalid file upload response" ,message:fileUploadResponse}, { status: 500 });
//           }
//            if(file.fieldName=='invoice'){
//           fileURL.push({url:fileUploadResponse.documentURL,isInvoice:true})
//           }else{
//             fileURL.push({url:fileUploadResponse.documentURL,isInvoice:false})

//           }
//           if (fileUploadResponse.error) {
//             return NextResponse.json({ error: "File upload api call error",message: fileUploadResponse.error}, { status: 500 });
//           }
//         }
//       }
//     }

    // const formatPurchaseDate = formatDateYYYYMMDD(fields.product_purchase_date[0]);
    
    
    // const uploadedFile = files.file[0] as unknown as MyUploadedFile;
    //     const tempFilePath = uploadedFile.filepath;
    //     const buffer = await fsPromises.readFile(tempFilePath); // Read temp file as Buffer
    
    //     const filename = `${Date.now()}-${uploadedFile.originalFilename}`;
    //     // if (uploadedFile.size > 5 * 1024 * 1024) {
    //     //   return NextResponse.json({ error: "File too large" }, { status: 400 });
    //     // }
    //     let bucket = "warranty";
    //     if (fields.requestType[0] === "2") bucket = "complaint";
    //     else if (fields.requestType[0] !== "1") bucket = "lead_req";
    
    //     const { data, error } = await supabase.storage
    //       .from(bucket)
    //       .upload(filename, buffer, {
    //         contentType: uploadedFile.mimetype,
    //         upsert: true,
    //       });
    
    //     if (error) {
    //       console.error("Upload error:", error);
    //       return NextResponse.json({ message: "Upload failed", error: error.message }, { status: 500 });
    //     }
    
    //     const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filename);
    

    const connection = await pool.getConnection();
    const [resultID] = await connection.execute<any[]>(`SELECT request_id FROM user_warranty_requests
                WHERE DATE(created_at) = CURDATE()
                ORDER BY created_at DESC
                LIMIT 1`);
    // return NextResponse.json({ status: 1, message: "Request Received", data: request_id });
    console.log(resultID);
    
    const requestIDstring = generateRequestID(resultID)
    console.log("dkjahdhgaq-a-dfs-af-adf-as-f-asf-as-d",requestIDstring);
    
    const rawDate = (fields.product_purchase_date?.[0] ?? '')
      .trim()
      .replace(/['",]/g, '')  // remove ' " and , characters
      .replaceAll('/', '-');
    const cleanedDate = convertDDMMYYYYtoYYYYMMDD(rawDate);

    console.log(cleanFieldValue(fields.user_name?.[0].trim()),
    cleanFieldValue(fields.user_company_name?.[0].trim()),
    cleanFieldValue(fields.user_email?.[0].trim() ?? ''),
    cleanFieldValue(fields.user_address?.[0].trim() ?? ''),
    cleanFieldValue(fields.product_serial_no?.[0].trim()),);
    
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
      [
        requestIDstring,
        cleanFieldValue(fields.user_name?.[0].trim()),
        fields.user_company_name?.[0]? cleanFieldValue(fields.user_company_name?.[0].trim()): null,
        fields.user_email?.[0] ? cleanFieldValue(fields.user_email?.[0].trim()): null,
        parseInt(cleanFieldValue(fields.user_phone?.[0].trim())), // 
        fields.user_address?.[0]? cleanFieldValue(fields.user_address?.[0].trim()) : null,
        fields.product_serial_no?.[0]? cleanFieldValue(fields.product_serial_no?.[0].trim()):null,
        cleanedDate,
        1,//(New request goes in pending state)
        1,//pending status
        new Date()//for created at date
      ]
    );
    const result = insertRequest as ResultSetHeader;
    console.log(result);
    if(fileURL.length>0){
    for(let i=0;i<fileURL.length;i++){
      if(fileURL[i].url.length>0){
      const [insertImagesURL]= await connection.execute(
        `INSERT INTO user_request_attachements (
        fk_request_id,image_url,is_invoice,created_at
         ) VALUES (?, ?, ?, ?)`,[result.insertId,fileURL[i].url,fileURL[i].isInvoice,new Date()]
      )
    }
    }
  }
   
    
    const activityAdded = await AddUserRequestActivity(cleanFieldValue(fields.user_name?.[0].trim()),parseInt(cleanFieldValue(fields.user_phone?.[0].trim())), 1, 1, requestIDstring, result.insertId)
    if (!activityAdded) {
      return NextResponse.json({ status: 0, message: "Failed to add user activity" });
    }
    return NextResponse.json({ status: 1, message: "Request Received" });

  } catch (err) {
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





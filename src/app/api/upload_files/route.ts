import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parseForm, setUploadFileName } from "@/app/pro_utils/const_functions";

export const runtime = "nodejs"; // Ensure Node.js runtime for app directory API

// Handle POST request
export const POST = async (req: NextRequest) => {
  try {
    const { fields, files } = await parseForm(req);
    
    if (!files || !files.file) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const uploadedFile = files.file[0];
    const tempFilePath = uploadedFile.path; // Temporary file path
    let filename;
    let uploadDir;
    let fileURL="";
    if(fields.requestType[0]=="1"){
      filename=setUploadFileName(uploadedFile.originalFilename);
      uploadDir = path.join(process.cwd(), "/uploads/warranty");
      fileURL="warranty/"+filename
    }else if(fields.requestType[0]=="2"){
      filename=setUploadFileName(uploadedFile.originalFilename);
      uploadDir = path.join(process.cwd(), "/uploads/complaint");
      fileURL="complaint/"+filename

    }else{
      filename=setUploadFileName(uploadedFile.originalFilename);
      uploadDir = path.join(process.cwd(), "/uploads/lead_req");
      fileURL="lead_req/"+filename

    }
   
   
    
    await fs.mkdir(uploadDir, { recursive: true });

    const destination = path.join(uploadDir, filename);
    await fs.copyFile(tempFilePath, destination);

    return NextResponse.json({ message: "File uploaded successfully", status: 1,documentURL:fileURL },{status:200});
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({
      message: "File upload failed",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    });
  }
};



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


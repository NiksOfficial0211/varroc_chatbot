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

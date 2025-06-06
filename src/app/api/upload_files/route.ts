// import { NextRequest, NextResponse } from "next/server";
// import fs from "fs/promises";
// import path from "path";
// import { parseForm, setUploadFileName } from "@/app/pro_utils/const_functions";

// export const runtime = "nodejs"; // Ensure Node.js runtime for app directory API

// // Handle POST request
// export const POST = async (req: NextRequest) => {
//   try {
//     const { fields, files } = await parseForm(req);
    
//     if (!files || !files.file) {
//       return NextResponse.json({ error: "No files received." }, { status: 400 });
//     }

//     const uploadedFile = files.file[0];
//     const tempFilePath = uploadedFile.path; // Temporary file path
//     let filename;
//     let uploadDir;
//     let fileURL="";
//     if(fields.requestType[0]=="1"){
//       filename=setUploadFileName(uploadedFile.originalFilename);
//       uploadDir = path.join(process.cwd(), "/uploads/warranty");
//       fileURL="warranty/"+filename
//     }else if(fields.requestType[0]=="2"){
//       filename=setUploadFileName(uploadedFile.originalFilename);
//       uploadDir = path.join(process.cwd(), "/uploads/complaint");
//       fileURL="complaint/"+filename

//     }else{
//       filename=setUploadFileName(uploadedFile.originalFilename);
//       uploadDir = path.join(process.cwd(), "/uploads/lead_req");
//       fileURL="lead_req/"+filename

//     }
   
   
    
//     await fs.mkdir(uploadDir, { recursive: true });

//     const destination = path.join(uploadDir, filename);
//     await fs.copyFile(tempFilePath, destination);

//     return NextResponse.json({ message: "File uploaded successfully", status: 1,documentURL:fileURL },{status:200});
//   } catch (error) {
//     console.error("File upload error:", error);
//     return NextResponse.json({
//       message: "File upload failed",
//       error: error instanceof Error ? error.message : String(error),
//       status: 500,
//     });
//   }
// };


import { NextRequest, NextResponse } from "next/server";
import { parseForm, setUploadFileName } from "@/app/pro_utils/const_functions";
import fs from "fs/promises"; // only to read temp file
import path from "path";
import { supabase } from "../../../../utils/supabaseClient";

export const runtime = "nodejs";

interface MyUploadedFile {
  originalFilename: string;
  mimetype: string;
  filepath: string;
  size: number;
  newFilename: string;
}

export const POST = async (req: NextRequest) => {
  try {
    const { fields, files } = await parseForm(req);

    if (!files || !files.file) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const uploadedFile = files.file[0] as unknown as MyUploadedFile;
    const tempFilePath = uploadedFile.filepath;
    const buffer = await fs.readFile(tempFilePath); // Read temp file as Buffer

    const filename = `${Date.now()}-${uploadedFile.originalFilename}`;
    // if (uploadedFile.size > 5 * 1024 * 1024) {
    //   return NextResponse.json({ error: "File too large" }, { status: 400 });
    // }
    let bucket = "warranty";
    if (fields.requestType[0] === "2") bucket = "complaint";
    else if (fields.requestType[0] !== "1") bucket = "lead_req";

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: uploadedFile.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ message: "Upload failed", error: error.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filename);

    return NextResponse.json({
      message: "File uploaded successfully",
      status: 1,
      documentURL: publicUrlData.publicUrl,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({
      message: "File upload failed",
      error: error instanceof Error ? error.message : String(error),
      status: 500,
    });
  }
};


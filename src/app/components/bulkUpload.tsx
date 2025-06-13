'use client'
import React, { useEffect, useState } from 'react'
import Papa from 'papaparse';
import { error } from 'console';
import LoadingDialog from './PageLoader';
import ShowAlertMessage from './alert';
import { staticIconsBaseURL } from '../pro_utils/string_constants';
import ExcelJS, { CellRichTextValue } from "exceljs";
import { useGlobalContext } from '../contextProviders/globalContext';



const BulkUploadForm = ({ onClose }: { onClose: () => void }) => {
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isLoading, setLoading] = useState(false);

    const {auth_id} =useGlobalContext()
    const [showAlert, setShowAlert] = useState(false);
    const [alertForSuccess, setAlertForSuccess] = useState(0);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertStartContent, setAlertStartContent] = useState('');


    const uploadData = async (e: React.FormEvent) => {

        setLoading(true);
        if (!(uploadFile instanceof File)) {

            setLoading(false);
            setShowAlert(true);
            setAlertTitle("Error")
            setAlertStartContent("Please select a file to upload");
            setAlertForSuccess(2)

            return;
        }
        try {
            const formData = new FormData();
            let isCsv;
            let validData:any=[],invalidData:any=[];
            if (uploadFile.type === "text/csv") {
                // formData.append("isCSV", 'true');
                isCsv=true;
                const resPonseUplod = await uploadCSVFile(uploadFile,auth_id);
            

                setLoading(false);

                setShowAlert(true);
                setAlertTitle("Result");
                setAlertStartContent(resPonseUplod+"");
                setAlertForSuccess(1);
                // formData.append("valid_data",  JSON.stringify(validRows));
                // formData.append("invalid_data",  JSON.stringify(errorRows));

            }
            else if (
                uploadFile.type ===
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                uploadFile.type === "application/vnd.ms-excel"
            ) {
                // console.log("Upload thorugh xlsx coniditon is invoked");
                formData.append("isCSV", 'false');
                isCsv=false;
                const resPonseUplod = await uploadThroughXLSX(uploadFile,auth_id);
                console.log("98bhjbdnmasab snd dajksdna sdjadas---------------",resPonseUplod);
                setLoading(false);

                setShowAlert(true);
                setAlertTitle("Result");
                setAlertStartContent(resPonseUplod+"");
                setAlertForSuccess(1);
                
        
            }

        
        } catch (e) {
            setLoading(false);

            setShowAlert(true);
            setAlertTitle("Exception");
            setAlertStartContent("Something went wrong");
            setAlertForSuccess(2);
            console.log(e);

        }
        
    



    };

    async function downloadFile(fileType: any) {
        setLoading(true)
        const formData = new FormData();
        formData.append('file_type', fileType);

        try {
            const response = await fetch('/api/downloadFile', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to download file');
            }

            // Convert the response to a blob
            const blob = await response.blob();

            // Create a link element to trigger the download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileType === 'csv' ? 'bat_sample_csv.csv' : 'bat_sample_excel.xlsx';
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error downloading file:', error);
            alert('Failed to download file');
        }
    };

    return (





        <div className=''>
            {/* <form ></form> */}
            <LoadingDialog isLoading={isLoading} />
            {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
                setShowAlert(false)

            }} onCloseClicked={function (): void {
                setShowAlert(false)
            }} showCloseButton={false} successFailure={alertForSuccess} />}
            <div className='rightpoup_close' onClick={onClose}>
                <img src={staticIconsBaseURL + "/images/remove.png"} alt="Search Icon" title='Close' />
            </div>

            <div className="row">
                <div className="col-lg-12 mb-5 inner_heading25">Select a .csv/ .xlsx File.</div>
            </div>
            <div className="row">
                <div className="col-lg-12">
                    <div className="download_btn" onClick={() => downloadFile('csv')}>
                    Download<br></br><span style={{fontFamily:"GothamMedium"}}>Sample .csv</span>
                    </div>
                    
                    <div className='download_btn' onClick={() => downloadFile('xlsx')}>Download<br></br><span style={{ fontFamily: "GothamMedium" }}>Sample .xlsx</span></div>
                </div>
            </div>
            <div className="row mb-5">
                <div className="col-lg-12">
                    <div className="">
                        <div className="row">
                            
                            <div className="col-lg-12">
                                <div className="form_box mt-5">

                                    <input
                                        type="file"
                                        accept=".csv, .xlsx"
                                        id="uploadFile"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setUploadFile(e.target.files[0]); // ✅ Now TypeScript understands the type
                                            }
                                        }} style={{ backgroundColor: "#fff", borderRadius: "8px", padding: "10px" }}

                                    />
                                    
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
            <div className="row mb-5 ">
                <div className="col-lg-12" style={{ textAlign: "right" }}>
                    <a className="blue_btn " onClick={uploadData} style={{ cursor: "pointer", }}>Upload</a> <a className="blue_btn" onClick={onClose} style={{ cursor: "pointer", }}>Close</a>
                </div>
            </div>
        </div>




    )
}

export default BulkUploadForm;



async function uploadCSVFile(uploadFile: File,auth_id:any) {
    let return_message="";
    const validRows: any[] = [];
    const errorRows: any[] = [];
    const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            if (!event.target?.result) {
                
                reject("Error reading file");
                return {validRows,errorRows};
            }
            let result = event.target.result as string;
            // Remove BOM if present
            if (result.charCodeAt(0) === 0xFEFF) {
                result = result.slice(1);
            }
            resolve(result);
        };

        reader.onerror = () => reject("File reading failed");
        reader.readAsText(uploadFile, "UTF-8");
    });

    const csvData = Papa.parse<any>(text, {
        header: true,
        skipEmptyLines: true,
    });

    if (!csvData.data.length) {
        console.log("length is undefined");

        return {validRows,errorRows};
    }

    

    csvData.data.forEach((row, index) => {
        console.log("csv data for each called");
        
        const rowNum = index + 2; // Considering row 1 is header

        const battery_model = row["battery_model"]?.trim();
        const varroc_part_code = row["varroc_part_code"]?.trim();
        const battery_serial_number = row["battery_serial_number"]?.trim();
        const mfg_date = row["mfg_date"]?.trim();
        const description = row["description"]?.trim();
        const proposed_mrp = row["proposed_mrp"]?.trim();

        const missingFields = [];

        if (!battery_model) missingFields.push("serialNumber");
        if (!varroc_part_code) missingFields.push("varroc part code");
        if (!battery_serial_number) missingFields.push("battery_serial_number");
        if (!mfg_date) missingFields.push("manufacturing Date");
        if (!description) missingFields.push("Description");
        if (!proposed_mrp) missingFields.push("proposed MRP");

        let formattedDate = "";
        let dateError = false;

        if (mfg_date && mfg_date) {
            const parts = mfg_date.split("-");
            if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
            } else {
                dateError = true;
                missingFields.push("Invalid manufacturingDate format");
            }
        }

        if (missingFields.length > 0 || dateError) {
            errorRows.push([
                rowNum,
                `Missing or invalid fields: ${missingFields.join(", ")}`,
                JSON.stringify(row),
            ]);
        } else {
            validRows.push([
                auth_id,
                battery_model,
                varroc_part_code,
                battery_serial_number,
                formatDateYYYYMMDD(mfg_date),
                description,
                proposed_mrp,
                24,0,
                formatDateToMySQL(new Date())
            ]);
        }
    });

    try {
        // if (validRows.length) {
        //     await db.query(
        //         `INSERT INTO product_info (battery_model, varroc_part_code, battery_serial_number, manufacturing_date,warranty,is_sold,created_at) VALUES ?`,
        //         [validRows]
        //     );
        // }

        // if (errorRows.length) {
        //     await db.query(
        //         `INSERT INTO battery_upload_errors (rowNumber, message, rawData) VALUES ?`,
        //         [errorRows]
        //     );
        // }

        const responce=await fetch("/api/product_bulk_upload", {
            method: "POST",
            headers: {
            "Content-Type": "application/json", // 🔥 Important for raw JSON
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
            },
            body: JSON.stringify({
                isCSV:false,
                valid_data:validRows,
                invalid_data:errorRows
            }),
        })
    
        const res=await responce.json();
    
        if (res.status==1) {
            return_message="Data Uploaded Successfully";
            
        }else{
            return_message="Failed To upload Data Successfully"
             
        }
        return return_message;
    } catch (error) {
        console.error("Database error:", error);
        return "Some exception occured while adding data";
    }
}


export async function uploadThroughXLSX(uploadFile: File,auth_id:any) {
  console.log("uploadHolidaysThroughXLSX is called");
  let return_message="";
  const reader = new FileReader();
  reader.readAsArrayBuffer(uploadFile);
  const insertValid: (string | null)[][] = [];
  const insertErrors: (string | number)[][] = [];

  reader.onload = async (e) => {
    if (!e.target?.result) {
        

      return "Error reading file";
    }

    const arrayBuffer = e.target.result;
    const workbook = new ExcelJS.Workbook();

    if (typeof arrayBuffer === "string") {
        
      return "Unexpected string result from FileReader";
    }

    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

   

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        

      if (rowNumber === 1) return; // Skip header row

      const battery_model = row.getCell(1).value?.toString().trim() || '';
      const varroc_part_code = row.getCell(2).value?.toString().trim() || '';
      const battery_serial_number = row.getCell(3).value?.toString().trim() || '';
      const mfg_date = row.getCell(4).value?.toString().trim() || '';
      const description = row.getCell(5).value?.toString().trim() || '';
      const proposed_mrp = row.getCell(6).value?.toString().trim() || '';
    
    
      let manuFact_Date: string | null = null;
      let errors = [];

      // Parse manufacturing date
      if (typeof mfg_date === "number") {
        
        
        const date = new Date((mfg_date - 25569) * 86400 * 1000);
        manuFact_Date = `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      } else if (typeof mfg_date === "string") {
        console.log("else if condition is called");
        const parsed = new Date(mfg_date);
        if (!isNaN(parsed.getTime())) {
            console.log("else if inner if condition is called");
            manuFact_Date = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
        } else {
            console.log("else if inner else condition is called");
            manuFact_Date=mfg_date;
        //   errors.push("Invalid manufacturing date format");
        }
      }else{
        manuFact_Date=mfg_date
      } 
    //   else {
    //     errors.push("Missing manufacturing date");
    //   }


      if (!battery_model) errors.push("Battery Model");
      if (!varroc_part_code) errors.push("varroc_part_code");
      if (!battery_serial_number) errors.push("battery_serial_number");
      if (!mfg_date) errors.push("manufacturing Date");
      if (!description) errors.push("Description");
      if (!proposed_mrp) errors.push("proposed MRP");
      console.log("worksheet.eachRow called",errors);

      if (errors.length > 0) {
        console.log("Error row at index of battery model",battery_model);
        insertErrors.push([
          rowNumber,
          errors.join(", "),
          JSON.stringify({
            battery_serial_number, varroc_part_code, mfg_date
          })
        ]);
      } else {

        insertValid.push([
            auth_id,
            battery_model,
                varroc_part_code,
                battery_serial_number,
                formatDateYYYYMMDD(manuFact_Date),
                description,
                proposed_mrp,
                "24","0",
                formatDateToMySQL(new Date())
        ]);
      }
    });

    try {
      // Insert valid rows
    //   if (insertValid.length > 0) {
    //     await db.query(
    //         `INSERT INTO product_info (battery_model, varroc_part_code, battery_serial_number, manufacturing_date,warranty,is_sold,created_at) VALUES ?`,
    //         [insertValid]
    //     );
    //   }

    //   // Insert error rows
    //   if (insertErrors.length > 0) {
    //     await db.query(
    //       `INSERT INTO battery_upload_errors (rowNumber, message, rawData) VALUES ?`,
    //       [insertErrors]
    //     );
    //   }

    //   console.log("Data uploaded successfully.");

    console.log("worksheet.eachRow called",insertValid);
    const responce=await fetch("/api/product_bulk_upload", {
        method: "POST",
        headers: {
        "Content-Type": "application/json", // 🔥 Important for raw JSON
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({
            isCSV:false,
            valid_data:insertValid,
            invalid_data:insertErrors
        }),
    })

    const res=await responce.json();

    if (res.status==1) {
        return_message="Data Uploaded Successfully";
        
    }else{
        return_message="Failed To upload Data"
         
    }
      
    } catch (err) {
      console.error("DB Insertion Error:", err);
      return_message="Some exception occured while adding data";
      
    }
  };

  return return_message;
}

function formatDateYYYYMMDD(inputDate:string){
    const [day, month, year] = inputDate.split('-');
    const formattedDate = `${year}-${month}-${day}`; 
    return formattedDate;
} 
function formatDateToMySQL(date: Date): string {
    return date.toISOString().slice(0, 19).replace("T", " ");
  }



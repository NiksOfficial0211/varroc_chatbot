import { NextResponse } from "next/server";
import pool from "../../../../utils/db";
import moment from "moment";
import { getImageApiURL, staticIconsBaseURL, status_Pending } from "@/app/pro_utils/string_constants";
import { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: "Unauthorized", message: "You are unauthorized" }, { status: 403 });
  }

  const body = await request.json();


  const { auth_id, pk_id, comments, status, request_id, request_type, 
    rejection_id, selectedRejection, rejection_other, isRejected, 
    isDuplicate, customer_phone, warranty_start_date, warranty_end_date, 
    battery_serial_no, date_of_purchase } = body;

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Insert into user_request_addressed
    await connection.query(
      `INSERT INTO user_request_addressed 
       (fk_request_id, auth_user_id, comments, request_type, request_status, fk_rejection_id, other_rejection, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pk_id, auth_id, comments, request_type, status, rejection_id, rejection_other, new Date()]
    );

    // Step 2: Update user_warranty_requests
    await connection.query(
      `UPDATE user_activities 
       SET status_id = ?
       WHERE go_activity_id = ?`,
      [status, pk_id]
    );
    console.log("this is the body", body);
    

    // Step 3: Insert into logs
    const createdJson = {
      fk_request_id: pk_id,
      auth_id: auth_id,
      changed_comments: comments,
      request_type: request_type,
      changed_status: status,
    };

    await connection.query(
      `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
      ["Update Warranty Request", pk_id, 1, JSON.stringify(createdJson), new Date()]
    );

    // ✅ COMMIT after all DB operations are successful
    await connection.commit();
    connection.release();

    // Step 4: Send Aisensy message
    // const campaignName = "Reject_message";

    // This are the params now
    // "reference id",
    // "status",
    // "Serial Number",
    // "Date of Purchase",
    // "FOC Warranty Start Date:,
    // "FOC Warranty End Date:"

    let aisensyPayload;
    let pdfPayload = null;
    if (isRejected || isDuplicate) {
      // warranty_reg_reject_status
      // isRejected ?  comments && comments.length>0?`Rejected ${selectedRejection}-${comments}`:"Rejected" : isDuplicate?"Duplicate Request": 
      aisensyPayload = {
        apiKey: process.env.NEXT_PUBLIC_AISENSY_API_KEY,
        campaignName: "warranty_reg_reject_status",
        destination: `${customer_phone}`,
        userName: "Varroc Aftermarket",
        templateParams: [
          request_id,
          isRejected ? comments && comments.length > 0 ? `Rejected ${selectedRejection}-${comments} Please fill the form again` : `Rejected ${selectedRejection} please fill the form again` : isDuplicate ? `Duplicate Request${comments && comments.length>0?"-"+comments:""}` : "",
        ],
        source: "new-landing-page form",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {
          FirstName: "user"
        }
      };
    } else if (status == status_Pending) {
      aisensyPayload = {
        apiKey: process.env.NEXT_PUBLIC_AISENSY_API_KEY,
        campaignName: "warranty_reg_reject_status",
        destination: `${customer_phone}`,
        userName: "Varroc Aftermarket",
        templateParams: [
          request_id,
          `Pending${comments && comments.length>0 ? "-"+comments:""}. Will update soon on your warranty request`
        ],
        source: "new-landing-page form",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {
          FirstName: "user"
        }
      };
    } else {

      let query = `
      SELECT 
        ua.*,
        rt.request_type AS request_type,
        rs.status AS request_status
        FROM user_warranty_requests ua
        JOIN request_types rt ON ua.request_type_id = rt.request_type_id 
        JOIN request_status rs ON ua.status_id = rs.status_id
    `;

    // Dynamic WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];

    if (pk_id) {
      conditions.push(`ua.pk_request_id = ?`);
      values.push(pk_id);
    }
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }


    const [userRequests] = await connection.execute<RowDataPacket[]>(query, values);
        console.log(userRequests[0]);

    const [batteryData]=await connection.execute<RowDataPacket[]>(
      `SELECT *,DATE_FORMAT(manufacturing_date, '%d-%m-%y') as manufacturing_date FROM product_info WHERE battery_serial_number=?`,[userRequests[0].product_serial_no])
    console.log(batteryData);
      

      const certResponse=await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate-pdf`,{
        method: "POST",
        
        body:JSON.stringify({
          base_url:staticIconsBaseURL,
          reference_id:userRequests[0].request_id, 
          customer_name:userRequests[0].user_name, 
          phone_no:userRequests[0].user_phone? userRequests[0].user_phone:"--", 
          battery_serial_no:userRequests[0].product_serial_no,
          pin_code:userRequests[0].user_pin_code,
          city:userRequests[0].retailer_city_name?userRequests[0].retailer_city_name: "--",
          purchase_date:formatDateDDMMYYYY(userRequests[0].product_purchase_date),
          retailer_shop_name:userRequests[0].retailer_shop_name,
          warranty_start_date:warranty_start_date,
          warranty_end_date:warranty_end_date,
          request_date:formatDateDDMMYYYY(userRequests[0].created_at),
          varroc_part_code:batteryData && batteryData.length>0 && batteryData[0].varroc_part_code? batteryData[0].varroc_part_code: "--",
          manufacturing_date:batteryData && batteryData.length>0 && batteryData[0].manufacturing_date?batteryData[0].manufacturing_date: "--",
          description:batteryData && batteryData.length>0 && batteryData[0].battery_description?batteryData[0].battery_description: "--"
        })
      })
      const certificateURL=await certResponse.json();
      console.log("after geting the url in update route------",certificateURL);
      if(!certificateURL && certificateURL.length==0){
        connection.rollback();
        connection.release();
         return NextResponse.json(
          { status: 0, error: "Failed to generate PDF" },
          { status: 200 }
        );
      }
      
      await connection.query(
      `UPDATE user_warranty_requests 
       SET status_id = ?, addressed_id = ?, fk_reject_id = ?,warranty_start_date=?,warranty_end_date=?,certificate_url=?
       WHERE pk_request_id = ?`,
      [status, auth_id, rejection_id,
        warranty_start_date ? moment(warranty_start_date, "DD/MM/YYYY").format("YYYY-MM-DD") : null,
        warranty_end_date ? moment(warranty_end_date, "DD/MM/YYYY").format("YYYY-MM-DD") : null,certificateURL.url, pk_id
      ]
    );

      // aisensyPayload = {
      //   apiKey: process.env.NEXT_PUBLIC_AISENSY_API_KEY,
      //   campaignName: "approved_status_warranty_reg",
      //   destination: `${customer_phone}`,
      //   userName: "Varroc Aftermarket",
      //   templateParams: [
      //     request_id,
      //     `Approved.${comments?" "+comments:""}`,
      //     battery_serial_no,
      //     date_of_purchase,
      //     warranty_start_date,
      //     warranty_end_date
      //   ],
      //   source: "new-landing-page form",
      //   media: {},
      //   buttons: [],
      //   carouselCards: [],
      //   location: {},
      //   attributes: {},
      //   paramsFallbackValue: {
      //     FirstName: "user"
      //   }
      // };

      aisensyPayload = {
        apiKey: process.env.NEXT_PUBLIC_AISENSY_API_KEY,
        campaignName: "WARRANTY_APPROVED",
        destination: `${customer_phone}`,
        userName: "Varroc Aftermarket",
        templateParams: [
          request_id,
          `Approved.${comments?" "+comments:""}`,
          
        ],
        source: "new-landing-page form",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {
          FirstName: "user"
        }
      };
      console.log(aisensyPayload);

      pdfPayload = {
        "apiKey": process.env.NEXT_PUBLIC_AISENSY_API_KEY,
        "campaignName": "pdf_warranty_verified",
        "destination": `${customer_phone}`,
        "userName": "Varroc Aftermarket",
        "templateParams": [],
        "source": "new-landing-page form",
        "media": {
          "url": `${certificateURL.url}`,
          "filename": "Certificate"
        },
        "buttons": [],
        "carouselCards": [],
        "location": {},
        "attributes": {},
        "paramsFallbackValue": {}
      }
    }

    console.log("this is the payload for aisensy" + JSON.stringify(aisensyPayload));


    const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aisensyPayload),
    });

    const result = await res.json();
    console.log("Aisensy response:", result);
    if (result.success === 'true') {
      await connection.query(
        `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
        ["Update Warranty Request Send Message Successful", pk_id, 1, JSON.stringify({ ...aisensyPayload, message: "message sent to customer" }), new Date()]
      );

      const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pdfPayload),
      });

      const pdfResult = await res.json();
      if (pdfResult.success === 'true') {
        await connection.query(
          `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
          ["Update Warranty Request Send PDF Successful", pk_id, 1, JSON.stringify({ ...pdfPayload, message: "message sent to customer" }), new Date()]
        );
      } else {
        await connection.query(
          `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
          ["Update Warranty Request Send PDF Failed", pk_id, 1, JSON.stringify({ ...pdfPayload, message: "Failed to send pdf to customer", response: pdfResult }), new Date()]
        );
      }


      return NextResponse.json({ status: 1, message: "Request updated message sent to customer" });
    } {
      await connection.query(
        `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
        ["Update Warranty Request Send Message Failed", pk_id, 1, JSON.stringify({ ...aisensyPayload, message: "Failed to send message to customer", response: result }), new Date()]
      );
      return NextResponse.json({ status: 1, message: "Request updated but message delivery failed to customer" });
    }
  } catch (e: any) {
    if (connection) {
      await connection.rollback();
      await connection.query(
        `INSERT INTO logs (activity_type,fk_request_id,request_type_id, change_json, created_at) VALUES (?, ?, ?, ?, ?)`,
        ["Update Warranty Request Exception", pk_id, 1, JSON.stringify(e), new Date()]
      );
      
    }

    console.error("Transaction failed:", e);
    return NextResponse.json(
      { status: 0, error: e.message || "Internal Server Error", code: e.code || null },
      { status: 500 }
    );
  }finally{
    if (connection) {
    connection.release();
    }
  }
}



 const formatDateDDMMYYYY = (date: any, isTime = false) => {
      if (!date) return '';
      const parsedDate = moment(date);
      return parsedDate.format('DD-MM-YYYY');
    };

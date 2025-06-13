import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../utils/db";
import db from "../../../../utils/db";
import { funSendApiException, parseForm } from "@/app/pro_utils/const_functions";
import { ResultSetHeader } from "mysql2";


export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1]; // 'Bearer your-token'

  if (!token || token !== process.env.NEXT_PUBLIC_API_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized', message: "You are unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { auth_id, model_no,
    varroc_part_code,
    serial_no,
    manufacturing_date,
    description,
    proposed_mrp, isProductAdd, pk_id } = body;


  try {
    let isSuccess = false;
    if (isProductAdd) {
      const [insertResult] = await db.query<ResultSetHeader>(
  `INSERT INTO product_info 
    (created_by, updated_by, battery_model, varroc_part_code, battery_serial_number, 
     manufacturing_date, battery_description, proposed_mrp, warranty, is_sold, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE
     created_by = VALUES(created_by),
     updated_by = VALUES(updated_by),
     battery_model = VALUES(battery_model),
     varroc_part_code = VALUES(varroc_part_code),
     manufacturing_date = VALUES(manufacturing_date),
     battery_description = VALUES(battery_description),
     proposed_mrp = VALUES(proposed_mrp),
     warranty = VALUES(warranty),
     is_sold = VALUES(is_sold),
     created_at = VALUES(created_at),
     updated_at = ?`,
  [
    auth_id,                      // created_by
    auth_id,                      // updated_by
    model_no,
    varroc_part_code,
    serial_no,
    manufacturing_date,
    description,
    proposed_mrp,
    24,                           // warranty
    0,                            // is_sold
    formatDateToMySQL(new Date()), // created_at
    formatDateToMySQL(new Date()), // updated_at for VALUES
    formatDateToMySQL(new Date())  // updated_at for ON DUPLICATE
  ]
);


      console.log("insert result array", insertResult);

      if (insertResult.affectedRows === 1 || insertResult.affectedRows === 2) {
        isSuccess = true;
      } else {
        isSuccess = false;
      }
    } else {
      const [updateResult] = await db.query<ResultSetHeader>(
        `UPDATE product_info 
                SET
                  updated_by = ?, 
                  battery_model = ?, 
                  varroc_part_code = ?, 
                  manufacturing_date = ?, 
                  battery_description = ?, 
                  proposed_mrp = ?
                  WHERE pk_id = ?`,
        [
          auth_id,               // updated_by
          model_no,              // battery_model
          varroc_part_code,      // varroc_part_code
          manufacturing_date,    // manufacturing_date
          description,           // battery_description
          proposed_mrp,          // proposed_mrp
          pk_id                  // WHERE condition
        ]
      );
      console.log(updateResult);
      if (updateResult.affectedRows === 1) {
        isSuccess = true;
      } else {
        isSuccess = false;
      }
    }


    const createdJson = {
      "auth_id": auth_id,
      "model_no": model_no,
      "varroc_part_code": varroc_part_code,
      "serial_no": serial_no,
      "manufacturing_date": manufacturing_date,
      "description": description,
      "proposed_mrp": proposed_mrp
    }
    const insertLog = await db.query(
      `INSERT INTO logs (activity_type,change_json,created_at) VALUES (?,?,?)`,
      [isProductAdd ? "Product Added" : "Product Updated", JSON.stringify(createdJson), new Date()]
    );

    if (isProductAdd && isSuccess) {
      return NextResponse.json({ status: 1, message: "Data Added successfully" }, { status: 200 })

    } else if (!isProductAdd && isSuccess) {
      return NextResponse.json({ status: 1, message: "Data Updated Successfully" }, { status: 200 })

    } else {
      if (isProductAdd) {
        return NextResponse.json({ status: 0, message: "Failed to add data" }, { status: 200 })
      } else {
        return NextResponse.json({ status: 0, message: "Failed to update data" }, { status: 200 })

      }

    }

  } catch (e) {
    console.log(e);

    return funSendApiException(e);
  }

}

function formatDateToMySQL(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

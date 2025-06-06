import { ResultSetHeader } from "mysql2";
import pool from "../../../utils/db";

export async function AddUserRequestActivity(name: any, phone: any, request_type_id: any,
    status_id: any, request_id: any, go_request_id: any) {
    try {
        const connection = await pool.getConnection();

        const [insertRequest] = await connection.execute(
            `INSERT INTO user_activities 
             (name,phone,
              request_type_id,
              status_id,
              request_id,
              go_activity_id,created_at)
             VALUES (?,?,?,?,?,?,?)`,
            [
                name,phone,
                request_type_id,
                status_id,
                request_id,
                go_request_id,
                new Date()//for created at date
            ]
        );
        connection.release();
        const result = insertRequest as ResultSetHeader;
        return result.affectedRows === 1;

    } catch (e) {
        console.log("add acitivty exception-------> ", e);

        return false
    }

}
export interface ProductInfoTableDataModel {
    pk_request_id: number
    request_id: string
    user_name: string
    user_company_name: string
    user_email: string
    user_phone: number
    user_address: string
    product_serial_no: string
    product_purchase_date: string
    request_type_id: number
    status_id: number
    addressed_id: any
    created_at: string
    updated_at: string
    request_type: string
    request_status: string
}

export interface ProductInfoMasterDataModel {
    pk_id: number
    created_by: number
    updated_by: any
    battery_model: string
    varroc_part_code: string
    battery_serial_number: string
    manufacturing_date: string
    battery_description: string
    proposed_mrp: number
    warranty: number
    is_sold: number
    created_at: string
    updated_at: string
  }
export interface ProductInfoMasterUserModel {
    pk_id: number
    created_by: number
    updated_by: any
    battery_model: string
    varroc_part_code: string
    battery_serial_number: string
    manufacturing_date: string
    battery_description: string
    proposed_mrp: number
    warranty: number
    is_sold: number
    created_at: string
    updated_at: string
    created_by_username:string
    updated_by_username:string
    
  }


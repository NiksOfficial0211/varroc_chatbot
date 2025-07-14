export interface WarrantyRequestDataModel {
    pk_request_id: number
  request_id: string
  user_name: string
  retailer_shop_name: string
  user_email: any
  user_phone: number
  raised_whatsapp_number: number
  user_pin_code: string
  retailer_city_name: string
  product_serial_no: string
  product_purchase_date: string
  request_type_id: number
  status_id: number
  fk_reject_id: any
  addressed_id: any
  created_at: string
  updated_at: string
  request_type: string
  request_status: string
    addressedDetails: AddressedByDetail[]
  }


 export interface AddressedByDetail {
    pk_id: number
    fk_request_id: string
    auth_user_id: number
    comments: string
    request_type: number
    request_status: number
    fk_rejection_id: any,
    other_rejection: any,
    rejection_msg: string
    created_at: string
    updated_at: string
    addressedBY: string
  }

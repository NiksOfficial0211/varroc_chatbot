import { AddressedByDetail } from "./WarrantyReqestListDataModel"
import { Images } from "./WarrantyRequestDetailsModel"

export interface ComplaintListDataModel {
  pk_id: number
  complaint__id: string
  battery_serial_no: string
  same_number: number
  user_phone: number
  complaint_type: string
  complaint_description: string
  document_url: string
  raised_whatsapp_no: number
  status_id: number
  addressed_by: number
  created_at: string
  updated_at: string
  request_status: string
  addressedDetails: AddressedByDetail[]
}
export interface ComplaintDetailDataModel {
  complaint_data: ComplaintDataModel[]
  addressedData: any[]
  battery_details: any[]
  duplicate_data: any[]
  images: Images[]
  warrantyRaised: WarrantyRequestDetails[]
}

export interface ComplaintDataModel {
  pk_id: number
  complaint__id: string
  battery_serial_no: string
  same_number: number
  user_phone: number
  complaint_type: string
  complaint_description: string
  document_url: string
  raised_whatsapp_no: number
  status_id: number
  addressed_by: number
  created_at: string
  updated_at: string
  request_status: string
}

export interface WarrantyRequestDetails {
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
}
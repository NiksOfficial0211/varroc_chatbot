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
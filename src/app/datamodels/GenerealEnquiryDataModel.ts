import { AddressedDaum } from "./WarrantyRequestDetailsModel"

export interface GeneralEnqListingDataModel {
  pk_id: number
  general_id: string
  whatsapp_no: number
  customer_name: string
  contact_no: number
  pincode: number
  city: string
  state: string
  description: string
  addressed_by: any
  status_id: number
  comments: any
  created_at: string
  updated_at: string
  request_status: string
  addressedDetails: any[]
}

export interface GeneralEnqDetailDataModel {
  enq_data: GeneralEnqDataModel[]
  addressed_data: AddressedDaum[]
  duplicate_data: DuplicateDaum[]
}

export interface DuplicateDaum {
  dup_general: GeneralEnqDataModel
  addressedData: AddressedDaum[]
}

export interface GeneralEnqDataModel {
  pk_id: number
  general_id: string
  whatsapp_no: number
  customer_name: string
  contact_no: number
  pincode: number
  city: string
  state: string
  description: string
  addressed_by: any
  status_id: number
  comments: any
  created_at: string
  updated_at: string
  request_status: string
  
}
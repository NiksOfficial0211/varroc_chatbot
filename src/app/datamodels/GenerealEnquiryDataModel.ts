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
  duplicate_data: GeneralEnqDataModel[]
}

export interface GeneralEnqDataModel {
  pk_deal_id: number
  dealership_id: string
  full_name: string
  alternate_contact: number
  pincode: number
  city: string
  state_address: string
  business_age: string
  shop_type: string
  addressed_by: number
  status_id: number
  rejected_id: any
  raised_whatsapp_no: number
  created_at: string
  updated_at: string
  request_status: string
}
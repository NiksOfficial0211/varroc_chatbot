import { AddressedDaum } from "./WarrantyRequestDetailsModel"

export interface DealershipEnqListingDataModel {
  pk_deal_id: number
  dealership_id: string
  full_name: string
  alternate_contact: number
  pincode: number
  city: string
  state_address: string
  business_age: string
  shop_type: string
  addressed_by: any
  status_id: number
  rejected_id: any
  raised_whatsapp_no: number
  created_at: string
  updated_at: string
  request_status: string
  addressedDetails: any[]
}

export interface DealershipEnqDetailDataModel {
  enq_data: DealershipEnqDataModel[]
  addressed_data: AddressedDaum[]
  duplicate_data: DealershipEnqDataModel[]
}

export interface DealershipEnqDataModel {
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
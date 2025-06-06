import { ProductInfoMasterDataModel } from "./BatteryDataModel"
import { WarrantyRequestDataModel } from "./WarrantyReqestListDataModel"

 export interface WarrantyRequestDetailResponseModel {
    request: WarrantyRequestDataModel[]
    addressedData: AddressedDaum[]
    images: Images[]
    battery_details: ProductInfoMasterDataModel[]
  }

 export interface AddressedDaum {
    pk_id: number
    fk_request_id: string
    auth_user_id: number
    comments: string
    request_type: number
    request_status: number
    fk_rejection_id: any,
    other_rejection: any,
    created_at: string
    updated_at: string
    addressedBY: string
    rejection_msg: string

  }

  export interface Images {
    pk_id:any,
    image_url:any,
    fk_request_id:any,
    is_invoice:any,
  }
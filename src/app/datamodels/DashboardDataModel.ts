interface DashboardResponseData {
  total_Request: number
  total_Warranty_Request:number
  warranty_pending_request: number
  addressed_count: number
  complaints_pending_request:number
  business_pending_requests:number
  general_pending_requests:number
  activities: ActivityDataModel[]
}

interface ActivityDataModel {
    pk_activity_id: number
    name: string
    phone: number
    request_type_id: number
    status_id: number
    request_id: string
    go_activity_id: number
    created_at: string
    updated_at: string
    request_type: string
    request_status: string
}
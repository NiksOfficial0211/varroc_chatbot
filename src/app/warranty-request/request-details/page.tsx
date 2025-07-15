
'use client'
import React, { useEffect, useState } from 'react'
import LoadingDialog from '../../components/PageLoader';
import ShowAlertMessage from '../../components/alert';
import { WarrantyRequestDataModel } from '../../datamodels/WarrantyReqestListDataModel';
import { useGlobalContext } from '@/app/contextProviders/globalContext';
import { WarrantyRequestDetailResponseModel } from '@/app/datamodels/WarrantyRequestDetailsModel';
import PageErrorCenterContent from '@/app/components/pageError';
import useSessionRedirect from '@/app/pro_utils/manage_session';
import LeftPanelMenus from '@/app/components/leftPanel';
import { getImageApiURL, staticIconsBaseURL, status_Duplicate, status_Pending, status_Rejected, status_Verified } from '@/app/pro_utils/string_constants';
import moment from 'moment';
import { RejectMSGMasterDataModel, StatusMasterDataModel } from '@/app/datamodels/CommonDataModels';
import { useRouter } from 'next/navigation';
import { FileViewer } from '@/app/components/DocViewer';
import DialogImagePop from '@/app/components/dialog_DocViewer';


interface formValues {
  status_id: any,
  comments: string
  rejection_id: any,
  warranty_start_date:any,
  warranty_end_date:any,
}


const WarrantyRequestDetails = () => {
  useSessionRedirect();

  const [isLoading, setLoading] = useState(true);
  const router = useRouter()
  const { auth_id } = useGlobalContext()
  const [showAlert, setShowAlert] = useState(false);
  const [showImagePop, setShowImagePop] = useState(false);
  const [imagePopURL, setImagePopURL] = useState('');
  const [alertForSuccess, setAlertForSuccess] = useState(0);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertStartContent, setAlertStartContent] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [navigateBack, setNavigateBack] = useState(false);
  const [cityError, setCityError] = useState('');
  // const [pageNumber, setPageNumber] = useState(1);
  // const [pageSize, setPageSize] = useState(10);
  const [warrantyRequestData, setWarrantyRequestData] = useState<WarrantyRequestDetailResponseModel>();
  const [statusMasterData, setStatusMasterData] = useState<StatusMasterDataModel[]>([]);
  const [rejectionMasterData, setRejectionMasterData] = useState<RejectMSGMasterDataModel[]>([]);
  const [formVal, setFormVal] = useState<formValues>({
    status_id: 0, comments: "", rejection_id: 0,warranty_start_date:"",warranty_end_date:""
  });
  const { selectedViewID } = useGlobalContext()
  const [errors, setErrors] = useState<Partial<formValues>>({});


  useEffect(() => {
    // fetchData(dataFilters.date, dataFilters.request_id, dataFilters.phone_no, dataFilters.name, dataFilters.status, dataFilters.page, dataFilters.limit);
    fetchData();

  }, [])

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/get_warranty_request_details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔥 Important for raw JSON
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({

          request_id: selectedViewID,

        }),
      });

      const response = await res.json();

      if (response.status == 1) {

        setWarrantyRequestData(response.data)
        console.log('current status----------------->', response.data.request[0].status_id);

        setFormVal({
          status_id: response.data.request[0].status_id,
          comments: '',
          rejection_id: 0,
          warranty_start_date:'',
          warranty_end_date:''
        });
      } else {
        setLoading(false);
        setShowAlert(true);
        setAlertTitle("Error")
        setAlertStartContent(response.message);
        setAlertForSuccess(2)
      }
      const statusRes = await fetch("/api/get_status_master", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
         body:JSON.stringify({
            "request_type":1
        })

      });
      const statuses = await statusRes.json();

      if (statuses.status == 1) {
        setStatusMasterData(statuses.data)
      }
      const rejectionRes = await fetch("/api/get_rejection_msgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body:JSON.stringify({
            "request_type":1
        })

      });
      const rejectres = await rejectionRes.json();

      if (rejectres.status == 1) {
        setRejectionMasterData(rejectres.data)
      }

      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
      setShowAlert(true);
      setAlertTitle("Exception")
      setAlertStartContent("Exception occured! Something went wrong.");
      setAlertForSuccess(2)
    }
  }

  const formatDateDDMMYYYY = (date: any, isTime = false) => {
    if (!date) return '';
    const parsedDate = moment(date);
    return parsedDate.format('DD-MM-YYYY');
  };

  const validate = () => {
    const newErrors: Partial<formValues> = {};

    if (!formVal.status_id) newErrors.status_id = "Status is required";
    if (formVal.status_id && formVal.status_id == status_Pending) newErrors.status_id = "Please change status";
    if (formVal.status_id && formVal.status_id == status_Rejected && !formVal.rejection_id) newErrors.rejection_id = "Please select rejection reason";
    if (formVal.rejection_id && formVal.rejection_id == 1 && !formVal.comments) newErrors.comments = "Please enter rejection reason";// here 1 is for other and need to add comments also

    console.log(newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  const UpdateCity = async (e: React.FormEvent) => {
    if (!pinCode) { setCityError("required"); return; };

    try {
      const response = await fetch("/api/set_city_manually", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({ pk_id: selectedViewID, changedPinCode: pinCode })
      });
      const resJson = await response.json();
      if (resJson && resJson.status == 1) {
        setLoading(false);
        setShowAlert(true);
        setAlertTitle("Success")
        setAlertStartContent(resJson.message);
        setAlertForSuccess(1);
        setNavigateBack(false)
      } else {
        setLoading(false);
        setShowAlert(true);
        setAlertTitle("Error")
        setAlertStartContent(resJson.message);
        setAlertForSuccess(2)
        setNavigateBack(false)
      }

    } catch (e: any) {
      setLoading(false);
      setShowAlert(true);
      setAlertTitle("Exception")
      setAlertStartContent(e.message);
      setAlertForSuccess(2)
      setNavigateBack(false)
    }

  }
  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    console.log("this is the form vals", formVal);
    if (!validate()) return;
    setLoading(true);
    let rejectionSelectedMsg=""
    for(let i=0;i<rejectionMasterData.length;i++){
      if(formVal.rejection_id==rejectionMasterData[i].pk_reject_id){
        rejectionSelectedMsg=rejectionMasterData[i].rejection_msg;
      }
    }
    // pk_request_id
    try {
      const response = await fetch("/api/update_warranty_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: formVal.status_id == status_Rejected ? JSON.stringify({
          auth_id: auth_id,
          pk_id: warrantyRequestData?.request[0].pk_request_id,
          comments: formVal.comments && formVal.comments.length>0?formVal.comments: rejectionSelectedMsg,
          selectedRejection:formVal.comments && formVal.comments.length>0 && rejectionSelectedMsg!=formVal.comments?rejectionSelectedMsg:"",
          status: formVal.status_id,
          request_id: warrantyRequestData?.request[0].request_id,
          request_type: warrantyRequestData?.request[0].request_type_id,
          rejection_id: formVal.rejection_id,
          rejection_other: formVal.comments,
          battery_serial_no:warrantyRequestData?.request[0].product_serial_no,
          isRejected: true,
          date_of_purchase:warrantyRequestData?.request[0].product_purchase_date?formatDate(warrantyRequestData?.request[0].product_purchase_date):"",
          customer_phone: warrantyRequestData?.request[0].user_phone
        }) : JSON.stringify({
          auth_id: auth_id,
          pk_id: warrantyRequestData?.request[0].pk_request_id,
          comments: formVal.comments,
          status: formVal.status_id,
          request_id: warrantyRequestData?.request[0].request_id,
          request_type: warrantyRequestData?.request[0].request_type_id,
          isRejected: false,
          isDuplicate: formVal.status_id == status_Duplicate ? true : false,
          customer_phone: warrantyRequestData?.request[0].user_phone,
          battery_serial_no:warrantyRequestData?.request[0].product_serial_no,
          date_of_purchase:warrantyRequestData?.request[0].product_purchase_date?formatDate(warrantyRequestData?.request[0].product_purchase_date):"",
          warranty_start_date:formVal.warranty_start_date,
          warranty_end_date:formVal.warranty_end_date

        }),
      });
      const resJson = await response.json();
      if (resJson && resJson.status == 1) {
        setLoading(false);
        setShowAlert(true);
        setAlertTitle("Success")
        setAlertStartContent(resJson.message);
        setAlertForSuccess(1)
        setNavigateBack(true)

      } else {
        setLoading(false);
        setShowAlert(true);
        setAlertTitle("Error")
        setAlertStartContent(resJson.message);
        setAlertForSuccess(2)
        setNavigateBack(false)

      }
    } catch (e: any) {
      setLoading(false);
      setNavigateBack(false)
      setShowAlert(true);
      setAlertTitle("Exception")
      setAlertStartContent(e.message);
      setAlertForSuccess(2)
    }
  }

  const handleInputChange = async (e: any) => {
    const { name, value } = e.target;


    setFormVal((prev) => ({ ...prev, [name]: value }));
  }

  function formatDate(inputDate: string,timeZone = 'Asia/Kolkata') {
    const date = new Date(inputDate);

    const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value;
    return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')} ${get('dayPeriod')}`;
  }

  return (
    <div>

      <LoadingDialog isLoading={isLoading} />
      {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
        setShowAlert(false)
        if (navigateBack) {
          router.back()
        }else{
          fetchData()
        }

      }} onCloseClicked={function (): void {
        setShowAlert(false)
      }} showCloseButton={false} successFailure={alertForSuccess} />}
      <LeftPanelMenus selectedMenu={2} showLeftPanel={false} rightBoxUI={
        <div className="container">
          <div className="row mt-4 mb-5">

            <div className="col-lg-12">
              <div className="row" id="top">
                <div className="col-lg-12 mb-5">
                  <div className="heading25" style={{ paddingLeft: "20px" }}>Requests Details</div>
                </div>

              </div>


              {warrantyRequestData && warrantyRequestData.addressedData && warrantyRequestData.request ?
                <div className="grey_box request_details_mainbox">
                  <div className='row'>
                    <div className="col-lg-8">
                      <div className="row">
                        <div className="col-lg-12 mb-4">
                          <div className="request_list_heading">
                            Customer Name: <span style={{ color: "#D93731" }}>{warrantyRequestData.request[0].user_name}</span>
                          </div>
                          <div className="request_list_heading" style={{ margin: "-42px 0px 0px 20px", backgroundColor: "#e6f6ff" }}>
                            Request ID: <span>{warrantyRequestData.request[0].request_id}</span>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        {/* <div className="col-lg-4 mb-3">
                          <div className="request_list">
                            Request ID:
                            <span>{warrantyRequestData.request[0].request_id}</span>
                          </div>
                        </div> */}
                        <div className="col-lg-4 mb-3">
                          <div className="request_list">
                            Purcahase Date:
                            <span>{formatDateDDMMYYYY(warrantyRequestData.request[0].product_purchase_date)}</span>
                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list">
                            Request Date:
                            <span>{formatDate(warrantyRequestData.request[0].created_at)}</span>

                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list">
                            Customer Phone:
                            <span>{warrantyRequestData.request[0].user_phone}</span>

                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list">
                            Request Type:
                            <span>{warrantyRequestData.request[0].request_type}</span>

                          </div>
                        </div>

                        <div className="col-lg-4 mb-3">
                          <div className="request_list ">
                            Serial Number:
                            <span>{warrantyRequestData.request[0].product_serial_no}</span>
                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list ">
                            Pin Code:
                            <span>{warrantyRequestData.request[0].user_pin_code}</span>
                          </div>
                        </div>
                        {warrantyRequestData.request[0].retailer_city_name && warrantyRequestData.request[0].retailer_city_name.length > 0 ? <div className="col-lg-4 mb-3">
                          <div className="request_list ">
                            City:
                            <span>{warrantyRequestData.request[0].retailer_city_name}</span>
                          </div>
                        </div> :
                          <div className="col-lg-12 mb-3">

                            <div className="request_list">
                              Pin code:
                              <div className="row mt-2">
                                <div className="col-lg-4 form_box">
                                  <input type="text" id="proposed_mrp" name="proposed_mrp" value={pinCode} onChange={(e) => setPinCode(e.target.value)} style={{padding:"8px"}}/>
                                  {cityError && <span className="error" style={{ color: "red" }}>{cityError}</span>}

                                </div>
                                <div className="col-lg-4 mt-2">
                                  <a className="blue_btn " style={{ cursor: "pointer", }} onClick={UpdateCity}>Add City</a>
                                </div>
                              </div>

                            </div>
                          </div>
                        }
                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-12">
                              <div className='masterrecord_heading'>Master Record</div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-12 pt-3 mb-4" style={{ backgroundColor: "#f5fdfb", borderRadius: "10px" }}>
                          <div className="row">
                            <div className="col-lg-4 mb-3">
                              <div className="request_list">
                                Request Status:
                                <span>{warrantyRequestData &&warrantyRequestData.request && warrantyRequestData.request.length>0 ?warrantyRequestData.request[0].request_status :"--"}</span>

                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Battery Model
                                <span>{warrantyRequestData.battery_details
                                  && warrantyRequestData.battery_details.length > 0 ?
                                  warrantyRequestData.battery_details[0].battery_model : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Varroc Part Code
                                <span>{warrantyRequestData.battery_details
                                  && warrantyRequestData.battery_details.length > 0 ? warrantyRequestData.battery_details[0].varroc_part_code : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Master Serial Number
                                <span>{warrantyRequestData.battery_details
                                  && warrantyRequestData.battery_details.length > 0 ? warrantyRequestData.battery_details[0].battery_serial_number : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Manufacturing Date
                                <span>{warrantyRequestData.battery_details
                                  && warrantyRequestData.battery_details.length > 0 ? warrantyRequestData.battery_details[0].manufacturing_date : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Proposed MRP
                                <span>{warrantyRequestData.battery_details
                                  && warrantyRequestData.battery_details.length > 0 ? warrantyRequestData.battery_details[0].proposed_mrp : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-12 mb-3">
                              <div className="request_list ">
                                Description
                                <span>{warrantyRequestData.battery_details
                                  && warrantyRequestData.battery_details.length > 0 ? warrantyRequestData.battery_details[0].battery_description : "--"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {warrantyRequestData.duplicate_data && warrantyRequestData.duplicate_data.length > 0 && <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-12">
                              <div className='masterrecord_heading'>Duplicate Record</div>
                            </div>
                          </div>
                        </div>}
                        {warrantyRequestData.duplicate_data && warrantyRequestData.duplicate_data.map((duplicates, index) => (
                          <div className="col-lg-12 pt-3 mb-4" style={{ backgroundColor: "#f5fdfb", borderRadius: "10px" }}>

                            <div className="row">
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Reference ID
                                  <span>{duplicates.request_id}</span>
                                </div>
                              </div>
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Request Status:
                                  <span>{duplicates.request_status}</span>

                                </div>
                              </div>
                              <div className="col-lg-4 mb-3">
                                <div className="request_list ">
                                  Updated By:
                                  <span>{duplicates.addressed_id || "--"}</span>
                                </div>
                              </div>


                            </div>
                          </div>))}

                        {warrantyRequestData.battery_details.length == 0 && <div className="request_list_heading mb-4 ml-3" style={{ width: "auto", margin: "0" }}>
                          <span style={{ color: "#D93731" }}>Serial Number does not match</span>
                        </div>}

                      </div>
                      {warrantyRequestData.request[0].status_id != status_Pending ?
                        <div>
                          <div className="row" style={{ backgroundColor: "#fffaf1", padding: "12px 4px", borderRadius: "10px" }}>
                            <div className="row">
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Request Status:
                                  <span>{warrantyRequestData &&warrantyRequestData.addressedData && warrantyRequestData.addressedData.length>0 ?warrantyRequestData.addressedData[warrantyRequestData.addressedData.length-1].request_status:"--"}</span>
                                </div>
                              </div>
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Updated By:
                                  <span>{warrantyRequestData &&warrantyRequestData.addressedData && warrantyRequestData.addressedData.length>0 ?warrantyRequestData.addressedData[warrantyRequestData.addressedData.length-1].addressedBY:"--"}</span>
                                </div>
                              </div>
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Updated Date:
                                  <span>{warrantyRequestData &&warrantyRequestData.addressedData && warrantyRequestData.addressedData.length>0 ?formatDate(warrantyRequestData.addressedData[warrantyRequestData.addressedData.length-1].updated_at):"--"}</span>
                                </div>
                              </div>
                              {warrantyRequestData &&warrantyRequestData.addressedData && warrantyRequestData.addressedData.length>0 && warrantyRequestData.addressedData[warrantyRequestData.addressedData.length-1].fk_rejection_id ? <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Rejection reason:
                                  <span>{warrantyRequestData.addressedData[0].rejection_msg}</span>
                                </div>
                              </div> : <></>}
                              
                              {warrantyRequestData &&warrantyRequestData.addressedData && warrantyRequestData.addressedData.length>0 && warrantyRequestData.addressedData[warrantyRequestData.addressedData.length-1].other_rejection && warrantyRequestData.addressedData[warrantyRequestData.addressedData.length-1].other_rejection.length > 0 && 
                              <div className="col-lg-8 mb-3">
                                <div className="request_list">
                                  Comments:
                                  <span>{warrantyRequestData.addressedData[warrantyRequestData.addressedData.length-1].comments}</span>
                                </div>
                              </div>}
                              {/* <div className="col-lg-4 mb-3">
                            <div className="request_list">
                              Rejected Reason:
                              <span>{warrantyRequestData.addressedData[0]}</span>
                            </div>
                          </div> */}
                            </div>
                          </div>
                        </div> : <></>

                      }

                      {warrantyRequestData.request[0].status_id == status_Pending || warrantyRequestData.request[0].status_id == status_Duplicate ?
                        <div>
                          {/* <form onSubmit={handleSubmit}> */}
                            <div className="row" style={{ backgroundColor: "#fffaf1", padding: "12px 4px", borderRadius: "10px" }}>
                              <div className="row">
                                <div className="col-lg-6 mb-3">


                                  <div className="col-lg-12 mb-1" style={{ fontFamily: "GothamMedium" }}>Status:</div>
                                  <div className="col-lg-12 mb-3">
                                    <div className='form_box'>
                                      <select id="status_id" name="status_id" value={formVal.status_id} onChange={handleInputChange}>
                                        <option value="">Select</option>
                                        {statusMasterData.map((singleStatus) => (
                                          <option value={singleStatus.status_id} key={singleStatus.status_id}>{singleStatus.status}</option>
                                        ))}
                                      </select>
                                      {errors.status_id && <span className="error" style={{ color: "red" }}>{errors.status_id}</span>}

                                    </div>
                                  </div>
                                </div>
                                {formVal.status_id == status_Rejected &&
                                  <div className="col-lg-5">
                                    <div className="col-lg-12 mb-1" style={{ fontFamily: "GothamMedium" }}>Rejection Cause:</div>
                                    <div className="col-lg-12 mb-3">
                                      <div className='form_box'>
                                        <select id="rejection_id" name="rejection_id" onChange={handleInputChange}>
                                          <option value="">Select</option>
                                          {rejectionMasterData.map((rejectMSG) => (
                                            <option value={rejectMSG.pk_reject_id} key={rejectMSG.pk_reject_id}>{rejectMSG.rejection_msg}</option>
                                          ))}
                                        </select>
                                        {errors.rejection_id && <span className="error" style={{ color: "red" }}>{errors.rejection_id}</span>}

                                      </div>
                                    </div>
                                  </div>}
                                {formVal.status_id== status_Verified &&
                                 <div className="col-lg-5">
                                    <div className="col-lg-12 mb-1" style={{ fontFamily: "GothamMedium" }}>Warranty Start Date:</div>
                                    <div className="col-lg-12 mb-3">
                                      <div className='form_box'>
                                    <input type="date" id="date" name="date" value={formVal.warranty_start_date} onChange={handleInputChange} />
                                  </div>
                                  </div>
                                </div>
                                }
                                {formVal.status_id== status_Verified &&
                                 <div className="col-lg-5">
                                    <div className="col-lg-12 mb-1" style={{ fontFamily: "GothamMedium" }}>Warranty End Date:</div>
                                    <div className="col-lg-12 mb-3">
                                      <div className='form_box'>
                                      <input type="date" id="date" name="date" value={formVal.warranty_end_date} onChange={handleInputChange} />
                                  </div>
                                </div>
                                </div>
                                }  
                              </div>

                              <div className="col-lg-12 mb-1 mt-3" style={{ fontFamily: "GothamMedium" }}>Any Comment:</div>
                              <div className="col-lg-11 mb-2">
                                <div className='form_box'>
                                  <textarea name="comments" id="comments" value={formVal.comments} style={{ width: "100%", height: "75px" }} onChange={(e) => setFormVal((prev) => ({ ...prev, ["comments"]: e.target.value }))}></textarea>
                                  {errors.comments && <span className="error" style={{ color: "red" }}>{errors.comments}</span>}

                                </div>
                              </div>
                              <div className="col-lg-11">
                                <button className="blue_btn" onClick={(e) => handleSubmit(e)}>Submit</button>
                                <button className="blue_btn m-2" onClick={() => {
                                  router.back();
                                }}>Back</button>
                              </div>

                            </div>
                          {/* </form> */}
                        </div> : <></>
                      }



                    </div>
                    <div className="col-lg-4 text-center">

                      {warrantyRequestData?.images && warrantyRequestData?.images.length > 0 &&
                        warrantyRequestData?.images.map((imageURL, index) =>
                          <div className="invoice_attach_box">
                            <FileViewer fileUrl={imageURL.image_url.includes("uploads")? getImageApiURL + "/" + imageURL.image_url:imageURL.image_url} isDialogView={false} set_height={150} key={index} /><br></br>
                            <button className="blue_btn" onClick={() => { setShowImagePop(true); setImagePopURL(imageURL.image_url) }}>View</button>

                          </div>
                        )}
                    </div>
                  </div>
                  {showImagePop && <DialogImagePop
                    fileURL={imagePopURL} onDownloadClicked={function (): void {

                    }} onCloseClicked={function (): void {
                      setShowImagePop(false);
                    }} />}
                </div>

                : <PageErrorCenterContent content={isLoading ? "" : "Failed to load data"} />}



            </div>

          </div>
        </div>
      } />

    </div >
  )
}

export default WarrantyRequestDetails
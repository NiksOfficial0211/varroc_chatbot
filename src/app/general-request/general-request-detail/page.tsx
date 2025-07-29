
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
import { general_status_pending, general_status_responded, getImageApiURL, lead_status_contacted, lead_status_disqualified, lead_status_new, lead_status_qualified, staticIconsBaseURL, status_Duplicate, status_Pending, status_Rejected } from '@/app/pro_utils/string_constants';
import moment from 'moment';
import { RejectMSGMasterDataModel, StatusMasterDataModel } from '@/app/datamodels/CommonDataModels';
import { useRouter } from 'next/navigation';
import { FileViewer } from '@/app/components/DocViewer';
import DialogImagePop from '@/app/components/dialog_DocViewer';
import { ComplaintDetailDataModel, ComplaintListDataModel } from '@/app/datamodels/ComplaintsDataModel';
import { DealershipEnqDetailDataModel } from '@/app/datamodels/DealershipEnqDataModel';
import { GeneralEnqDetailDataModel } from '@/app/datamodels/GenerealEnquiryDataModel';


interface formValues {
  status_id: any,
  comments: any
  rejection_id: any
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
  const [generalDetailResponse, setLeadDetailsRes] = useState<GeneralEnqDetailDataModel>();
  const [statusMasterData, setStatusMasterData] = useState<StatusMasterDataModel[]>([]);
  const [rejectionMasterData, setRejectionMasterData] = useState<RejectMSGMasterDataModel[]>([]);
  const [formVal, setFormVal] = useState<formValues>({
    status_id: 0, comments: "", rejection_id: 0
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
      const res = await fetch("/api/get_general_requests_details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔥 Important for raw JSON
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({

          pk_id: selectedViewID,

        }),
      });

      const response = await res.json();

      if (response.status == 1) {

        setLeadDetailsRes(response.data)

        setFormVal({
          status_id: response.data.enq_data[0].status_id,
          comments: '',
          rejection_id: 0
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
        body: JSON.stringify({
          "request_type": 4
        })

      });
      const statuses = await statusRes.json();

      if (statuses.status == 1) {
        setStatusMasterData(statuses.data)
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
    return parsedDate.format('YYYY-MM-DD');
  };

  const validate = () => {
    const newErrors: Partial<formValues> = {};

    if (!formVal.status_id) newErrors.status_id = "Status is required";
    // if(formVal.status_id && formVal.status_id==0 || formVal.status_id==general_status_pending)newErrors.status_id="Please select other status to update"
    if (!formVal.comments) newErrors.status_id = "Please enter comments"
    // if (formVal.status_id && formVal.status_id == status_Pending) newErrors.status_id = "Please change status";
    // if (formVal.status_id && formVal.status_id == status_Rejected && !formVal.rejection_id) newErrors.rejection_id = "Please select rejection reason";
    // if (formVal.rejection_id && formVal.rejection_id == 1 && !formVal.comments) newErrors.comments = "Please enter rejection reason";// here 1 is for other and need to add comments also

    console.log(newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    console.log("this is the form vals", formVal);
    if (!validate()) return;
    setLoading(true);

    // pk_request_id
    try {
      const response = await fetch("/api/update_general_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body:
          JSON.stringify({
            auth_id: auth_id,
            pk_id: generalDetailResponse?.enq_data[0].pk_id,
            comments: formVal.comments,
            status: formVal.status_id,
            request_id: generalDetailResponse?.enq_data[0].general_id,

          })


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

  function formatDate(inputDate: string, timeZone = 'Asia/Kolkata') {
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

  const UpdateCity = async (e: React.FormEvent) => {
    if (!pinCode) { setCityError("required"); return; } else {
      setCityError("");
    };

    try {
      setLoading(true);
      const response = await fetch("/api/set_city_manually", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({ pk_id: selectedViewID, changedPinCode: pinCode, update_type: 3 })
      });
      const resJson = await response.json();
      if (resJson && resJson.status == 1) {
        setPinCode("");
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

  return (
    <div>

      <LoadingDialog isLoading={isLoading} />
      {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
        setShowAlert(false)
        if (navigateBack) {
          router.back()
        } else {
          fetchData()
        }

      }} onCloseClicked={function (): void {
        setShowAlert(false)
      }} showCloseButton={false} successFailure={alertForSuccess} />}
      <LeftPanelMenus selectedMenu={8} showLeftPanel={false} headertitle='General Details' rightBoxUI={
        <div className="container">
          <div className="row mt-4 mb-5">

            <div className="col-lg-12">
              <div className="row" id="top">
                <div className="col-lg-12 mb-5">
                  <div className="heading25" style={{ paddingLeft: "20px" }}>General Enquiry Details</div>
                </div>

              </div>


              {generalDetailResponse && generalDetailResponse.addressed_data ?
                <div className="grey_box request_details_mainbox">
                  <div className='row'>
                    <div className="col-lg-12">
                      <div className="row">
                        <div className="col-lg-12 mb-4">

                          <div className="request_list_heading" style={{ margin: "-42px 0px 0px 20px", backgroundColor: "#e6f6ff" }}>
                            Enquiry ID: <span>{generalDetailResponse.enq_data[0].general_id}</span>
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
                            Enquiry Date:
                            <span>{formatDate(generalDetailResponse.enq_data[0].created_at)}</span>

                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list">
                            Customer Phone:
                            <span>{generalDetailResponse.enq_data[0].customer_name}</span>

                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list">
                            Customer Phone:
                            <span>{generalDetailResponse.enq_data[0].contact_no}</span>

                          </div>
                        </div>

                        <div className="col-lg-4 mb-3">
                          <div className="request_list ">
                            Pincode:
                            <span>{generalDetailResponse.enq_data[0].pincode}</span>
                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list ">
                            City:
                            <span>{generalDetailResponse.enq_data[0].city}</span>
                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list ">
                            State:

                            <span>{generalDetailResponse.enq_data[0].state ? generalDetailResponse.enq_data[0].state.charAt(0).toUpperCase() + generalDetailResponse.enq_data[0].state.replace("_", " ").slice(1).toLowerCase() : "--"}</span>
                          </div>
                        </div>
                        {generalDetailResponse.enq_data[0].status_id == general_status_pending && <div className="col-lg-8 mb-3">

                          <div className="request_list">
                            Pin code:
                            <div className="row mt-2">
                              <div className="col-lg-4 form_box">
                                <input type="text" id="proposed_mrp" name="proposed_mrp" value={pinCode} onChange={(e) => setPinCode(e.target.value)} style={{ padding: "8px" }} />
                                {cityError && <span className="error" style={{ color: "red" }}>{cityError}</span>}

                              </div>
                              <div className="col-lg-4 mt-2">
                                <a className="blue_btn " style={{ cursor: "pointer", }} onClick={UpdateCity}>Add City</a>
                              </div>
                            </div>

                          </div>
                        </div>}

                        <div className="col-lg-6 mb-3">
                          <div className="request_list ">
                            Description:

                            <span>{generalDetailResponse.enq_data[0].description ? generalDetailResponse.enq_data[0].description : "--"}</span>
                          </div>
                        </div>

                        {generalDetailResponse.duplicate_data && generalDetailResponse.duplicate_data.length > 0 && <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-12">
                              <div className='masterrecord_heading'>Previous Request</div>
                            </div>
                          </div>
                        </div>}
                        {generalDetailResponse.duplicate_data && generalDetailResponse.duplicate_data.map((duplicates, index) => (
                          <div className="col-lg-12 pt-3 mb-4" style={{ backgroundColor: "#f5fdfb", borderRadius: "10px" }} key={index}>

                            <div className="row">
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Enquiry ID
                                  <span>{duplicates.dup_general.general_id}</span>
                                </div>
                              </div>
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Request Status:
                                  <span>{duplicates.dup_general.request_status}</span>

                                </div>
                              </div>
                              <div className="col-lg-4 mb-3">
                                <div className="request_list ">
                                  Updated By:
                                  <span>{duplicates.addressedData && duplicates.addressedData.length > 0 ? duplicates.addressedData[duplicates.addressedData.length - 1].addressedBY || "--" : "--"}</span>
                                </div>
                              </div>


                            </div>
                          </div>))}
                      </div>
                      {generalDetailResponse.addressed_data && generalDetailResponse.addressed_data.length > 0 && generalDetailResponse.enq_data[0].status_id != status_Pending ?
                        <div>
                          <div className="row" style={{ backgroundColor: "#fffaf1", padding: "12px 4px", borderRadius: "10px" }}>
                            <div className="row">
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Request Status:
                                  <span>{generalDetailResponse.addressed_data[generalDetailResponse.addressed_data.length-1].request_status}</span>
                                </div>
                              </div>

                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Updated By:
                                  <span>{generalDetailResponse.addressed_data[generalDetailResponse.addressed_data.length-1].addressedBY}</span>
                                </div>
                              </div>
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Updated Date:
                                  <span>{formatDate(generalDetailResponse.addressed_data[generalDetailResponse.addressed_data.length-1].updated_at)}</span>
                                </div>
                              </div>
                              <div className="col-lg-12 mb-3">
                                <div className="request_list">
                                  Request Comments:
                                  <span>{generalDetailResponse.addressed_data[generalDetailResponse.addressed_data.length-1].comments}</span>
                                </div>
                              </div>



                            </div>
                          </div>
                        </div> : <></>

                      }

                      {generalDetailResponse.enq_data[0].status_id == general_status_pending || generalDetailResponse.enq_data[0].status_id == general_status_responded ?
                        <div>
                          <form onSubmit={handleSubmit}>
                            <div className="row" style={{ backgroundColor: "#fffaf1", padding: "12px 4px", borderRadius: "10px" }}>
                              <div className="row">
                                <div className="col-lg-6">


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
                                {formVal.status_id == lead_status_disqualified &&
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
                          </form>
                        </div> : <></>
                      }



                    </div>

                  </div>

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
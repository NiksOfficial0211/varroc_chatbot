
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
import { complaint_status_closed, getImageApiURL, staticIconsBaseURL, status_Duplicate, status_Pending, status_Rejected } from '@/app/pro_utils/string_constants';
import moment from 'moment';
import { RejectMSGMasterDataModel, StatusMasterDataModel } from '@/app/datamodels/CommonDataModels';
import { useRouter } from 'next/navigation';
import { FileViewer } from '@/app/components/DocViewer';
import DialogImagePop from '@/app/components/dialog_DocViewer';
import { ComplaintDetailDataModel, ComplaintListDataModel } from '@/app/datamodels/ComplaintsDataModel';


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
  const [complaintData, setComplaintData] = useState<ComplaintDetailDataModel>();
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
      const res = await fetch("/api/get_complaint_detail", {
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

        setComplaintData(response.data)

        setFormVal({
          status_id: response.data.complaint_data[0].status_id,
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
          "request_type": 2
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
    if (formVal.status_id && formVal.status_id == status_Pending) newErrors.status_id = "Please change status";
    if (formVal.status_id && formVal.status_id == status_Rejected && !formVal.rejection_id) newErrors.rejection_id = "Please select rejection reason";
    if (formVal.rejection_id && formVal.rejection_id == 1 && !formVal.comments) newErrors.comments = "Please enter rejection reason";// here 1 is for other and need to add comments also

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
      const response = await fetch("/api/update_warranty_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({

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

  function formatDate(date: Date): string {
    // return date.toISOString().slice(0, 19).replace("T", " ");
    const localDate = new Date(date); // assumes input is a Date object (still in UTC under the hood)

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
      <LeftPanelMenus selectedMenu={2} showLeftPanel={false} rightBoxUI={
        <div className="container">
          <div className="row mt-4 mb-5">

            <div className="col-lg-12">
              <div className="row" id="top">
                <div className="col-lg-12 mb-5">
                  <div className="heading25" style={{ paddingLeft: "20px" }}>Complaint Details</div>
                </div>

              </div>


              {complaintData && complaintData.addressedData && complaintData ?
                <div className="grey_box request_details_mainbox">
                  <div className='row'>
                    <div className="col-lg-8">
                      <div className="row">
                        <div className="col-lg-12 mb-4">

                          <div className="request_list_heading" style={{ margin: "-42px 0px 0px 20px", backgroundColor: "#e6f6ff" }}>
                            Complaint ID: <span>{complaintData.complaint_data[0].complaint__id}</span>
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
                            Request Date:
                            <span>{formatDateDDMMYYYY(complaintData.complaint_data[0].created_at)}</span>

                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list">
                            Customer Phone:
                            <span>{complaintData.complaint_data[0].user_phone || "--"}</span>

                          </div>
                        </div>

                        <div className="col-lg-4 mb-3">
                          <div className="request_list ">
                            Serial Number:
                            <span>{complaintData.complaint_data[0].battery_serial_no}</span>
                          </div>
                        </div>
                        <div className="col-lg-4 mb-3">
                          <div className="request_list ">
                            Complaint Type:
                            <span>{complaintData.complaint_data[0].complaint_type}</span>
                          </div>
                        </div>
                        <div className="col-lg-8 mb-3">
                          <div className="request_list ">
                            Description:
                            <span>{complaintData.complaint_data[0].complaint_description || "--"}</span>
                          </div>
                        </div>

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
                                <span>{complaintData.complaint_data[0].request_status}</span>

                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Battery Model
                                <span>{complaintData.battery_details
                                  && complaintData.battery_details.length > 0 ?
                                  complaintData.battery_details[0].battery_model : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Varroc Part Code
                                <span>{complaintData.battery_details
                                  && complaintData.battery_details.length > 0 ? complaintData.battery_details[0].varroc_part_code : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Master Serial Number
                                <span>{complaintData.battery_details
                                  && complaintData.battery_details.length > 0 ? complaintData.battery_details[0].battery_serial_number : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Manufacturing Date
                                <span>{complaintData.battery_details
                                  && complaintData.battery_details.length > 0 ? complaintData.battery_details[0].manufacturing_date : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-4 mb-3">
                              <div className="request_list ">
                                Proposed MRP
                                <span>{complaintData.battery_details
                                  && complaintData.battery_details.length > 0 ? complaintData.battery_details[0].proposed_mrp : "--"}</span>
                              </div>
                            </div>
                            <div className="col-lg-12 mb-3">
                              <div className="request_list ">
                                Description
                                <span>{complaintData.battery_details
                                  && complaintData.battery_details.length > 0 ? complaintData.battery_details[0].battery_description : "--"}</span>
                              </div>
                            </div>
                          </div>
                        </div>


                        <div className="col-lg-12">
                          <div className="row">
                            <div className="col-lg-12">
                              <div className='masterrecord_heading'>Previous/Duplicate Request</div>
                            </div>
                          </div>
                        </div>
                        {complaintData.duplicate_data && complaintData.duplicate_data.map((duplicates, index) => (
                          <div className="col-lg-12 pt-3 mb-4" style={{ backgroundColor: "#f5fdfb", borderRadius: "10px" }}>

                            <div className="row">
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Reference ID
                                  <span>{duplicates.complaint__id}</span>
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

                        {complaintData.battery_details.length == 0 && <div className="request_list_heading mb-4 ml-3" style={{ width: "auto", margin: "0" }}>
                          <span style={{ color: "#D93731" }}>Serial Number does not match</span>
                        </div>}

                      </div>
                      {complaintData.addressedData && complaintData.addressedData.length > 0 && complaintData.complaint_data[0].status_id != status_Pending ?
                        <div>
                          <div className="row" style={{ backgroundColor: "#fffaf1", padding: "12px 4px", borderRadius: "10px" }}>
                            <div className="row">
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Request Status:
                                  <span>{complaintData.addressedData[0].request_status}</span>
                                </div>
                              </div>
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Updated By:
                                  <span>{complaintData.addressedData[0].addressedBY}</span>
                                </div>
                              </div>
                              <div className="col-lg-4 mb-3">
                                <div className="request_list">
                                  Updated Date:
                                  <span>{formatDate(new Date(complaintData.addressedData[0].updated_at))}</span>
                                </div>
                              </div>



                            </div>
                          </div>
                        </div> : <></>

                      }

                      {complaintData.complaint_data[0].status_id != complaint_status_closed ?
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
                    <div className="col-lg-4 text-center">

                      {complaintData?.images && complaintData?.images.length > 0 &&

                        complaintData?.images.map((imageURL, index) =>
                          <div className="invoice_attach_box">
                            <FileViewer fileUrl={imageURL.image_url.includes("uploads") ? getImageApiURL + "/" + imageURL.image_url : imageURL.image_url} isDialogView={false} set_height={150} key={index} /><br></br>
                            <button className="blue_btn" onClick={() => { setShowImagePop(true); setImagePopURL(imageURL.image_url) }}>View</button>

                          </div>

                          // <div className="invoice_attach_box">
                          //   <FileViewer fileUrl={complaintData?.complaint_data[0].document_url.includes("uploads")? getImageApiURL + "/" + complaintData?.complaint_data[0].document_url:complaintData?.complaint_data[0].document_url} isDialogView={false} set_height={150} /><br></br>
                          //   <button className="blue_btn" onClick={() => { setShowImagePop(true); setImagePopURL(complaintData?.complaint_data[0].document_url) }}>View</button>

                          // </div>
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
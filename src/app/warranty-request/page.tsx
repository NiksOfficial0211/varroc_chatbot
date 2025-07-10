'use client'
import React, { useEffect, useState } from 'react'
import HeaderComponent from '../components/header';
import LoadingDialog from '../components/PageLoader';
import ShowAlertMessage from '../components/alert';
import { WarrantyRequestDataModel } from '../datamodels/WarrantyReqestListDataModel';
import { data } from 'jquery';
import { staticIconsBaseURL, status_Rejected } from '../pro_utils/string_constants'
import { useGlobalContext } from '../contextProviders/globalContext';
import { useRouter } from 'next/navigation';
import { pageURL_WarrantyRequestDetails } from '../pro_utils/string_routes';
import useSessionRedirect from '../pro_utils/manage_session';
import LeftPanelMenus from '../components/leftPanel';
import moment from 'moment';
import { RejectMSGMasterDataModel, StatusMasterDataModel } from '../datamodels/CommonDataModels';

interface DataFilters {
  date: any, request_id: any, phone_no: any, name: any, status: any, reject_id: any, page: any, limit: any
}

const WarrantyRequestListing = () => {
  useSessionRedirect();

  const [isLoading, setLoading] = useState(false);
  const { auth_id, userName, setGlobalState } = useGlobalContext();
  const [isChecked, setIsChecked] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertForSuccess, setAlertForSuccess] = useState(0);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertStartContent, setAlertStartContent] = useState('');
  // const [pageNumber, setPageNumber] = useState(1);
  // const [pageSize, setPageSize] = useState(10);
  const [warrantyRequestData, setWarrantyRequestData] = useState<WarrantyRequestDataModel[]>([]);
  const [statusMasterData, setStatusMasterData] = useState<StatusMasterDataModel[]>([]);
  const [rejectionMasterData, setRejectionMasterData] = useState<RejectMSGMasterDataModel[]>([]);

  const [dataFilters, setDataFilters] = useState<DataFilters>({
    date: '', request_id: '', phone_no: '', name: '', status: '', reject_id: '', page: 1, limit: 10

  });
  const [hasMoreData, setHasMoreData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // fetchData(dataFilters.date, dataFilters.request_id, dataFilters.phone_no, dataFilters.name, dataFilters.status, dataFilters.page, dataFilters.limit);
    fetchData(dataFilters.page);

  }, [])

  // const fetchData = async (date: any, request_id: any, phone_no: any, name: any, status: any, page: any, limit: any) => {
  const fetchData = async (page: any) => {
    setLoading(true);
    try {
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
      const res = await fetch("/api/get_warranty_requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔥 Important for raw JSON
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({
          date: dataFilters.date,
          request_id: dataFilters.request_id,
          phone_no: dataFilters.phone_no,
          name: dataFilters.name,
          status: dataFilters.status,
          reject_id: dataFilters.reject_id,
          page: dataFilters.page == page ? dataFilters.page : page,
          limit: dataFilters.limit
        }),
      });

      const response = await res.json();

      if (response.status == 1 && response.data.length > 0) {
        setLoading(false);

        setWarrantyRequestData(response.data)
        if (response.data.length < dataFilters.limit) {
          setHasMoreData(false);

        } else {
          setHasMoreData(true);
        }
      } else if (response.status == 1 && response.data.length == 0) {
        setLoading(false);
        setWarrantyRequestData([])
        setDataFilters((prev) => ({ ...prev, ['page']: dataFilters.page }))

        setHasMoreData(false);
      }
      else {
        setDataFilters((prev) => ({ ...prev, ['pageNumber']: response.pageNumber }))


        setHasMoreData(false)
        setLoading(false);
        setShowAlert(true);
        setAlertTitle("Error")
        setAlertStartContent(response.message);
        setAlertForSuccess(2)

      }
    } catch (e) {
      setLoading(false);
      setShowAlert(true);
      setAlertTitle("Exception")
      setAlertStartContent("Exception occured! Something went wrong.");
      setAlertForSuccess(2)
    }
  }

  function changePage(page: any) {
    if (hasMoreData) {
      setDataFilters((prev) => ({ ...prev, ['page']: dataFilters.page + page }))
      fetchData(dataFilters.page + page);
    }
    else if (!hasMoreData && dataFilters.page > 1) {
      setDataFilters((prev) => ({ ...prev, ['page']: dataFilters.page + page }))
      fetchData(dataFilters.page + page);
    }

  }

  const handleInputChange = async (e: any) => {
    const { name, value } = e.target;
    // console.log("Form values updated:", formValues);
    setDataFilters((prev) => ({ ...prev, [name]: value }));
  }
  const resetFilter = async () => {

    window.location.reload();
    setDataFilters({

      date: '', request_id: '', phone_no: '', name: '', status: '', reject_id: '', page: 1, limit: 10
    });
    fetchData(dataFilters.page);
  }

  function formatDateYYYYMMDD(inputDate: string,timeZone = 'Asia/Kolkata') {
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

  const downloadExport = async () => {

    setLoading(true);
    const response = await fetch("/api/export-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // 🔥 Important for raw JSON
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
      },
      body: JSON.stringify({
        date: dataFilters.date,
          request_id: dataFilters.request_id,
          phone_no: dataFilters.phone_no,
          name: dataFilters.name,
          status: dataFilters.status,
          reject_id: dataFilters.reject_id,
      }),
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "warranty_requests.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setLoading(false);
  };


  return (
    <div>

      <LoadingDialog isLoading={isLoading} />
      {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
        setShowAlert(false)

      }} onCloseClicked={function (): void {
        setShowAlert(false)
      }} showCloseButton={false} successFailure={alertForSuccess} />}

      <LeftPanelMenus selectedMenu={2} showLeftPanel={false} rightBoxUI={
        <div className="container warranty_mainbox">
          <div className="row mt-4">
            <div className="col-lg-12">

              <div className="row" id="top">
                
                  <div className="col-lg-12 mb-3">
                    <div className="heading25">
                      Requests
                      <button className="blue_btn" style={{ float: "right" }} onClick={downloadExport}>Export Data</button>
                    </div>
                </div>

                <div className="col-lg-12 mb-4 ">
                  <div className="attendance_filter_box" id="filter_whitebox_open">
                    <div className="row" style={{ alignItems: "center" }}>

                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Reference ID: </label>
                          <input type="text" id="request_id" name="request_id" value={dataFilters.request_id} onChange={handleInputChange} />
                        </div>
                      </div>

                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Customer Name: </label>
                          <input type="text" id="name" name="name" value={dataFilters.name} onChange={handleInputChange} />
                        </div>
                      </div>

                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Customer Phone: </label>
                          <input type="text" id="phone_no" name="phone_no" value={dataFilters.phone_no} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Status: </label>
                          <select id="status" name="status" onChange={handleInputChange}>
                            <option value="">Select</option>
                            {statusMasterData.map((singleStatus) => (
                              <option value={singleStatus.status_id} key={singleStatus.status_id}>{singleStatus.status}</option>
                            ))}
                          </select>
                          {/* <input type="text" id="status" name="status" value={dataFilters.status} onChange={handleInputChange} /> */}
                        </div>
                      </div>
                      {dataFilters.status && dataFilters.status==status_Rejected && <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label"> Rejection Reason: </label>
                          <select id="reject_id" name="reject_id" onChange={handleInputChange}>
                            <option value="">Select</option>
                            {rejectionMasterData.map((rejectMSG) => (
                              <option value={rejectMSG.pk_reject_id} key={rejectMSG.pk_reject_id}>{rejectMSG.rejection_msg}</option>
                            ))}
                          </select>
                          {/* <input type="text" id="status" name="status" value={dataFilters.status} onChange={handleInputChange} /> */}
                        </div>
                      </div>}
                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Date: </label>
                          <input type="date" id="date" name="date" value={dataFilters.date} onChange={handleInputChange} />
                        </div>
                      </div>

                      <div className="col-lg-12 pt-4">
                        <div style={{float:"right", margin:"0 0 -30px 0"}}>
                          <a className="blue_btn" onClick={() => { fetchData(dataFilters.page); }}>Submit</a> <a className="blue_btn" onClick={() => resetFilter()}>Reset</a>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
              <div className="row mb-3">
                <div className="col-lg-12">
                  <div className="grey_box" style={{ backgroundColor: "#fff", position:"relative", padding:"20px 60px 20px 30px" }}>
                    <div className="row list_label mb-4">
                      <div className="col-lg-3 text-center"><div className="label">Reference <br></br>ID</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Reference <br></br>Date</div></div>
                      <div className="col-lg-1 text-center"><div className="label">Customer <br></br>Name</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Customer <br></br>Phone</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Comments</div></div>
                      <div className="col-lg-1 text-center"><div className="label">Status</div></div>
                      <div className="col-lg-1 text-center"><div className="label">Reason </div></div>
                      {/* <div className="col-lg-1 text-center"><div className="label">Action</div></div> */}

                    </div>

                    {warrantyRequestData && warrantyRequestData.length > 0 &&
                      warrantyRequestData.map((request) => (
                        <div className="row list_listbox" style={{ alignItems: "center", cursor: "pointer" }} key={request.pk_request_id} onClick={() => { }}>
                          <div className="col-lg-3 text-center"><div className="label">{request.request_id}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{formatDateYYYYMMDD(request.created_at)}</div></div>
                          <div className="col-lg-1 text-center"><div className="label">{request.user_name}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{request.user_phone}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{request.addressedDetails && request.addressedDetails.length > 0 ? request.addressedDetails[0].comments : "--"}</div></div>
                          <div className="col-lg-1 text-center"><div className="label">{request.addressedDetails && request.addressedDetails.length > 0 ? request.addressedDetails[0].request_status : request.request_status}</div></div>
                          <div className="col-lg-1 text-center"><div className="label">{request.addressedDetails && request.addressedDetails.length > 0 && request.status_id == status_Rejected ? request.addressedDetails[0].rejection_msg && request.addressedDetails[0].rejection_msg.length > 0 ? request.addressedDetails[0].rejection_msg : request.addressedDetails[0].other_rejection : "--"}</div></div>
                          <div className=""><div className="label viewbtn" onClick={() => {
                            setGlobalState({
                              selectedViewID: request.pk_request_id + '',
                              auth_id: auth_id,
                              userName: userName
                            });
                            router.push(pageURL_WarrantyRequestDetails);
                          }}><img src={staticIconsBaseURL + "/images/view_icon.png"} alt="Varroc Excellence" className="img-fluid" style={{ maxHeight: "18px" }} /></div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-lg-12">
                  <div className="pagination_box mb-3">
                    <div className={dataFilters.page > 1 ? " pagi_btn" : "pagi_btn btn_no"} onClick={() => { dataFilters.page > 1 && changePage(-1); }}>Prev</div>
                    <div className="btn_count">{dataFilters.page}</div>
                    <div className={hasMoreData ? "pagi_btn" : "pagi_btn btn_no"} onClick={() => { hasMoreData && changePage(1); }}>Next</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      } />
    </div>
  )
}

export default WarrantyRequestListing
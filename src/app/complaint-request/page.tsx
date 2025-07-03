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
import { pageURL_ComplaintDetails, pageURL_WarrantyRequestDetails } from '../pro_utils/string_routes';
import useSessionRedirect from '../pro_utils/manage_session';
import LeftPanelMenus from '../components/leftPanel';
import moment from 'moment';
import { RejectMSGMasterDataModel, StatusMasterDataModel } from '../datamodels/CommonDataModels';
import { ComplaintListDataModel } from '../datamodels/ComplaintsDataModel';

interface DataFilters {
  date: any, request_id: any, phone_no: any, name: any, status: any, page: any, limit: any
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
  const [complaintsList, setComplaintsData] = useState<ComplaintListDataModel[]>([]);
  const [statusMasterData, setStatusMasterData] = useState<StatusMasterDataModel[]>([]);

  const [dataFilters, setDataFilters] = useState<DataFilters>({
    date: '', request_id: '', phone_no: '', name: '', status: '', page: 1, limit: 10

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
            "request_type":2
        })

      });
      const statuses = await statusRes.json();

      if (statuses.status == 1) {
        setStatusMasterData(statuses.data)
      }
     
      const res = await fetch("/api/get_complaints_request", {
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
          page: dataFilters.page == page ? dataFilters.page : page,
          limit: dataFilters.limit
        }),
      });

      const response = await res.json();

      if (response.status == 1 && response.data.length > 0) {
        setLoading(false);

        setComplaintsData(response.data)
        if (response.data.length < dataFilters.limit) {
          setHasMoreData(false);

        } else {
          setHasMoreData(true);
        }
      } else if (response.status == 1 && response.data.length == 0) {
        setLoading(false);
        setComplaintsData([])
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
      console.log(e);

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

      date: '', request_id: '', phone_no: '', name: '', status: '', page: 1, limit: 10
    });
    fetchData(dataFilters.page);
  }

  function formatDateYYYYMMDD(date: string) {
    if (!date) return '';
    const parsedDate = moment(date);
    return parsedDate.format('YYYY-MM-DD');
  }

  const downloadExport = async () => {

    setLoading(true);
    const response = await fetch("/api/export-claims", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // 🔥 Important for raw JSON
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
      },
      body: JSON.stringify({
        date: dataFilters.date,
          request_id: dataFilters.request_id,
          phone_no: dataFilters.phone_no,
          status: dataFilters.status,
      }),
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "claim_requests.csv";
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

      <LeftPanelMenus selectedMenu={3} showLeftPanel={false} rightBoxUI={
        <div className="container warranty_mainbox">
          <div className="row mt-4">
            <div className="col-lg-12">

              <div className="row" id="top">
                
                  <div className="col-lg-12 mb-3">
                    <div className="heading25">
                      Complaints / Claims
                      <button className="blue_btn" style={{ float: "right" }} onClick={downloadExport}>Export Data</button>
                    </div>
                </div>

                <div className="col-lg-12 mb-4 ">
                  <div className="attendance_filter_box" id="filter_whitebox_open">
                    <div className="row" style={{ alignItems: "center" }}>

                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Complaint ID: </label>
                          <input type="text" id="request_id" name="request_id" value={dataFilters.request_id} onChange={handleInputChange} />
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
                      <div className="col-lg-3 text-center"><div className="label">Complaint <br></br>ID</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Complaint <br></br>Date</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Customer <br></br>Phone</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Complaint <br></br>Type</div></div>
                      {/* <div className="col-lg-2 text-center"><div className="label">Description</div></div> */}
                      <div className="col-lg-1 text-center"><div className="label">Status</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Addressed By</div></div>
                      {/* <div className="col-lg-1 text-center"><div className="label">Action</div></div> */}

                    </div>

                    {complaintsList && complaintsList.length > 0 &&
                      complaintsList.map((complaints) => (
                        <div className="row list_listbox" style={{ alignItems: "center", cursor: "pointer" }} key={complaints.pk_id} onClick={() => { }}>
                          <div className="col-lg-3 text-center"><div className="label">{complaints.complaint__id}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{formatDateYYYYMMDD(complaints.created_at)}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{complaints.user_phone}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{complaints.complaint_type}</div></div>
                          {/* <div className="col-lg-2 text-center"><div className="label">{complaints.complaint_description}</div></div> */}
                          <div className="col-lg-1 text-center"><div className="label">{complaints.request_status}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{complaints.addressedDetails && complaints.addressedDetails.length>0?complaints.addressedDetails[0].auth_user_id:"--"}</div></div>
                          <div className=""><div className="label viewbtn" onClick={() => {
                            setGlobalState({
                              selectedViewID: complaints.pk_id + '',
                              auth_id: auth_id,
                              userName: userName
                            });
                            router.push(pageURL_ComplaintDetails);
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
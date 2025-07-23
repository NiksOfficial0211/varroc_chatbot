'use client'
import React, { useEffect, useState } from 'react'
import HeaderComponent from '../components/header';
import LoadingDialog from '../components/PageLoader';
import ShowAlertMessage from '../components/alert';
import { WarrantyRequestDataModel } from '../datamodels/WarrantyReqestListDataModel';
import { data } from 'jquery';
import { COMPLAINT_FILTER_KEY, GENERAL_FILTER_KEY, LEAD_FILTER_KEY, staticIconsBaseURL, status_Rejected, WARRANTY_FILTER_KEY } from '../pro_utils/string_constants'
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
  ,datafrom:number,dataTo:number,total:number
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
    date: '', request_id: '', phone_no: '', name: '', status: '', page: 1, limit: 10,datafrom:0,dataTo:0,total:0

  });
  const [hasMoreData, setHasMoreData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    
      sessionStorage.removeItem(WARRANTY_FILTER_KEY);
          sessionStorage.removeItem(LEAD_FILTER_KEY);
              sessionStorage.removeItem(GENERAL_FILTER_KEY);
          
    const stored = sessionStorage.getItem(COMPLAINT_FILTER_KEY);
    console.log("stored filter data :----- --------",stored);
    
    try {
      if (stored) {
        const parsed = JSON.parse(stored);

        // Optional: basic validation
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          'page' in parsed &&
          'limit' in parsed
        ) {
          fetchData(parsed);
          setDataFilters(parsed);
          
        } else {
          setDataFilters({
            date: '', request_id: '', phone_no: '', name: '', status: '', page: 1, limit: 10,datafrom:0,dataTo:0,total:0

          }); // fallback if invalid
          fetchData(dataFilters);
        }
      }else{
       setDataFilters({
            date: '', request_id: '', phone_no: '', name: '', status: '', page: 1, limit: 10,datafrom:0,dataTo:0,total:0
          }); // fallback
        fetchData(dataFilters);
      }
    } catch (error) {
      setDataFilters({
        date: '', request_id: '', phone_no: '', name: '', status: '', page: 1, limit: 10,datafrom:0,dataTo:0,total:0

      }); // fallback
      fetchData(dataFilters);
    }
    // fetchData(dataFilters.date, dataFilters.request_id, dataFilters.phone_no, dataFilters.name, dataFilters.status, dataFilters.page, dataFilters.limit);
    

  }, [])

  // const fetchData = async (date: any, request_id: any, phone_no: any, name: any, status: any, page: any, limit: any) => {
  const fetchData = async (filter: DataFilters) => {
    setDataFilters(filter);
    sessionStorage.setItem(COMPLAINT_FILTER_KEY, JSON.stringify(filter));
    setLoading(true);
    try {
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

      const res = await fetch("/api/get_complaints_request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔥 Important for raw JSON
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({
          date: filter.date,
          request_id: filter.request_id.trim(),
          phone_no: filter.phone_no.trim(),
          name: filter.name.trim(),
          status: filter.status,
          page: dataFilters.page == filter.page ? dataFilters.page : filter.page,
          limit: filter.limit
        }),
      });

      const response = await res.json();

      if (response.status == 1 && response.data.length > 0) {
        setLoading(false);

        setComplaintsData(response.data)
        setDataFilters((prev) => ({ ...prev, ['datafrom']: response.from  }))
          setDataFilters((prev) => ({ ...prev, ['dataTo']: response.to  }))
          setDataFilters((prev) => ({ ...prev, ['total']: response.total  }))
        if (response.data.length < dataFilters.limit) {
          setHasMoreData(false);

        } else {
          setHasMoreData(true);
        }
      } else if (response.status == 1 && response.data.length == 0) {
        setLoading(false);
        setComplaintsData([])
        setDataFilters((prev) => ({ ...prev, ['datafrom']: response.from  }))
          setDataFilters((prev) => ({ ...prev, ['dataTo']: response.to  }))
          setDataFilters((prev) => ({ ...prev, ['total']: response.total  }))
        setDataFilters((prev) => ({ ...prev, ['page']: dataFilters.page }))

        setHasMoreData(false);
      }
      else {
        setDataFilters((prev) => ({ ...prev, ['pageNumber']: response.pageNumber }))
        setDataFilters((prev) => ({ ...prev, ['datafrom']: response.from  }))
          setDataFilters((prev) => ({ ...prev, ['dataTo']: response.to  }))
          setDataFilters((prev) => ({ ...prev, ['total']: response.total  }))
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
      fetchData({
      date: '', request_id: '', phone_no: '', name: '', status: '', page: dataFilters.page + page, limit: 10,datafrom:dataFilters.datafrom,dataTo:dataFilters.dataTo,total:dataFilters.total
    });
    }
    else if (!hasMoreData && dataFilters.page > 1) {
      setDataFilters((prev) => ({ ...prev, ['page']: dataFilters.page + page }))
      fetchData({
      date: '', request_id: '', phone_no: '', name: '', status: '', page: dataFilters.page + page, limit: 10,datafrom:dataFilters.datafrom,dataTo:dataFilters.dataTo,total:dataFilters.total
    });
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

      date: '', request_id: '', phone_no: '', name: '', status: '', page: 1, limit: 10,datafrom:0,dataTo:0,total:0
    });
    sessionStorage.removeItem(COMPLAINT_FILTER_KEY);

    fetchData({
      date: '', request_id: '', phone_no: '', name: '', status: '', page: 1, limit: 10,datafrom:0,dataTo:0,total:0
    });
  }

  function formatDateYYYYMMDD(inputDate: string, timeZone = 'Asia/Kolkata') {
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

      <LeftPanelMenus selectedMenu={3} showLeftPanel={false} headertitle='Warranty Claims' rightBoxUI={
        <div className="container warranty_mainbox">
          <div className="row mt-4">
            <div className="col-lg-12">

              <div className="row" id="top">

                <div className="col-lg-12 mb-3">
                  <div className="heading25">
                    Claims
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
                          <select id="status" name="status" value={dataFilters.status} onChange={handleInputChange}>
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
                        <div style={{ float: "right", margin: "0 0 -30px 0" }}>
                          <a className="blue_btn" onClick={() => { fetchData(dataFilters); }}>Submit</a> <a className="blue_btn" onClick={() => resetFilter()}>Reset</a>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
              <div className="row mb-3">
                <div className="col-lg-12">
                  <div className="grey_box" style={{ backgroundColor: "#fff", position: "relative", padding: "20px 60px 20px 30px" }}>
                    <div className="row list_label mb-4">
                      <div className="col-lg-3 text-center"><div className="label">Complaint <br></br>ID</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Complaint <br></br>Date</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Customer <br></br>Phone</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Complaint <br></br>Type</div></div>
                      {/* <div className="col-lg-2 text-center"><div className="label">Description</div></div> */}
                      <div className="col-lg-1 text-center"><div className="label">Status</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Updated By</div></div>
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
                          <div className="col-lg-2 text-center"><div className="label">{complaints.addressedDetails && complaints.addressedDetails.length > 0 ? complaints.addressedDetails[0].addressedBY : "--"}</div></div>
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
                  <p style={{float:"left"}}>Showing {dataFilters.datafrom} to {dataFilters.dataTo} out of {dataFilters.total}</p>

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
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
import { pageURL_ComplaintDetails, pageURL_GeneralDetails, pageURL_LeadDetails, pageURL_WarrantyRequestDetails } from '../pro_utils/string_routes';
import useSessionRedirect from '../pro_utils/manage_session';
import LeftPanelMenus from '../components/leftPanel';
import moment from 'moment';
import { RejectMSGMasterDataModel, StatusMasterDataModel } from '../datamodels/CommonDataModels';
import { ComplaintListDataModel } from '../datamodels/ComplaintsDataModel';
import { DealershipEnqListingDataModel } from '../datamodels/DealershipEnqDataModel';
import { GeneralEnqListingDataModel } from '../datamodels/GenerealEnquiryDataModel';

interface DataFilters {
  date: any, enquiry_id: any, city: any, state: any, status: any, customerPhone: any, page: any, limit: any
  , datafrom: number, dataTo: number, total: number

}

const LeadRequestListing = () => {
  useSessionRedirect();

  const [isLoading, setLoading] = useState(false);
  const { auth_id, userName, fromDashboardCount, setGlobalState } = useGlobalContext();
  const [isChecked, setIsChecked] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertForSuccess, setAlertForSuccess] = useState(0);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertStartContent, setAlertStartContent] = useState('');
  // const [pageNumber, setPageNumber] = useState(1);
  // const [pageSize, setPageSize] = useState(10);
  const [statusMasterData, setStatusMasterData] = useState<StatusMasterDataModel[]>([]);
  const [dealershipEnqList, setDealershipEnqList] = useState<GeneralEnqListingDataModel[]>([]);


  const [dataFilters, setDataFilters] = useState<DataFilters>({
    date: '', enquiry_id: '', city: '', state: '', status: '', customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

  });
  const [hasMoreData, setHasMoreData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    sessionStorage.removeItem(COMPLAINT_FILTER_KEY);
    sessionStorage.removeItem(WARRANTY_FILTER_KEY);
    sessionStorage.removeItem(LEAD_FILTER_KEY);
    // fetchData(dataFilters.date, dataFilters.request_id, dataFilters.phone_no, dataFilters.name, dataFilters.status, dataFilters.page, dataFilters.limit);
    const stored = sessionStorage.getItem(GENERAL_FILTER_KEY);
    console.log("stored filter data :----- --------", stored);

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
          if (fromDashboardCount == 4) {
            setDataFilters({
              date: '', enquiry_id: '', city: '', state: '', status: 14, customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

            });
            fetchData({
              date: '', enquiry_id: '', city: '', state: '', status: 14, customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

            });
          } else {
            setDataFilters({
              date: '', enquiry_id: '', city: '', state: '', status: '', customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

            }); // fallback if invalid
            fetchData(dataFilters);
          }
          
        }
      } else {
        if (fromDashboardCount == 4) {
          setDataFilters({
            date: '', enquiry_id: '', city: '', state: '', status: 14, customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

          });
          fetchData({
              date: '', enquiry_id: '', city: '', state: '', status: 14, customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

            });
        } else {
          setDataFilters({
            date: '', enquiry_id: '', city: '', state: '', status: '', customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

          }); // fallback if invalid
          fetchData(dataFilters);
        }
        
      }
    } catch (error) {
      if (fromDashboardCount == 4) {
        setDataFilters({
          date: '', enquiry_id: '', city: '', state: '', status: 14, customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

        });
        fetchData({
              date: '', enquiry_id: '', city: '', state: '', status: 14, customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

            });
      } else {
        setDataFilters({
          date: '', enquiry_id: '', city: '', state: '', status: '', customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0

        }); // fallback if invalid
        fetchData(dataFilters);
      }
    }

  }, [])

  // const fetchData = async (date: any, request_id: any, phone_no: any, name: any, status: any, page: any, limit: any) => {
  const fetchData = async (filter: DataFilters) => {
    sessionStorage.setItem(GENERAL_FILTER_KEY, JSON.stringify(filter));
    setLoading(true);
    try {
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
      const res = await fetch("/api/get_general_requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔥 Important for raw JSON
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({
          date: filter.date,
          enquiry_id: filter.enquiry_id,
          phone_no: filter.customerPhone,
          city: filter.city,
          state: filter.state,
          status: filter.status,
          page: dataFilters.page == filter.page ? dataFilters.page : filter.page,
          limit: filter.limit
        }),
      });
      const response = await res.json();

      if (response.status == 1 && response.data.length > 0) {
        setLoading(false);
        setDataFilters((prev) => ({ ...prev, ['datafrom']: response.from }))
        setDataFilters((prev) => ({ ...prev, ['dataTo']: response.to }))
        setDataFilters((prev) => ({ ...prev, ['total']: response.total }))
        setDealershipEnqList(response.data)
        if (response.data.length < filter.limit) {
          setHasMoreData(false);

        } else {
          setHasMoreData(true);
        }
      } else if (response.status == 1 && response.data.length == 0) {
        setLoading(false);
        setDataFilters((prev) => ({ ...prev, ['datafrom']: response.from }))
        setDataFilters((prev) => ({ ...prev, ['dataTo']: response.to }))
        setDataFilters((prev) => ({ ...prev, ['total']: response.total }))
        setDealershipEnqList([])
        setDataFilters((prev) => ({ ...prev, ['page']: filter.page }))

        setHasMoreData(false);
      }
      else {
        setDataFilters((prev) => ({ ...prev, ['pageNumber']: response.pageNumber }))
        setDataFilters((prev) => ({ ...prev, ['datafrom']: response.from }))
        setDataFilters((prev) => ({ ...prev, ['dataTo']: response.to }))
        setDataFilters((prev) => ({ ...prev, ['total']: response.total }))

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
      fetchData({
        date: dataFilters.date, enquiry_id: dataFilters.enquiry_id, city: dataFilters.city, state: dataFilters.state, status: dataFilters.status, customerPhone: dataFilters.customerPhone, page: dataFilters.page + page, limit: 10, datafrom: dataFilters.datafrom
        , dataTo: dataFilters.dataTo, total: dataFilters.total
      });
    }
    else if (!hasMoreData && dataFilters.page > 1) {
      setDataFilters((prev) => ({ ...prev, ['page']: dataFilters.page + page }))
      fetchData({
        date: dataFilters.date, enquiry_id: dataFilters.enquiry_id, city: dataFilters.city, state: dataFilters.state, status: dataFilters.status, customerPhone: dataFilters.customerPhone, page: dataFilters.page + page, limit: 10, datafrom: 0, dataTo: 0, total: 0
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
    sessionStorage.removeItem(GENERAL_FILTER_KEY);
    setGlobalState({
                  selectedViewID: '',
                  auth_id: auth_id,
                  userName: userName,
                  fromDashboardCount: 0
                })
    setDataFilters({

      date: '', enquiry_id: '', city: '', state: '', status: '', customerPhone: '', page: 1, limit: 10, datafrom: 0, dataTo: 0, total: 0
    });
    fetchData(dataFilters.page);
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
    const response = await fetch("/api/export-general", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // 🔥 Important for raw JSON
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
      },
      body: JSON.stringify({
        date: dataFilters.date,
        request_id: dataFilters.enquiry_id,
        phone_no: dataFilters.customerPhone,
        city: dataFilters.city,
        state: dataFilters.state,
        status: dataFilters.status,
      }),
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "general_requests.csv";
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

      <LeftPanelMenus selectedMenu={8} showLeftPanel={false} headertitle='General Enquiries' rightBoxUI={
        <div className="container warranty_mainbox">
          <div className="row mt-4">
            <div className="col-lg-12">

              <div className="row" id="top">

                <div className="col-lg-12 mb-3">
                  <div className="heading25">
                    Enquiries
                    <button className="blue_btn" style={{ float: "right" }} onClick={downloadExport}>Export Data</button>
                  </div>
                </div>

                <div className="col-lg-12 mb-4 ">
                  <div className="attendance_filter_box" id="filter_whitebox_open">
                    <div className="row" style={{ alignItems: "center" }}>
                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Enquiry ID: </label>
                          <input type="text" id="enquiry_id" name="enquiry_id" value={dataFilters.enquiry_id} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Customer Phone : </label>
                          <input type="text" id="customerPhone" name="customerPhone" value={dataFilters.customerPhone} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">City: </label>
                          <input type="text" id="city" name="city" value={dataFilters.city} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">State: </label>
                          <input type="text" id="state" name="state" value={dataFilters.state} onChange={handleInputChange} />
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
                          </select>                        </div>
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
                      <div className="col-lg-3 text-center"><div className="label">Enquiry <br></br>ID</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Enquiry <br></br>Date</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Customer <br></br>Phone</div></div>
                      <div className="col-lg-2 text-center"><div className="label">City</div></div>
                      <div className="col-lg-2 text-center"><div className="label">State</div></div>
                      <div className="col-lg-1 text-center"><div className="label">Status</div></div>
                      {/* <div className="col-lg-1 text-center"><div className="label">Action</div></div> */}

                    </div>

                    {dealershipEnqList && dealershipEnqList.length > 0 &&
                      dealershipEnqList.map((request) => (
                        <div className="row list_listbox" style={{ alignItems: "center", cursor: "pointer" }} key={request.pk_id} onClick={() => { }}>
                          <div className="col-lg-3 text-center"><div className="label">{request.general_id}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{formatDateYYYYMMDD(request.created_at)}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{request.contact_no && request.contact_no.toString().length == 10 ? "91" + request.contact_no : request.contact_no}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{request.city}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{request.state ? request.state.charAt(0).toUpperCase() + request.state.replace("_", " ").slice(1).toLowerCase() : "--"}</div></div>
                          <div className="col-lg-1 text-center"><div className="label">{request.request_status}</div></div>

                          <div className=""><div className="label viewbtn" onClick={() => {
                            setGlobalState({
                              selectedViewID: request.pk_id + '',
                              auth_id: auth_id,
                              userName: userName,
                              fromDashboardCount: fromDashboardCount,
                            });
                            router.push(pageURL_GeneralDetails);
                          }}><img src={staticIconsBaseURL + "/images/view_icon.png"} alt="Varroc Excellence" className="img-fluid" style={{ maxHeight: "18px" }} /></div>
                          </div>
                        </div>
                      ))}


                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-12">
                  <p style={{ float: "left" }}>Showing {dataFilters.datafrom} to {dataFilters.dataTo} out of {dataFilters.total}</p>

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

export default LeadRequestListing
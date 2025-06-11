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
import { ErrorLogDataModel } from '../datamodels/ErrorLogDataModel';
import ViewUpdateErrorLogs from '../components/dialog_ViewEditErrorLog';

interface DataFilters {
  phone_no:any,date: any, page: any, limit: any
}

const ErrorLogsListing = () => {
  useSessionRedirect();

  const [isLoading, setLoading] = useState(false);
  const [showViewUpdateDialog, setShowViewUpdateDialog] = useState(false);
    const [viewEditID, setViewEditID] = useState(0);

  const [showAlert, setShowAlert] = useState(false);
  const [alertForSuccess, setAlertForSuccess] = useState(0);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertStartContent, setAlertStartContent] = useState('');
  const [errorLogList, setErrorLogs] = useState<ErrorLogDataModel[]>([]);
  

  const [dataFilters, setDataFilters] = useState<DataFilters>({
    phone_no:'',date: '', page: 1, limit: 10

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
      const apiRes = await fetch("/api/get_error_logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({
          phone_no:dataFilters.phone_no,
          created_at: dataFilters.date,
          request_type_id: 1,
          page: dataFilters.page == page ? dataFilters.page : page,
          limit: dataFilters.limit
        })

      });
      const responseData = await apiRes.json();

      if (responseData.status == 1) {
        setLoading(false);
        setErrorLogs(responseData.data)
        if (responseData.data.length < dataFilters.limit) {
          setHasMoreData(false);
        } else {
          setHasMoreData(true);
        }
      }
      else {
        setHasMoreData(false)
        setLoading(false);
        setShowAlert(true);
        setAlertTitle("Error")
        setAlertStartContent(responseData.message);
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
    // setDataFilters({
    //   phone_no:'',
    //   date: '', page: 1, limit: 10
    // });
    window.location.reload();
    
    // fetchData(dataFilters.page);
  }

   function formatDateYYYYMMDD(date: string) {
      if (!date) return '';
      const parsedDate = moment(date);
      return parsedDate.format('YYYY-MM-DD');
    }

  return (
    <div>

      <LoadingDialog isLoading={isLoading} />
      {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
        setShowAlert(false)

      }} onCloseClicked={function (): void {
        setShowAlert(false)
      }} showCloseButton={false} successFailure={alertForSuccess} />}

      <LeftPanelMenus selectedMenu={7} showLeftPanel={false} rightBoxUI={
        <div className="container">
          <div className="row mt-4">
            <div className="col-lg-12">
              <div className="row" id="top">
                <div className="col-lg-12 mb-3">
                  <div className="heading25">
                    Error Logs
                    {/* <button className="blue_btn" style={{ float: "right" }} onClick={downloadExport}>Export Data</button> */}
                  </div>
                </div>

                <div className="col-lg-12 mb-4 ">
                  <div className="attendance_filter_box" id="filter_whitebox_open">
                    <div className="row" style={{ alignItems: "center" }}>
                    <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Customer Phone: </label>
                          <input type="text" id="phone_no" name="phone_no" value={dataFilters.phone_no} onChange={handleInputChange} />
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
                          <a className="blue_btn" onClick={() => { fetchData(dataFilters.page); }}>Submit</a> <a className="blue_btn" onClick={() => resetFilter()}>Reset</a>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
              <div className="row mb-3">
                <div className="col-lg-12">
                  <div className="grey_box" style={{ backgroundColor: "#fff" }}>
                    <div className="row list_label mb-4">
                      <div className="col-lg-2 text-center"><div className="label">Log Date</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Customer Phone</div></div>
                      <div className="col-lg-3 text-center"><div className="label">Data Input</div></div>
                      <div className="col-lg-3 text-center"><div className="label">Error Response</div></div>
                      <div className="col-lg-1 text-center"><div className="label">Admin</div></div>
                      <div className="col-lg-1 text-center"><div className="label">Action</div></div>

                    </div>

                    {errorLogList && errorLogList.length > 0 &&
                      errorLogList.map((errorLog) => (
                        <div className="row list_listbox" style={{ alignItems: "center", cursor: "pointer" }} key={errorLog.pk_error_id} onClick={() => { }}>
                          <div className="col-lg-2 text-center"><div className="label">{formatDateYYYYMMDD(errorLog.created_at)}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{errorLog.user_phone}</div></div>
                          <div className="col-lg-3 text-center"><div className="label">{errorLog.logged_json}</div></div>
                          <div className="col-lg-3 text-center"><div className="label">{errorLog.error_reponse}</div></div>
                          <div className="col-lg-1 text-center"><div className="label">{errorLog.username}</div></div>

                          <div className="col-lg-1 text-center"><div className="label" onClick={() => {
                            setShowViewUpdateDialog(true)
                           setViewEditID(errorLog.pk_error_id)
                          }}><img src={staticIconsBaseURL + "/images/view_icon.png"} alt="Varroc Excellence" className="img-fluid" style={{ maxHeight: "18px" }} /></div></div>
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
          <div className={showViewUpdateDialog ? "rightpoup rightpoupopen" : "rightpoup"}>

              {showViewUpdateDialog && <ViewUpdateErrorLogs onClose={() => setShowViewUpdateDialog(false)} error_log_id={viewEditID} />}
          </div>
        </div>
      } />
    </div>
  )
}

export default ErrorLogsListing
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
    // const response = await fetch("/api/export-data", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json", // 🔥 Important for raw JSON
    //     "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
    //   },
    //   body: JSON.stringify({
    //     date: dataFilters.date,
    //       request_id: dataFilters.request_id,
    //       phone_no: dataFilters.phone_no,
    //       name: dataFilters.name,
    //       status: dataFilters.status,
    //   }),
    // });
    // const blob = await response.blob();
    // const url = window.URL.createObjectURL(blob);

    // const a = document.createElement("a");
    // a.href = url;
    // a.download = "warranty_requests.csv";
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
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
                      Dealership Enquiries
                      <button className="blue_btn" style={{ float: "right" }} onClick={downloadExport}>Export Data</button>
                    </div>
                </div>

                <div className="col-lg-12 mb-4 ">
                  <div className="attendance_filter_box" id="filter_whitebox_open">
                    <div className="row" style={{ alignItems: "center" }}>


                    </div>
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
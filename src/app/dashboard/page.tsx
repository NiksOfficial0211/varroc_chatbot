'use client'
import React, { useEffect, useState } from 'react'
import HeaderComponent from '../components/header'
import useSessionRedirect from '../pro_utils/manage_session';
import LoadingDialog from '../components/PageLoader';
import ShowAlertMessage from '../components/alert';
import { staticIconsBaseURL } from '../pro_utils/string_constants'
import { useRouter } from 'next/navigation';
import { pageURL_WarrantyRequestDetails, pageURL_WarrantyRequestList } from '../pro_utils/string_routes';
import { useScrollCounter } from '../hooks/DashboardCountHook/dashboardCountHook';
import { useGlobalContext } from '../contextProviders/globalContext';
import LeftPanelMenus from '../components/leftPanel';

const Dashboard = () => {
  useSessionRedirect();
  useScrollCounter();
  const { auth_id,userName,setGlobalState } = useGlobalContext();
  
  const [isLoading, setLoading] = useState(false);

  const [isChecked, setIsChecked] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertForSuccess, setAlertForSuccess] = useState(0);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertStartContent, setAlertStartContent] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardResponseData>();

  const router = useRouter();

  useEffect(() => {
    fetchData();
    fetchData();
        const intervalId = setInterval(() => {
            // fetchActivities();
            fetchData();
        }, 5000); 
        return () => {
            clearInterval(intervalId);
          };
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔥 Important for raw JSON
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({
          user_id: 1
        }),
      });

      const response = await res.json();

      if (response.status == 1) {
        setLoading(false);
        setDashboardData(response.data)

      } else {
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
  


  return (
    <div>
      
      <LoadingDialog isLoading={false} />
      {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
        setShowAlert(false)

      }} onCloseClicked={function (): void {
        setShowAlert(false)
      }} showCloseButton={false} successFailure={alertForSuccess} />}
        <LeftPanelMenus selectedMenu={1} showLeftPanel={false} rightBoxUI={
        <div className="container">
          <div className="row mb-5">
            <div className="col-lg-12">
              <div className="req_whitebox" style={{ backgroundColor:"#f0faff"}}>
                <div className="row text-center">
                  <div className="col-lg-12 mb-2"><span data-max="08" className="ms-animated">{dashboardData?.activities.length || 0}</span></div>
                  <div className="col-lg-12 request_text">Today's <br></br>Requests</div>
                </div>
              </div>
              <div className="req_whitebox" style={{ backgroundColor:"#fff9ee"}}>
                <div className="row text-center">
                  <div className="col-lg-12 mb-2"><span data-max="08" className="ms-animated">{dashboardData?.total_Request || 0}</span></div>
                  <div className="col-lg-12 request_text">Total <br></br>Requests</div>
                </div>
              </div>
              <div className="req_whitebox" style={{ backgroundColor:"#def9e1"}}>
                <div className="row text-center">
                  <div className="col-lg-12 mb-2"><span data-max="10000" className="ms-animated">{dashboardData?.addressed_count || 0}</span></div>
                  <div className="col-lg-12 request_text">Request <br></br>Addressed</div>
                </div>
              </div>
              <div className="req_whitebox" style={{ backgroundColor:"#ffeceb"}} onClick={() => router.push(pageURL_WarrantyRequestList)}>
                <div className="row text-center">
                  <div className="col-lg-12 mb-2"><span data-max="39" className="ms-animated">{dashboardData?.warranty_pending_request || 0}</span></div>
                  <div className="col-lg-12 request_text">Pending <br></br>Warranty Requests</div>
                </div>
              </div>
              <div className="req_whitebox" style={{ backgroundColor:"#ffeceb"}}>
                <div className="row text-center">
                  <div className="col-lg-12 mb-2"><span data-max="39" className="ms-animated">0</span></div>
                  <div className="col-lg-12 request_text">Pending <br></br>Dealership Enquiries</div>
                </div>
              </div>
              <div className="req_whitebox" style={{ backgroundColor:"#ffeceb"}}>
                <div className="row text-center">
                  <div className="col-lg-12 mb-2"><span data-max="39" className="ms-animated">0</span></div>
                  <div className="col-lg-12 request_text">Pending<br></br>Complaints</div>
                </div>
              </div>
            </div>
          </div>
          {/* <div className="row mb-4">
            <div className="col-lg-12">
              <div className="count_main_box">
                <div className="count_listing count_listing_three">
                  <div className="count_number blue">
                    <span data-max="08" className="ms-animated">{dashboardData?.activities.length || 0}</span>
                  </div>
                  <div className="count_content">Today's Request</div>
                </div>
                <div className="count_listing">
                  <div className="count_number blue">
                    <span data-max="08" className="ms-animated">{dashboardData?.total_Request || 0}</span>
                  </div>
                  <div className="count_content">Total Request</div>

                </div>
                <div className="count_listing count_listing_two">
                  <div className="count_number green">
                    <span data-max="10000" className="ms-animated">{dashboardData?.addressed_count || 0}</span>
                  </div>
                  <div className="count_content">Request Addressed</div>
                </div>
                

                <div className="count_listing " style={{cursor:"pointer"}} onClick={()=>router.push(pageURL_WarrantyRequestList)}>
                  <div className="count_number red">
                    <span data-max="39" className="ms-animated">{dashboardData?.warranty_pending_request || 0}</span>
                  </div>
                  <div className="count_content" >Pending Warranty Request</div>
                </div>
                

              </div>
            </div>
          </div> */}
          <div className="row ">
            <div className="col-lg-12">
              <div className="row" id="top">
                <div className="col-lg-12 mb-3">
                  <div className="heading25">Todays <span>Requests</span></div>
                </div>
              </div>
              <div className="row mb-5">
                <div className="col-lg-12">
                  <div className="grey_box" style={{ backgroundColor: "#fff" }} >
                    <div className="row list_label mb-4">
                      <div className="col-lg-2 text-center"><div className="label">Request ID</div></div>
                      <div className="col-lg-3 text-center"><div className="label">Customer Name</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Customer Phone</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Request Type</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Status</div></div>
                      <div className="col-lg-1 text-center"><div className="label">Action</div></div>

                    </div>

                    {dashboardData && dashboardData.activities.length > 0 &&
                      dashboardData.activities.map((activity, index) => (
                        <div className="row list_listbox" style={{ alignItems: "center", cursor: "pointer" }} key={index} onClick={() => { }}>
                          <div className="col-lg-2 text-center"><div className="label">{activity.request_id}</div></div>
                          <div className="col-lg-3 text-center"><div className="label">{activity.name}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{activity.phone}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{activity.request_type}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{activity.request_status == "1" ? "New" : activity.request_status}</div></div>
                          <div className="col-lg-1 text-center"><div className="label" onClick={() => {
                                                  setGlobalState({
                                                    selectedViewID: activity.go_activity_id + '',
                                                    auth_id:auth_id,
                                                    userName:userName
                                                  })
                                                  router.push(pageURL_WarrantyRequestDetails)
                                                }}><img src={staticIconsBaseURL + "/images/view_icon.png"} alt="Varroc Excellence" className="img-fluid" style={{ maxHeight: "18px" }} /></div></div>
                        </div>))}
                    

                  </div>
                </div>
              </div>
              
            </div>

          </div>
        </div>
        }/>
    </div>
  )
}

export default Dashboard
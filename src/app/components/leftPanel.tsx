import React, { useState } from 'react'
import { baseUrl, pageURL_BatteryListingPage, pageURL_dashboard, pageURL_WarrantyRequestList } from '../pro_utils/string_routes'
import { staticIconsBaseURL } from '../pro_utils/string_constants';
import HeaderComponent from './header';
import BulkUploadForm from './bulkUpload';


type LeftPanelProps = {
    selectedMenu: number;
    showLeftPanel: boolean;
    rightBoxUI: React.ReactNode;

};

const LeftPanelMenus = ({ selectedMenu,rightBoxUI}:LeftPanelProps) => {
    const [toggleClass, setToggleClass] = useState("middle_box");
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [menuIndex, setMenuIndex] = useState(selectedMenu);


const middle_box = () => {
        setToggleClass((prevClass) =>
            prevClass === "middle_box" ? "middle_box toggle_collapse" : "middle_box"
        );
}


  return (
    <div className={toggleClass} id="middle_box">
                    <div className="left_box p-0">
                        <div>
                            <div onClick={middle_box} className='toggle_icon'></div>
                            
                            <div className='row'>
                                <div className="col-lg-12 text-center logo_box pb-5">
                                    <a href={pageURL_dashboard}> <img src={staticIconsBaseURL + "/images/mainlogo.png"} alt="Varroc Excellence" className="img-fluid" style={{maxHeight:"120px"}}/></a>
                                </div> 
                            </div>
                            <div className='row'>
                                <div className="col-lg-12 left_menu">
                                    <ul>
                                        <li className={menuIndex==1?"selected":""}>
                                            <a href={pageURL_dashboard} onClick={()=>setMenuIndex(1)}>
                                                <div className="iconbox">
                                                    <img src={staticIconsBaseURL + "/images/dashboard_icon.png"} alt="icon" className="img-fluid"/>
                                                </div>
                                                <div className="leftmenutext">
                                                    AMD
                                                    <span>Dashboard</span>
                                                </div>
                                            </a>
                                        </li>
                                        <li className={menuIndex==2?"selected":""}>
                                  <a href={pageURL_WarrantyRequestList} onClick={() => setMenuIndex(2)}>
                                                <div className="iconbox">
                                                    <img src={staticIconsBaseURL + "/images/request_icon.png"} alt="icon" className="img-fluid"/>
                                                </div>
                                                <div className="leftmenutext">                                        
                                                    Warranty
                                                    <span>Requests</span>
                                                </div>
                                            </a>
                                        </li>
                                        {/* <li>
                                            <a href='#' onClick={()=>setMenuIndex(3)}>
                                                <div className="iconbox">
                                                    <img src={staticIconsBaseURL + "/images/complaint_icon.png"} alt="icon" className="img-fluid"/>
                                                </div>
                                                <div className="leftmenutext">                                        
                                                    User 
                                                    <span>Complaints</span>
                                                </div>
                                            </a>
                                        </li> */}
                                        <li className={menuIndex==4?"selected":""}>
                                  <a href={pageURL_BatteryListingPage} onClick={() => setMenuIndex(4)}> 
                                                <div className="iconbox">
                                                    <img src={staticIconsBaseURL + "/images/list_icon.png"} alt="icon" className="img-fluid"/>
                                                </div>
                                                <div className="leftmenutext">                                        
                                                    Product
                                                    <span>List</span>
                                                </div>
                                            </a>
                                        </li>
                                        {/* <li>
                                            <a href='#'>
                                                <div className="iconbox" onClick={()=>setMenuIndex(5)}>
                                                    <img src={staticIconsBaseURL + "/images/dealershipenquire_icon.png"} alt="icon" className="img-fluid"/>
                                                </div>
                                                <div className="leftmenutext">                                        
                                                    Dealership / Business
                                                    <span>Enquiry</span>
                                                </div>
                                            </a>
                                        </li> */}
                                        <li className={menuIndex==6?"selected":""}>
                                  <a onClick={() => {setMenuIndex(6) ,setShowUploadDialog(true)}}>
                                                <div className="iconbox">
                                                    <img src={staticIconsBaseURL + "/images/bulkupload_icon.png"} alt="icon" className="img-fluid"
                                                    />
                                                </div>
                                                <div className="leftmenutext">                                        
                                                    Bulk
                                                    <span>Upload</span>
                                                </div>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                                <div className={showUploadDialog ? "rightpoup rightpoupopen" : "rightpoup"}> 

                                        {showUploadDialog && <BulkUploadForm onClose={() => setShowUploadDialog(false)} />}
                                    </div>
                        </div>
                    </div>
                    <div className="right_mainbox">
                        <HeaderComponent />
                        <div className='rightbox_inner'>
                            {rightBoxUI}
                        </div>
                        <div className='footer'>Copyright © 2024 Varroc</div>
                    </div> 
                    
    </div>

    
)
}

export default LeftPanelMenus
'use client'
import React, { useEffect, useState } from 'react'
import HeaderComponent from '../components/header';
import LoadingDialog from '../components/PageLoader';
import ShowAlertMessage from '../components/alert';
import { staticIconsBaseURL } from '../pro_utils/string_constants'
import { useGlobalContext } from '../contextProviders/globalContext';
import { forbidden, useRouter } from 'next/navigation';
import useSessionRedirect from '../pro_utils/manage_session';
import LeftPanelMenus from '../components/leftPanel';
import moment from 'moment';
import { ProductInfoMasterUserModel } from '../datamodels/BatteryDataModel';
import EditProductDetail from '../components/dialog_EditProduct';

interface DataFilters {
  model: any, serial_no: any, manufacturing_date: any,page: any, limit: any
}

const BatteryListing = () => {
  useSessionRedirect();

  const [isLoading, setLoading] = useState(false);
  const { setGlobalState } = useGlobalContext();
  const [isChecked, setIsChecked] = useState(true);
  const [productID, setProductID] = useState(0);
  const [isAddProduct, setAddProduct] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertForSuccess, setAlertForSuccess] = useState(0);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertStartContent, setAlertStartContent] = useState('');
  // const [pageNumber, setPageNumber] = useState(1);
  // const [pageSize, setPageSize] = useState(10);
  const [batteryListData, setBatteryListData] = useState<ProductInfoMasterUserModel[]>([]);
  const [dataFilters, setDataFilters] = useState<DataFilters>({
    model: '', serial_no: '', manufacturing_date: '',  page: 1, limit: 10

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
      const res = await fetch("/api/get_battery_list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔥 Important for raw JSON
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({
          battery_model: dataFilters.model,
          battery_serial_number: dataFilters.serial_no,
          date: dataFilters.manufacturing_date,
          page: dataFilters.page == page ? dataFilters.page : page,
          limit: dataFilters.limit
        }),
      });

      const response = await res.json();

      if (response.status == 1 && response.data.length > 0 ) {
        setLoading(false);

        setBatteryListData(response.data)
        if (response.data.length < dataFilters.limit) {
          setHasMoreData(false);

        } else {
          setHasMoreData(true);
        }
      } else if (response.status == 1 && response.data.length == 0) {
        setLoading(false);
        setBatteryListData([])
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

      model: '', serial_no: '', manufacturing_date: '',  page: 1, limit: 10
    });
    fetchData(dataFilters.page);
  }

  function formatDateYYYYMMDD(inputDate: string) {
    const date = new Date(inputDate);

// Convert to local time components
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
const day = String(date.getDate()).padStart(2, '0');

let hours = date.getHours();
const minutes = String(date.getMinutes()).padStart(2, '0');
const ampm = hours >= 12 ? 'PM' : 'AM';
hours = hours % 12;
hours = hours ? hours : 12; // the hour '0' should be '12'

const formattedTime = `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    return formattedTime;
  }


  return (
    <div>

      <LoadingDialog isLoading={isLoading} />
      {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
        setShowAlert(false)

      }} onCloseClicked={function (): void {
        setShowAlert(false)
      }} showCloseButton={false} successFailure={alertForSuccess} />}

      <LeftPanelMenus selectedMenu={4} showLeftPanel={false} rightBoxUI={
        <div className="container">
          <div className="row mt-4">
            <div className="col-lg-12">

              <div className="row" id="top">
                <div className="col-lg-12 mb-3">
                  <div className="heading25">
                    Battery Master
                    <button className="blue_btn" style={{float:"right"}} onClick={() => {
                      setAddProduct(true);
                      setShowUploadDialog(true);
                      setProductID(0);
                    }}>Add Product</button>
                  </div>
                  
                </div>
                <div className="col-lg-12 mb-4 ">
                  <div className="attendance_filter_box" id="filter_whitebox_open">
                    <div className="row" style={{ alignItems: "center" }}>

                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Model Number: </label>
                          <input type="text" id="model" name="model" value={dataFilters.model} onChange={handleInputChange} />
                        </div>
                      </div>

                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Serial Number: </label>
                          <input type="text" id="serial_no" name="serial_no" value={dataFilters.serial_no} onChange={handleInputChange} />
                        </div>
                      </div>
                     
                      <div className="col-lg-2">
                        <div className="form_box ">
                          <label htmlFor="formFile" className="form-label">Manufacturing Date: </label>
                          <input type="date" id="manufacturing_date" name="manufacturing_date" value={dataFilters.manufacturing_date} onChange={handleInputChange} />
                        </div>
                      </div>

                      <div className="col-lg-2 pt-4">
                        <a className="blue_btn" onClick={() => { fetchData(dataFilters.page); }}>Submit</a> <a className="blue_btn" onClick={() => resetFilter()}>Reset</a>
                      </div>

                    </div>
                  </div>
                </div>

              </div>
              <div className="row mb-3">
                <div className="col-lg-12">
                  <div className="grey_box" style={{ backgroundColor: "#fff" }}>
                    <div className="row list_label mb-4">
                      <div className="col-lg-1 text-center"><div className="label">No.</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Serial No.</div></div>
                      <div className="col-lg-2 text-center"><div className="label">MFG Date</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Created By</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Updated By</div></div>
                      <div className="col-lg-2 text-center"><div className="label">Updated Date</div></div>
                      <div className="col-lg-1 text-center"><div className="label">Action</div></div>

                    </div>

                    {batteryListData && batteryListData.length > 0 &&
                      batteryListData.map((battery) => (
                        <div className="row list_listbox" style={{ alignItems: "center", cursor: "pointer" }} key={battery.pk_id} >
                          <div className="col-lg-1 text-center"><div className="label">{battery.battery_model}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{battery.battery_serial_number}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{battery.manufacturing_date}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{battery.created_by_username}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{battery.updated_by_username?battery.updated_by_username:"--"}</div></div>
                          <div className="col-lg-2 text-center"><div className="label">{formatDateYYYYMMDD(battery.updated_at)}</div></div>
                          <div className="col-lg-1 text-center"><div className="label" onClick={() => {    
                            setShowUploadDialog(true);       
                            setProductID(battery.pk_id)   ;
                            setAddProduct(false);              
                          }}><img src={staticIconsBaseURL + "/images/edit.png"} alt="Varroc Excellence" title='Edit' className="img-fluid" style={{ maxHeight: "18px" }} /></div></div>
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
          <div className={showUploadDialog ? "rightpoup rightpoupopen" : "rightpoup"}> 

                {showUploadDialog && <EditProductDetail isAddProduct={isAddProduct} product_id={productID} onClose={(loadData) => {setShowUploadDialog(false);
                  if(loadData){fetchData(dataFilters.page)}}}  />}
          </div>
        </div>
      } />
    </div>
  )
}

export default BatteryListing
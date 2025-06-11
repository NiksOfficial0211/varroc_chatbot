'use client'
import React, { useEffect, useState } from 'react'

import LoadingDialog from './PageLoader';
import ShowAlertMessage from './alert';
import { staticIconsBaseURL } from '../pro_utils/string_constants';
import { useGlobalContext } from '../contextProviders/globalContext';
import { ProductInfoMasterUserModel } from '../datamodels/BatteryDataModel';
import { ErrorLogDataModel } from '../datamodels/ErrorLogDataModel';

interface FormValues {
    
    comments: any,
    

}


const ViewUpdateErrorLogs = ({error_log_id,   onClose }: {error_log_id: any, onClose: (loadData:boolean) => void }) => {
    const [isLoading, setLoading] = useState(false);

    const { auth_id } = useGlobalContext()
    const [showAlert, setShowAlert] = useState(false);
    const [errorLog, setErrorLogs] = useState<ErrorLogDataModel>();
    
    const [formValues, setFormValues] = useState<FormValues>({
        comments: '',
        
    });
    const [alertForSuccess, setAlertForSuccess] = useState(0);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertStartContent, setAlertStartContent] = useState('');
    const [errors, setErrors] = useState<Partial<FormValues>>({});


    useEffect(() => {
        fetchData()

    }, []);

    const fetchData = async () => {
        setLoading(true);
            try {
              const apiRes = await fetch("/api/get_error_logs_details", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
                },
                body: JSON.stringify({
                    pk_error_id:error_log_id
                })
        
              });
              const responseData = await apiRes.json();
        
              if (responseData.status == 1) {
                setLoading(false);
                setErrorLogs(responseData.data[0])
                
              }
              else {
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
    const handleInputChange = async (e: any) => {
        const { name, value } = e.target;
        // console.log("Form values updated:", formValues);
        setFormValues((prev) => ({ ...prev, [name]: value }));
    }
    const validate = () => {
        const newErrors: Partial<FormValues> = {};

        if (!formValues.comments) newErrors.comments = "Please add your comments";
        
        console.log(newErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("handle submit is called");
        
        if (!validate()) return;
        const created_json={"comment":formValues.comments}
        try{
        const res = await fetch('api/update_error_log', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json", // 🔥 Important for raw JSON
                        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
                    },
                    body: JSON.stringify({
                        auth_id:auth_id,
                        pk_error_id:error_log_id,
                        updated_json:created_json
                    })
                });
                const responseJson = await res.json();
                if(responseJson.status==1){
                    console.log(e);

                    setLoading(false);
                    setShowAlert(true);
                    setAlertTitle("Success")
                    setAlertStartContent("Data Updated Successfully");
                    setAlertForSuccess(1)
                }else{
                    console.log(e);

                    setLoading(false);
                    setShowAlert(true);
                    setAlertTitle("Error")
                    setAlertStartContent(responseJson.message);
                    setAlertForSuccess(2)
                }
            }catch(e){
                console.log(e);

                setLoading(false);
                setShowAlert(true);
                setAlertTitle("Exception")
                setAlertStartContent("Exception occured! Something went wrong.");
                setAlertForSuccess(2)
            }
        

    }

    return (

        <div className=''>
            {/* <form ></form> */}
            <LoadingDialog isLoading={isLoading} />
            {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
                setShowAlert(false)
                if(alertForSuccess==1){
                    onClose(true);
                }
            }} onCloseClicked={function (): void {
                setShowAlert(false)
            }} showCloseButton={false} successFailure={alertForSuccess} />}
            <div className='rightpoup_close' onClick={()=>onClose(false)}>
                <img src={staticIconsBaseURL + "/images/remove.png"} alt="Search Icon" title='Close' />
            </div>

            <div className="row">
                <div className="col-lg-12 mb-4 inner_heading25">Battery Detail</div>
            </div>
            <form>
                <div className="row">
                    <div className="col-lg-4" style={{fontFamily:"GothamMedium"}}>Customer Phone:</div>                    
                    <div className="col-lg-8 mb-4">{errorLog?.user_phone}</div>

                    <div className="col-lg-4" style={{fontFamily:"GothamMedium"}}>Input data:</div>
                    <div className="col-lg-8 mb-4">{errorLog?.logged_json}</div>
                    
                    <div className="col-lg-4" style={{fontFamily:"GothamMedium"}}>Error Response:</div>
                    <div className="col-lg-8 mb-4">{errorLog?.logged_json}</div>
                    
                    {errorLog && errorLog.auth_id && errorLog.changed_json_log ?<>
                    <div className="col-lg-4" style={{fontFamily:"GothamMedium"}}>Admin Name:</div>
                    <div className="col-lg-8 mb-4">{errorLog?.username}</div>

                    <div className="col-lg-4" style={{fontFamily:"GothamMedium"}}>Updated Data:</div>
                    <div className="col-lg-8 mb-4">{errorLog?.changed_json_log}</div>
                    </>:
                    <div className="row">
                        <div className="col-lg-4" style={{fontFamily:"GothamMedium"}}>Comments*:</div>
                        <div className="col-lg-8 mb-4">
                            <textarea name="comments" id="comments" value={formValues.comments} style={{ width: "100%", height: "75px" }} onChange={handleInputChange}></textarea>
                            {errors.comments && <span className="error" style={{ color: "red" }}>{errors.comments}</span>}
                        </div>
                    </div>
                    }

                </div>
                {errorLog && !errorLog?.auth_id && !errorLog.changed_json_log  && <div className="row">
                    <div className="col-lg-7"></div>
                    <div className="col-lg-5" style={{float:"right"}}>

                        <a className="blue_btn " style={{ cursor: "pointer", }} onClick={handleSubmit}>Update</a> <a className="blue_btn" style={{ cursor: "pointer", }} onClick={()=>onClose(false)}>Close</a>

                    </div>
                </div>}
            </form>
        </div>




    )
}

export default ViewUpdateErrorLogs;





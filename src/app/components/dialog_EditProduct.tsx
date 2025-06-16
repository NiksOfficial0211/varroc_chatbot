'use client'
import React, { useEffect, useState } from 'react'
import Papa from 'papaparse';
import { error } from 'console';
import LoadingDialog from './PageLoader';
import ShowAlertMessage from './alert';
import { staticIconsBaseURL } from '../pro_utils/string_constants';
import ExcelJS, { CellRichTextValue } from "exceljs";
import { useGlobalContext } from '../contextProviders/globalContext';
import { ProductInfoMasterUserModel } from '../datamodels/BatteryDataModel';

interface FormValues {
    model_no: any,
    varroc_part_code: any,
    serial_no: any,
    manufacturing_date: any,
    description: any,
    proposed_mrp: any,

}


const AddEditProductDetail = ({ isAddProduct, product_id, onClose }: { isAddProduct: boolean, product_id: any, onClose: (loadData: boolean) => void }) => {
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isLoading, setLoading] = useState(false);

    const { auth_id } = useGlobalContext()
    const [showAlert, setShowAlert] = useState(false);
    const [productDetail, setProductDetail] = useState<ProductInfoMasterUserModel>();
    const [formValues, setFormValues] = useState<FormValues>({
        model_no: '',
        varroc_part_code: '',
        serial_no: '',
        manufacturing_date: '',
        description: '',
        proposed_mrp: '',
    });
    const [alertForSuccess, setAlertForSuccess] = useState(0);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertStartContent, setAlertStartContent] = useState('');
    const [errors, setErrors] = useState<Partial<FormValues>>({});


    useEffect(() => {
        fetchData()

    }, []);

    const fetchData = async () => {
        if (!isAddProduct) {
            try {
                const res = await fetch('api/get_battery_detail', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json", // 🔥 Important for raw JSON
                        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
                    },
                    body: JSON.stringify({
                        product_id: product_id
                    })
                });
                const responseJson = await res.json();

                if (responseJson.status == 1) {
                    setProductDetail(responseJson.data[0])
                    setFormValues({
                        model_no: responseJson.data[0].battery_model,
                        varroc_part_code: responseJson.data[0].varroc_part_code,
                        serial_no: responseJson.data[0].battery_serial_number,
                        manufacturing_date: responseJson.data[0].manufacturing_date,
                        description: responseJson.data[0].battery_description,
                        proposed_mrp: responseJson.data[0].proposed_mrp,
                    })

                } else {
                    setLoading(false);
                    setShowAlert(true);
                    setAlertTitle("Error")
                    setAlertStartContent(responseJson.message);
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

    }
    const handleInputChange = async (e: any) => {
        const { name, value } = e.target;
        
        // console.log("Form values updated:", formValues);
        if (name=="proposed_mrp" && /^[0-9]*\.?[0-9]*$/.test(value)) {
            setFormValues((prev) => ({
                ...prev,
                [name]: value,
            }));
        } else  if(name !="proposed_mrp"){
            setFormValues((prev) => ({ ...prev, [name]: value }));
        }
    }
    const validate = () => {
        const newErrors: Partial<FormValues> = {};

        if (!formValues.model_no) newErrors.model_no = "Model Number is required";
        if (!formValues.varroc_part_code) newErrors.varroc_part_code = "Varroc part code is required";
        if (!formValues.serial_no) newErrors.serial_no = "Serial Number is required";
        if (!formValues.manufacturing_date) newErrors.manufacturing_date = "Manufacturing date is required";
        if (!formValues.proposed_mrp) newErrors.proposed_mrp = "Proposed mrp is required";
        if (!formValues.description) newErrors.description = "Description is required";
        console.log(newErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("handle submit is called");

        if (!validate()) return;
        try {
            const res = await fetch('api/add_update_battery_info', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // 🔥 Important for raw JSON
                    "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
                },
                body: isAddProduct ? JSON.stringify({
                    auth_id: auth_id,
                    model_no: formValues.model_no,
                    varroc_part_code: formValues.varroc_part_code,
                    serial_no: formValues.serial_no,
                    manufacturing_date: formValues.manufacturing_date,
                    description: formValues.description,
                    proposed_mrp: formValues.proposed_mrp,
                    isProductAdd: isAddProduct
                }) : JSON.stringify({
                    auth_id: auth_id,
                    model_no: formValues.model_no,
                    varroc_part_code: formValues.varroc_part_code,
                    serial_no: formValues.serial_no,
                    manufacturing_date: formValues.manufacturing_date,
                    description: formValues.description,
                    proposed_mrp: formValues.proposed_mrp,
                    isProductAdd: isAddProduct,
                    pk_id: product_id
                })
            });
            const responseJson = await res.json();
            if (responseJson.status == 1) {
                console.log(e);

                setLoading(false);
                setShowAlert(true);
                setAlertTitle("Success")
                setAlertStartContent(isAddProduct ? "Data added Successfully" : "Data Updated Successfully");
                setAlertForSuccess(1)
            } else {
                console.log(e);

                setLoading(false);
                setShowAlert(true);
                setAlertTitle("Error")
                setAlertStartContent(responseJson.message);
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

    return (

        <div className=''>
            {/* <form ></form> */}
            <LoadingDialog isLoading={isLoading} />
            {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
                setShowAlert(false)
                if (alertForSuccess == 1) {
                    onClose(true);
                }
            }} onCloseClicked={function (): void {
                setShowAlert(false)
            }} showCloseButton={false} successFailure={alertForSuccess} />}
            <div className='rightpoup_close' onClick={() => onClose(false)}>
                <img src={staticIconsBaseURL + "/images/remove.png"} alt="Search Icon" title='Close' />
            </div>

            <div className="row">
                <div className="col-lg-12 mb-4 inner_heading25">{isAddProduct ? "Add" : "Update"} Battery Detail</div>
            </div>
            <form>
                <div className="row">
                    <div className="col-lg-6 mb-3">


                        <div className="form_box">
                            <label htmlFor="formFile" className="form-label">Model Number*: </label>
                            <input type="text" id="model_no" name="model_no" value={formValues.model_no} onChange={handleInputChange} />
                            {errors.model_no && <span className="error" style={{ color: "red" }}>{errors.model_no}</span>}
                        </div>


                    </div>
                    <div className="col-lg-6 mb-3">


                        <div className="form_box">
                            <label htmlFor="formFile" className="form-label">Varroc Part Code*: </label>
                            <input type="text" id="varroc_part_code" name="varroc_part_code" value={formValues.varroc_part_code} onChange={handleInputChange} />
                            {errors.varroc_part_code && <span className="error" style={{ color: "red" }}>{errors.varroc_part_code}</span>}
                        </div>


                    </div>
                    <div className="col-lg-6 mb-3">


                        <div className="form_box">
                            <label htmlFor="formFile" className="form-label">Serial Number*: </label>
                            <input type="text" id="serial_no" name="serial_no" value={formValues.serial_no} onChange={handleInputChange} />
                            {errors.serial_no && <span className="error" style={{ color: "red" }}>{errors.serial_no}</span>}
                        </div>


                    </div>
                    <div className="col-lg-6 mb-3">


                        <div className="form_box">
                            <label htmlFor="formFile" className="form-label">Manufacturing Date*: </label>
                            <input type="date" id="manufacturing_date" name="manufacturing_date" value={formValues.manufacturing_date} onChange={handleInputChange} />
                            {errors.manufacturing_date && <span className="error" style={{ color: "red" }}>{errors.manufacturing_date}</span>}
                        </div>


                    </div>
                    <div className="col-lg-6 mb-3">
                        <div className="form_box">
                            <label htmlFor="formFile" className="form-label">Proposed mrp*: </label>
                            <input type="text" id="proposed_mrp" name="proposed_mrp" value={formValues.proposed_mrp} onChange={handleInputChange} />
                            {errors.proposed_mrp && <span className="error" style={{ color: "red" }}>{errors.proposed_mrp}</span>}
                        </div>
                    </div>
                    {!isAddProduct && <div className="col-lg-6 mb-3">
                        <div className="request_list">
                            <label htmlFor="formFile" className="form-label">Added BY: </label>
                            <span>{productDetail?.created_by_username}</span>

                        </div>
                    </div>}
                    <div className="col-lg-12 mb-3">
                        <div className="form_box">
                            <label htmlFor="formFile" className="form-label">Description*: </label>
                            <div className='form_box'>
                                <textarea name="description" id="description" value={formValues.description} style={{ width: "100%", height: "75px" }} onChange={handleInputChange}></textarea>
                                {errors.description && <span className="error" style={{ color: "red" }}>{errors.description}</span>}

                            </div>
                        </div>
                    </div>

                </div>
                <div className="row">
                    <div className="col-lg-12" style={{ textAlign: "right" }}>

                        <a className="blue_btn " style={{ cursor: "pointer", }} onClick={handleSubmit}>{isAddProduct ? "Add" : "Update"}</a> <a className="blue_btn" style={{ cursor: "pointer", }} onClick={() => onClose(false)}>Close</a>

                    </div>
                </div>
            </form>
        </div>




    )
}

export default AddEditProductDetail;





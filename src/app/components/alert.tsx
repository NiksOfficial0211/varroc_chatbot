import React from 'react'
import { staticIconsBaseURL } from '../pro_utils/string_constants'

const ShowAlertMessage = ({ title, startContent, successFailure,  onOkClicked, onCloseClicked, showCloseButton }: { title: any, startContent: any, successFailure:any, onOkClicked: (successFailure:any) => void, onCloseClicked: () => void, showCloseButton: boolean }) => {
  return (
    <div className='alert_mainbox'>
      <div className='alert_innerbox'>
        <div className='alert_whitebox'>
          <div className="row text-center">
            <div className="col-lg-12 mb-4"><img src={
              successFailure==1?staticIconsBaseURL + "/images/success_icon.png"
              :successFailure==2?staticIconsBaseURL + "/images/error_icon.png":
              staticIconsBaseURL + "/images/default_icon.png"
            } 
            style={{maxWidth:"110px"}} className="img-fluid" /></div>
            <div className="col-lg-12">
              <div className='alert_heading'>
                {title}
              </div>
              <div className='alert_content'>{startContent}</div>
              <div className='alert_btn'><input type="button" value="Ok" className="black_btn" onClick={()=>onOkClicked(successFailure)} /></div>
              {showCloseButton && <div className='alert_btn'><input type="button" value="Close" className="black_btn" onClick={onCloseClicked} /></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShowAlertMessage
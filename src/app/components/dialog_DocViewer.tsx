import React from 'react'
import { getImageApiURL, staticIconsBaseURL } from '../pro_utils/string_constants'
import { FileViewer } from './DocViewer'

const DialogImagePop = ({ fileURL, onDownloadClicked, onCloseClicked }: { fileURL: any, onDownloadClicked: () => void, onCloseClicked: () => void }) => {
  return (
    <div className='alert_mainbox'>
      <div className='alert_innerbox alert_innerbox2'>
        <div className='alert_whitebox'>
          <div className="row">
            <div className="col-lg-12">
              <div className='rightpoup_close' onClick={onCloseClicked}>
                <img src={staticIconsBaseURL + "/images/remove.png"} alt="Search Icon" title='Close' />
              </div>
            </div>
          </div>
          <div className="row text-center">
            <div className="col-lg-12 mb-3">
              <a href={fileURL.includes("uploads")? getImageApiURL + "/" + fileURL:fileURL} download>
                <input type="button" value="Download" className="blue_btn" onClick={() => onDownloadClicked()} />
              </a>
              {/* <input type="button" value="Close" className="blue_btn" onClick={onCloseClicked} /> */}
            </div>
            <div className="col-lg-12 mb-4">
              <div className=''>
                <FileViewer fileUrl={fileURL.includes("uploads")? getImageApiURL + "/" + fileURL: fileURL} isDialogView={true} set_height={350} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default DialogImagePop
import React from 'react'

const PageErrorCenterContent = ({content}:{content:any}) => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "40px" }}>
                        {<h3 className="text-muted">{content}</h3>}
                    </div>
  )
}

export default PageErrorCenterContent
import React from 'react'
import { baseUrl, pageURL_dashboard } from '../pro_utils/string_routes'
import { staticIconsBaseURL } from '../pro_utils/string_constants'
import { useRouter } from 'next/navigation'

const HeaderComponent = () => {
    const router =useRouter()

    const handleLogout = () => {
        // Clear sessionStorage
        sessionStorage.removeItem("userSession");
        
        // Optional: Clear all session storage
        // sessionStorage.clear();
        
        // Redirect to login page
        
        router.push('/');
      };
    return (
        <div className="header_box mb-5">
            <div className='blue_corner'><img src={staticIconsBaseURL + "/images/blue_corner.png"} alt="Varroc Excellence" className="img-fluid" style={{ maxHeight: "120px" }} /></div>
            <div className='rightbox_inner'>
                
                <div className="container">
                    <div className="row">
                        <div className="col-lg-11 welcome_text">
                            Battery Warranty Dashboard
                        </div>
                        <div className="col-lg-1 text-center">
                            <a onClick={()=>handleLogout()}>
                                <img src={staticIconsBaseURL + "/images/logout_icon.png"} alt="Varroc Excellence" className="img-fluid" style={{ maxHeight: "30px", margin:"6px 0 0 0", float:"right", cursor:"pointer"}}/>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HeaderComponent
// 'use client';
// import Image from "next/image";
// import styles from "./page.module.css";
// import { staticIconsBaseURL } from "./pro_utils/string_constants";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import ShowAlertMessage from "./components/alert";
// import LoadingDialog from "./components/PageLoader";
// import { pageURL_dashboard } from "./pro_utils/string_routes";
// import { MD5 } from 'crypto-js';


// export default function Home() {
//   const [formEmail, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const router = useRouter();

//   const [isLoading, setLoading] = useState(false);

//   const [isChecked, setIsChecked] = useState(true);
//   const [showAlert, setShowAlert] = useState(false);
//   const [alertForSuccess, setAlertForSuccess] = useState(0);
//   const [alertTitle, setAlertTitle] = useState('');
//   const [alertStartContent, setAlertStartContent] = useState('');


//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const hashedPassword = MD5(password).toString();

//     setLoading(true);
//     try {
//       const res = await fetch("/api/auth/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json", // 🔥 Important for raw JSON
//         },
//         body: JSON.stringify({
//           email: formEmail,
//           password: hashedPassword,
//         }),
//       });

//       const response = await res.json();

//       if (response.status == 1) {
//         setLoading(false);
//         sessionStorage.setItem("session", JSON.stringify({ auth_id: response.user.auth_id, userName: response.user.username, is_login: true }));
//         router.push(pageURL_dashboard)

//       } else {
//         setLoading(false);
//         setShowAlert(true);
//         setAlertTitle("Error")
//         setAlertStartContent(response.message);
//         setAlertForSuccess(2)
//       }
//     } catch (e) {
//       setLoading(false);
//       setShowAlert(true);
//       setAlertTitle("Exception")
//       setAlertStartContent("Exception occured! Something went wrong.");
//       setAlertForSuccess(2)
//     }

//   }

//   return (
//     <div className="position-relative min-vh-100 d-flex align-items-center justify-content-center bg-light">      {/* Top Left SVG */}
//       <LoadingDialog isLoading={isLoading} />
//       {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
//         setShowAlert(false)

//       }} onCloseClicked={function (): void {
//         setShowAlert(false)
//       }} showCloseButton={false} successFailure={alertForSuccess} />}
//       <div className="container">
//         <div className="row justify-content-center">
//           <div className="col-lg-8">
//             <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
//               <div className="row g-0">
//                 {/* Illustration Side */}
//                 <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-primary bg-opacity-10">
//                   {/* Replace the SVG below with your own illustration if needed */}
//                   {/* <svg width="220" height="220" viewBox="0 0 220 220" fill="none"> */}
//                   <a href="#"><img src={staticIconsBaseURL + "/images/main_logo.webp"} className="img-fluid login_logo" ></img></a>

//                   {/* </svg> */}
//                 </div>
//                 {/* Form Side */}
//                 <div className="col-md-6 bg-white p-5">

//                   <h2 className="mb-2 login_heading text-center">Welcome!</h2>
//                   <p className="mb-4 text-center text-secondary">Sign in to your Account</p>
//                   <form onSubmit={handleSubmit}>
//                     <div className="row">
//                       <div className="col-lg-12 mb-2">
//                         <input type="text" className="login_input" placeholder={"Email"} value={formEmail} onChange={(e) => setEmail(e.target.value)} required />
//                       </div>
//                     </div>
//                     <div className="mb-2">
//                       <div className="row ">
//                         <div className="col-lg-12 mb-2">
//                           <div className="Form-fields" >

//                             <label htmlFor="password1" className="Control-label Control-label--password">

//                             </label>

//                             <input
//                               type="checkbox"
//                               id="show-password1"
//                               className="show-password"
//                               checked={isChecked}
//                               onChange={() => setIsChecked(!isChecked)}
//                             />
//                             <label htmlFor="show-password1" className="Control-label Control-label--showPassword">
//                               <svg
//                                 xmlns="http://www.w3.org/2000/svg"
//                                 viewBox="0 0 48 48"
//                                 width="32"
//                                 height="32"
//                                 className="svg-toggle-password"
//                                 aria-labelledby="toggle-password1-title"
//                               >
//                                 <title id="toggle-password1-title">Hide/Show Password</title>
//                                 <path d="M24,9A23.654,23.654,0,0,0,2,24a23.633,23.633,0,0,0,44,0A23.643,23.643,0,0,0,24,9Zm0,25A10,10,0,1,1,34,24,10,10,0,0,1,24,34Zm0-16a6,6,0,1,0,6,6A6,6,0,0,0,24,18Z" />
//                                 <rect
//                                   x="20.133"
//                                   y="2.117"
//                                   height="44"
//                                   transform="translate(23.536 -8.587) rotate(45)"
//                                   className="closed-eye"
//                                 />
//                                 <rect
//                                   x="22"
//                                   y="3.984"
//                                   width="4"
//                                   height="44"
//                                   transform="translate(25.403 -9.36) rotate(45)"
//                                   style={{ fill: '#fff' }}
//                                   className="closed-eye"
//                                 />
//                               </svg>
//                             </label>
//                             {/* Input for Password */}
//                             <input
//                               type="text"
//                               id="password1"
//                               placeholder="Password"
//                               autoComplete="off"
//                               autoCapitalize="off"
//                               autoCorrect="off"

//                               pattern=".{6,}"
//                               className="login_input ControlInput--password"
//                               value={password} name="confirmPassword" onChange={(e) => setPassword(e.target.value)}
//                             />

//                           </div>


//                         </div>


//                       </div>
//                     </div>
//                     <div className="mb-3 text-end">
//                       <a href="/forgot-password" className="text-decoration-none small text-primary">
//                         Forgot Password?
//                       </a>
//                     </div>
//                     <div className="d-grid">
//                       <button type="submit" className="black_btn">
//                         Sign in
//                       </button>
//                     </div>
//                   </form>
//                   {/* No sign up or social media */}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );


// }


// // <svg
// //         className="position-absolute"
// //         style={{ top: 0, left: 0, zIndex: 0 }}
// //         width="200"
// //         height="200"
// //         viewBox="0 0 400 400"
// //         xmlns="http://www.w3.org/2000/svg"
// //       >
// //         <path
// //           d="M0,0 Q250,0 400,200 Q200,100 0,400 Z"
// //           fill="black"
// //         />
// //       </svg>

// //       {/* Bottom Right SVG */}
// //       <svg
// //         className="position-absolute"
// //         style={{ top: 0, right: 0, zIndex: 0 }}
// //         width="200"
// //         height="200"
// //         viewBox="0 0 400 400"
// //         xmlns="http://www.w3.org/2000/svg"
// //       >
// //         <path
// //           d="M400,400 Q150,100 0,200 Q200,0 400,0 Z"
// //           fill="black"
// //         />
// //       </svg>


'use client';
import Image from "next/image";
import styles from "./page.module.css";
import { staticIconsBaseURL } from "./pro_utils/string_constants";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ShowAlertMessage from "./components/alert";
import LoadingDialog from "./components/PageLoader";
import { pageURL_dashboard } from "./pro_utils/string_routes";
import { MD5 } from 'crypto-js';
import { useGlobalContext } from "./contextProviders/globalContext";

interface formValues {
  email: any,
  password: any
  
}
export default function Home() {
  const [formEmail, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const [isLoading, setLoading] = useState(false);
  const {setGlobalState}=useGlobalContext()
  const [isChecked, setIsChecked] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertForSuccess, setAlertForSuccess] = useState(0);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertStartContent, setAlertStartContent] = useState('');

    const [errors, setErrors] = useState<Partial<formValues>>({});

  const validate = () => {
    const newErrors: Partial<formValues> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formEmail) newErrors.email = "required";
    if (formEmail && !emailRegex.test(formEmail)) {
        newErrors.email = "Valid email is required";
        setErrors(newErrors);
    }
    if (!password) newErrors.password = "required";

    setErrors(newErrors); 
    return Object.keys(newErrors).length === 0;
  }  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;
    
    const hashedPassword = MD5(password).toString();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 🔥 Important for raw JSON
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_API_SECRET_TOKEN}`
        },
        body: JSON.stringify({
          email: formEmail,
          password: hashedPassword,
        }),
      });

      const response = await res.json();

      if (response.status == 1) {
        setLoading(false);
        localStorage.setItem("session", JSON.stringify({ auth_id: response.user.auth_id, userName: response.user.username, is_login: true }));
        setGlobalState({
          selectedViewID:'',
          auth_id:response.user.auth_id,
          userName:response.user.username
        })
        router.push(pageURL_dashboard)

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
    <div className="login_mainbox position-relative min-vh-100 d-flex align-items-center justify-content-center">      {/* Top Left SVG */}
      <LoadingDialog isLoading={isLoading} />
      {showAlert && <ShowAlertMessage title={alertTitle} startContent={alertStartContent} onOkClicked={function (): void {
        setShowAlert(false)

      }} onCloseClicked={function (): void {
        setShowAlert(false)
      }} showCloseButton={false} successFailure={alertForSuccess} />}
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-7">
            <div className="login_whitebox">
              <div className="row g-0">
                <div className="col-md-4 d-none d-md-flex align-items-center justify-content-center">
                  <img src={staticIconsBaseURL + "/images/login_logo.png"} className="login_logo" ></img>
                </div>
                <div className="login_bluebox col-md-8 p-5 pt-4"> 
                  <h2 className="m-0 login_heading">Welcome!</h2>
                  <p className="mb-4 login_signin_text">Sign in to your <span style={{ color:"#49a8df"}}></span>Account</p>
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-lg-12 mb-3">
                        <input type="text" placeholder={"Email"} value={formEmail} onChange={(e) => setEmail(e.target.value)}/>
                        {errors.email && <span className="error" style={{color: "red"}}>{errors.email}</span>}

                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="row ">
                        <div className="col-lg-12 mb-2">
                          <div className="Form-fields" >

                            <label htmlFor="password1" className="Control-label Control-label--password">

                            </label>

                            <input
                              type="checkbox"
                              id="show-password1"
                              className="show-password"
                              checked={isChecked}
                              onChange={() => setIsChecked(!isChecked)}
                            />
                            <label htmlFor="show-password1" className="Control-label Control-label--showPassword">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 48 48"
                                width="32"
                                height="32"
                                className="svg-toggle-password"
                                aria-labelledby="toggle-password1-title"
                              >
                                <title id="toggle-password1-title">Hide/Show Password</title>
                                <path d="M24,9A23.654,23.654,0,0,0,2,24a23.633,23.633,0,0,0,44,0A23.643,23.643,0,0,0,24,9Zm0,25A10,10,0,1,1,34,24,10,10,0,0,1,24,34Zm0-16a6,6,0,1,0,6,6A6,6,0,0,0,24,18Z" />
                                <rect
                                  x="20.133"
                                  y="2.117"
                                  height="44"
                                  transform="translate(23.536 -8.587) rotate(45)"
                                  className="closed-eye"
                                />
                                <rect
                                  x="22"
                                  y="3.984"
                                  width="4"
                                  height="44"
                                  transform="translate(25.403 -9.36) rotate(45)"
                                  style={{ fill: '#fff' }}
                                  className="closed-eye"
                                />
                              </svg>
                            </label>
                            {/* Input for Password */}
                            <input
                              type="text"
                              id="password1"
                              placeholder="Password"
                              autoComplete="off"
                              autoCapitalize="off"
                              autoCorrect="off"

                              pattern=".{6,}"
                              className="login_input ControlInput--password"
                              value={password} name="confirmPassword" onChange={(e) => setPassword(e.target.value)}
                            />
                            {errors.password && <span className="error" style={{color: "red"}}>{errors.password}</span>}

                          </div>
                        </div>
                      </div>
                    </div>
                    {/* <div className="mb-3 text-end">
                      <a href="/forgot-password" className="forgot_pass">
                        Forgot Password?
                      </a>
                    </div> */}
                    <div>
                      <button type="submit" className="login_blue_btn">
                        Sign in
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


}


// <svg
//         className="position-absolute"
//         style={{ top: 0, left: 0, zIndex: 0 }}
//         width="200"
//         height="200"
//         viewBox="0 0 400 400"
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         <path
//           d="M0,0 Q250,0 400,200 Q200,100 0,400 Z"
//           fill="black"
//         />
//       </svg>

//       {/* Bottom Right SVG */}
//       <svg
//         className="position-absolute"
//         style={{ top: 0, right: 0, zIndex: 0 }}
//         width="200"
//         height="200"
//         viewBox="0 0 400 400"
//         xmlns="http://www.w3.org/2000/svg"
//       >
//         <path
//           d="M400,400 Q150,100 0,200 Q200,0 400,0 Z"
//           fill="black"
//         />
//       </svg>


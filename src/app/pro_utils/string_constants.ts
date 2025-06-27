

export const staticIconsBaseURL=`${process.env.NEXT_PUBLIC_BASE_URL}`;

export const logURL=staticIconsBaseURL+"/images/main_logo.webp";
export const getImageApiURL=`${process.env.NEXT_PUBLIC_BASE_URL}/api/loadImagePath?imagePath=`

export const color_black="#000000"
export const color_red="#d93731"
export const color_blue="#49a8df"
export const color_yellow="#f3b943"
export const color_pink="#d83187"
export const color_green="#4daa58"

export const apiStatusSuccessCode=200;
export const apiStatusFailureCode=500;
export const apiStatusInvalidDataCode=200;
export const apiStatusUnAuthenticated=202;
export const apiMessageUnAuthenticated='User not authenticated';


export const apiServerError ='Internal Server Error'
export const apiwentWrong="Something Went wrong! Please try again later";
export const apifailedWithException="Failed with an exception";


export const initialRequestID="VEL-AMD-BAT-";
export const initialComplaintID="VEL-AMD-CLM-";

// initialRequestID----->"VEL-AMD-BAT-240530-00001"; 240530 is yymmdd and autoincrementing last part from 00001-99999

// this are the statues in db to compare and the primary key id

export const status_Pending=1;
export const status_Verified=2;
export const status_Rejected=4;
export const status_Duplicate=5;

export const complaint_status_new=6;
export const complaint_status_Investigating=7;
export const complaint_status_resolved=8;
export const complaint_status_closed=9;
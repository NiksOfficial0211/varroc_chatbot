import { NextRequest, NextResponse } from "next/server";
import multiparty from 'multiparty';
import { Readable } from "stream";
import { apifailedWithException, apiStatusFailureCode, initialRequestID } from "./string_constants";

export function generateMixedString() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    let result = '';
    array.forEach((byte) => {
      result += chars[byte % chars.length];
    });
    return result;
  }
export function generateMixedStringWithNumbers(length = 8) {
  
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charsLength = chars.length;
        const randomString = [];
      
        const randomValues = new Uint8Array(length * 2); // oversample to reduce retries
        crypto.getRandomValues(randomValues);
      
        let i = 0;
        while (randomString.length < length && i < randomValues.length) {
          const randomByte = randomValues[i];
          if (randomByte < charsLength * Math.floor(256 / charsLength)) {
            randomString.push(chars[randomByte % charsLength]);
          }
          i++;
        }
      
        // If string is still short, regenerate
        while (randomString.length < length) {
          const retryArray = new Uint8Array(1);
          crypto.getRandomValues(retryArray);
          const randomByte = retryArray[0];
          if (randomByte < charsLength * Math.floor(256 / charsLength)) {
            randomString.push(chars[randomByte % charsLength]);
          }
        }
      
        return randomString.join('');
      
      
  }



export function formatDateYYYYMMDD(inputDate:string){
    const [day, month, year] = inputDate.split('/');
    const formattedDate = `${year}-${month}-${day}`; 
    return formattedDate;
}  

export function setUploadFileName(fileName: String) {
  const name = fileName.replaceAll(" ", "_");
  const subSt = name.substring(0, name.lastIndexOf("."));
  return subSt + new Date().toLocaleDateString().replaceAll("/", "") + new Date().toLocaleTimeString().substring(0, 4).replaceAll(":", "") + name.substring(name.lastIndexOf("."));

}

// Record<string, any[]>

export type MultiPartFile = {
  fieldName: string;
  originalFilename: string;
  path: string;
  headers: { [key: string]: string };
  size: number;
};


export const parseForm = async (req: NextRequest): Promise<{
  fields: Record<string, string[]>;
  files: Record<string, MultiPartFile[]>;
}> => {
  const incomingReq = await toIncomingMessage(req);

  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();

    form.parse(incomingReq, (err, rawFields, rawFiles) => {
      if (err) return reject(err);

      // Normalize fields: ensure every value is a string[]
      const fields: Record<string, string[]> = {};
      for (const key in rawFields) {
        const value = rawFields[key];
        fields[key] = Array.isArray(value) ? value : [];
      }
      const files: Record<string, MultiPartFile[]> = {};
      for (const key in rawFiles) {
        const fileList = rawFiles[key];
        files[key] = Array.isArray(fileList) ? fileList as MultiPartFile[] : [];
      }

      resolve({ fields, files });
    });
  });
};

// Convert ReadableStream (Web) to Node Readable stream
async function toIncomingMessage(req: NextRequest): Promise<any> {
  const reader = req.body?.getReader();
  const chunks: Uint8Array[] = [];

  if (!reader) throw new Error("Request body is empty");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);
  const stream = Readable.from(buffer);

  // Mimic IncomingMessage
  return Object.assign(stream, {
    headers: Object.fromEntries(req.headers.entries()),
    method: req.method,
    url: req.url,
  });
}


export function funSendApiException(error: any) {
  return NextResponse.json({
    message: apifailedWithException,
    error: error.toString(),
    status:3
  }, { status: apiStatusFailureCode })
}

export function generateRequestID(resultID: any[]) {
  if(resultID.length>0){  
    return incrementRequestID(resultID[0].request_id);
  }else{
    return initialRequestID+formatDateYYMMDD(new Date())+"-00001"
  }
}
export function generateComplaintID(resultID: any[]) {
  // if(resultID.length>0){  
  //   return incrementRequestID(resultID[0].request_id);
  // }else{
  //   return initialRequestID+formatDateYYMMDD(new Date())+"-00001"
  // }
  console.log("this is from generateComplaintID;-----------",resultID);
  if(resultID&& resultID.length>0 && resultID[0].complaint__id){
    const parts = resultID[0].complaint__id.split("-");
    const lastPart = parts.pop();
    const increment_id= parseInt(lastPart)+1;
    return formatDateYYMMDD(new Date())+"-"+increment_id;
  }else{
    return formatDateYYMMDD(new Date())+"-"+100;
  }
}


export function formatDateYYMMDD(inputDate: Date): string {
  const day = String(inputDate.getDate()).padStart(2, '0');
  const month = String(inputDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const year = String(inputDate.getFullYear()).slice(-2); // Last 2 digits
  return `${year}${month}${day}`;
}

export function incrementRequestID(id: string): string {
  const parts = id.split("-");
  const lastPart = parts.pop();

  if (!lastPart) throw new Error("Invalid ID format");

  const num = parseInt(lastPart, 10);
  const nextNum = num >= 99999 ? 1 : num + 1;

  const incremented = String(nextNum).padStart(5, '0');
  parts.push(incremented);

  return parts.join("-");
}


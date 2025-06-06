import type { Metadata } from "next";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import localFont from "next/font/local";
import { GlobalContextProvider } from "./contextProviders/globalContext";




export const metadata: Metadata = {
  title: "Varroc-AMD",
  description: "Leading Auto Components Manufacturer",
};

// const GothamBold = localFont({
//   src: "./fonts/Gotham-Bold.otf",
//   variable: "--GothamBold",
//   weight: "100 900",
// });
// const font_gotham_medium = localFont({
//   src: "./fonts/gotham-medium.woff2",
//   variable: "--font_gotham_medium",
//   weight: "100 900",
// });
// const GothamMedium = localFont({
//   src: "./fonts/Gotham-Medium.otf",
//   variable: "--GothamMedium",
//   weight: "100 900",
// });
// const GothamBlack = localFont({
//   src: "./fonts/Gothamblack.ttf",
//   variable: "--GothamBlack",
//   weight: "100 900",
// });
// const font_verdana = localFont({
//   src: "./fonts/Verdana.ttf",
//   variable: "--font_verdana",
//   weight: "100 900",
// });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className="body"
      // className={`
        
      //   ${GothamBold.variable} 
        
      //   ${font_gotham_medium.variable} 
      //   ${GothamMedium.variable} 
      //   ${font_verdana.variable} 
      //   ${GothamBlack.variable} 
      //   } antialiased`}
        >
          <GlobalContextProvider>
              {children}  
          </GlobalContextProvider>
        
      </body>
    </html>
  );
}

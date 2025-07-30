import path from 'path';
import fs from 'fs/promises';
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { writeFileSync } from 'fs';
import { supabase } from '../../../../utils/supabaseClient';

export async function POST(req: Request) {
    try{
  const data = await req.json(); // example: { name: 'Nikhil', email: '...', amount: '...' }
  const { reference_id, customer_name, phone_no, battery_serial_no,pin_code,city,
        purchase_dat,retailer_shop_name,warranty_start_date,warranty_end_date,request_date,
    varroc_part_code,manufacturing_date,description } = data;
  console.log("whole path got in process.cwd()",process.cwd());
        
  const templatePath = path.join(process.cwd(), 'htmltemplates', 'warrantycertificate.html');
  const html = await fs.readFile(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(html);
    const finalHtml = compiledTemplate(data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    // Generate file name
    const fileName = `${reference_id}.pdf`;

    // const currentMonthShort = new Date().toLocaleString('default', { month: 'short' });
    // const currentDate = getCurrentDateFormatted();
    // // Save to /public/generated/
    // const outputPath = path.join(process.cwd(), 'certificates', 'generated');
    // await fs.mkdir(outputPath, { recursive: true });
    // const filePath = path.join(outputPath, fileName);
    // writeFileSync(filePath, pdfBuffer);

    // // Construct URL
    // const fileURL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/loadImagePath?imagePath=/certificates/generated/${fileName}`;
    // console.log("this is the fileurl on upload",fileURL);
    const supabasefileName=fileName.replaceAll("-","_")
    let bucket = "complaint";
              const contentType = 'application/pdf';
    
              const { data:supabaseurl, error } = await supabase.storage
                .from(bucket)
                .upload(supabasefileName, pdfBuffer, {
                  contentType,
                  upsert: true,
                });
    
              if (error) {
                console.error("Upload error:", error);
              }
              const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(supabasefileName);
    
    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error('PDF Generation Error:', err);
    return new NextResponse('Failed to generate PDF', { status: 500 });
  }
}



function getCurrentDateFormatted(): string {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const yyyy = today.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}
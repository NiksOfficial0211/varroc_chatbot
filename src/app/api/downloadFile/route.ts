import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    let filePath: string = "";
    let fileName: string = "";
    let contentType: string = "";

    try {
        // Parse form data
        const formData = await request.formData();
        const fileType = formData.get('file_type');

        // Determine file path, name, and content type based on file type
        if (fileType === "csv") {
            filePath = path.join(process.cwd(), 'sample_files/', 'bat_sample_csv.csv');
            fileName = "bat_sample_csv.csv";
            contentType = "text/csv";
            
        } else {
            filePath = path.join(process.cwd(), 'sampleFiles/', 'bat_sample_excel.xlsx');
                fileName = "bat_sample_excel.xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            
        }

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            return new Response(JSON.stringify({ message: 'File not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Create a readable stream from the file
        const fileStream = fs.createReadStream(filePath);

        // Create a response with the file stream
        const response = new Response(fileStream as any, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Type': contentType,
            },
        });

        return response;
    } catch (error) {
        console.error('Error reading file:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
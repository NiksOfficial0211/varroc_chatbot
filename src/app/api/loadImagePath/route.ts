// src/app/api/uploads/route.ts
import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const rawPath = url.searchParams.get('imagePath');
  

  if (!rawPath) {
    return NextResponse.json({ error: 'Image path is required' }, { status: 400 });
  }
  let imagePath = rawPath.replace(/\\/g, '/'); // Convert backslashes to forward slashes

const uploadsIndex = imagePath.indexOf('/uploads/');
if (uploadsIndex !== -1) {
  imagePath = imagePath.substring(uploadsIndex + '/uploads/'.length); // Just keep 'warranty/Jul/..'
} else {
  return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
} 

  const filePath = path.join(process.cwd(), 'uploads', imagePath);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,

    },
  });
}

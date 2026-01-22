import { NextResponse } from 'next/server';
import GoogleDriveFileService from '../../../lib/google-drive-file-service.js';
import rateLimiter from '../../../lib/rate-limiter.js';

export async function GET(request) {
  try {
    // Rate limiting: 10 requests per minute per IP
    const clientId = rateLimiter.getClientIdentifier(request);
    if (!rateLimiter.isAllowed(clientId, 10, 60000)) {
      const remaining = rateLimiter.getRemainingRequests(clientId, 10, 60000);
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        remaining: remaining,
        resetTime: 60
      }, { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + 60).toString()
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Get the Google Drive service instance
    const googleDriveService = GoogleDriveFileService.getInstance();

    // Get the file details to get the original filename
    const fileDetails = await googleDriveService.getFileById(fileId);
    if (!fileDetails) {
      console.error(`❌ File not found: ${fileId}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Try Google Drive API with service account authentication
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    
    // Fetch the file content from Google Drive with service account authentication
    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${googleDriveService.driveService.accessToken}`
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file from Google Drive' }, { status: response.status });
    }

    // Get the file content as a buffer
    const fileBuffer = await response.arrayBuffer();

    // Return the PDF file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileDetails.name}"`,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error in proxy-pdf:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

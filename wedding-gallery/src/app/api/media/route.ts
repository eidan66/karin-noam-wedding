import { NextRequest, NextResponse } from 'next/server';

// Define the POST /media endpoint
export async function POST(request: NextRequest) {
  try {
    const { media_url, title, media_type, uploader_name } = await request.json(); // Data sent from the client

    console.log('Received media item data (S3 metadata based):', { media_url, title, media_type, uploader_name });

    // Assuming the metadata is already set on the S3 object during the initial upload
    // This endpoint now only serves to acknowledge the frontend that the item has been "processed"
    // (i.e., its upload URL was generated and the upload to S3 was completed by the client).

    // Optionally, if you need to perform any backend-specific actions after upload, do it here.
    // For now, we'll just send a success response.

    return NextResponse.json({ 
      message: 'Media item successfully processed', 
      media_url: media_url.split('?')[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('Error processing media item:', error);
    return NextResponse.json({ 
      message: 'Failed to process media item' 
    }, { status: 500 });
  }
}

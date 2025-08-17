import { NextRequest, NextResponse } from 'next/server';
import { listUploadedFiles } from '@/utils/s3';

export async function GET(request: NextRequest) {
  // Handle CORS
  const origin = request.headers.get('origin');
  
  try {
    // Check if required environment variables are set
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || 
        !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET_NAME) {
      console.error('Missing required AWS environment variables');
      return NextResponse.json(
        {
          code: 'MISSING_ENV_VARS',
          message: 'AWS configuration is incomplete. Please check environment variables.',
        },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // List files from S3 (now includes metadata)
    const items = await listUploadedFiles();

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = items.slice(start, end);

    const total = items.length;
    const hasMore = end < total;

    return NextResponse.json({
      items: paginated,
      page,
      limit,
      total,
      total_items: total, // match frontend type
      hasMore,
    }, {
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error) {
    console.error('Error listing uploaded files:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to retrieve uploaded files.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        errorMessage = 'AWS credentials are invalid or expired.';
        statusCode = 401;
      } else if (error.message.includes('bucket')) {
        errorMessage = 'S3 bucket not found or inaccessible.';
        statusCode = 404;
      } else if (error.message.includes('region')) {
        errorMessage = 'Invalid AWS region specified.';
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      {
        code: 'LIST_FILES_ERROR',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined,
      },
      { 
        status: statusCode,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Allow-Credentials': 'true',
    }
  });
}



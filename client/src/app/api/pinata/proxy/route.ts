import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Proxy route to serve Pinata IPFS files
 * Uses the public Pinata gateway which works without authentication
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ipfsHash = searchParams.get('hash');

    if (!ipfsHash) {
      return NextResponse.json(
        { error: 'IPFS hash is required' },
        { status: 400 }
      );
    }

    // Use public Pinata gateway (works without authentication)
    const publicGatewayUrl = 'https://gateway.pinata.cloud';
    const pinataUrl = `${publicGatewayUrl}/ipfs/${ipfsHash}`;

    // Fetch from public gateway (no authentication needed)
    const response = await axios.get(pinataUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });

    // Determine content type from response or default to image
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // Return the file with appropriate headers
    return new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Pinata proxy error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'File not found on Pinata' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch file from Pinata',
        status: error.response?.status,
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}

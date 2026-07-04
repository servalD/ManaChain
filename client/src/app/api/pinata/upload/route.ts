import { NextRequest, NextResponse } from 'next/server';
import FormDataNode from 'form-data';
import axios from 'axios';
import { asAxiosError } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    const JWT = process.env.PINATA_JWT;
    
    if (!JWT) {
      return NextResponse.json(
        { error: 'Pinata credentials not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = file.type.startsWith('image/') ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    // Create FormData for Pinata (using form-data package for Node.js)
    const pinataFormData = new FormDataNode();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    pinataFormData.append('file', fileBuffer, file.name);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        type: file.type,
      },
    });
    pinataFormData.append('pinataMetadata', metadata);

    const options = JSON.stringify({ cidVersion: 1 });
    pinataFormData.append('pinataOptions', options);

    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      pinataFormData,
      {
        headers: {
          Authorization: `Bearer ${JWT}`,
          ...pinataFormData.getHeaders(),
        },
        timeout: 30000,
      }
    );

    if (response.data?.IpfsHash) {
      let gatewayUrl = process.env.NEXT_PUBLIC_PINATA_GATEWAY || '';
      
      // Ensure the gateway URL has https:// protocol
      if (gatewayUrl && !gatewayUrl.startsWith('http://') && !gatewayUrl.startsWith('https://')) {
        gatewayUrl = `https://${gatewayUrl}`;
      }
      
      // Remove trailing slash if present
      gatewayUrl = gatewayUrl.replace(/\/$/, '');
      
      const ipfsUrl = `${gatewayUrl}/ipfs/${response.data.IpfsHash}`;
      
      return NextResponse.json({ 
        ipfsHash: response.data.IpfsHash,
        ipfsUrl 
      });
    }

    return NextResponse.json(
      { error: 'Invalid response from Pinata' },
      { status: 500 }
    );
  } catch (error) {
    const axiosErr = asAxiosError(error);
    console.error('Pinata upload error:', error);
    return NextResponse.json(
      { error: axiosErr?.response?.data?.error || axiosErr?.message || 'Upload failed' },
      { status: axiosErr?.response?.status || 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import FormDataNode from 'form-data';
import axios from 'axios';

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
      const gatewayUrl = process.env.PINATA_GATEWAY_URL || process.env.NEXT_PUBLIC_PINATA_GATEWAY || '';
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
  } catch (error: any) {
    console.error('Pinata upload error:', error);
    return NextResponse.json(
      { error: error.response?.data?.error || error.message || 'Upload failed' },
      { status: error.response?.status || 500 }
    );
  }
}

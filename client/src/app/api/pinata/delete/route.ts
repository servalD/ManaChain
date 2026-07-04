import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { asAxiosError } from '@/lib/api-error';

export async function DELETE(request: NextRequest) {
  try {
    const JWT = process.env.PINATA_JWT;
    
    if (!JWT) {
      return NextResponse.json(
        { error: 'Pinata credentials not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ipfsHash = searchParams.get('hash');

    if (!ipfsHash) {
      return NextResponse.json(
        { error: 'IPFS hash is required' },
        { status: 400 }
      );
    }

    // Extract hash from URL if needed
    const cleanHash = ipfsHash.includes('/ipfs/') 
      ? ipfsHash.split('/ipfs/')[1].split('/')[0]
      : ipfsHash;

    await axios.delete(
      `https://api.pinata.cloud/pinning/unpin/${cleanHash}`,
      {
        headers: {
          Authorization: `Bearer ${JWT}`,
        },
        timeout: 10000,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const axiosErr = asAxiosError(error);

    // 404 means already deleted, consider as success
    if (axiosErr?.response?.status === 404) {
      return NextResponse.json({ success: true });
    }

    console.error('Pinata delete error:', error);
    return NextResponse.json(
      { error: axiosErr?.response?.data?.error || axiosErr?.message || 'Delete failed' },
      { status: axiosErr?.response?.status || 500 }
    );
  }
}

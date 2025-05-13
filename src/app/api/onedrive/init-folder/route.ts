import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { getAccessToken } from '@/lib/models/onedrive';
import { getOrCreateFolder } from '@/lib/services/folder';
import dbConnect from '@/lib/utils/dbConnect';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  return handleFolderInit();
}

export async function POST() {
  return handleFolderInit();
}

async function handleFolderInit() {
  await dbConnect();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get fresh access token
    const accessToken = await getAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'OneDrive authentication required' },
        { status: 401 }
      );
    }

    // Create or get existing folder
    const folder = await getOrCreateFolder('SupportTickets', session.user.id);
    
    return NextResponse.json({
      success: true,
      folderId: folder.folderId,
      webUrl: folder.webUrl,
      message: 'Folder initialized successfully'
    });
  } catch (error: unknown) {
    console.error('Full initialization error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Initialization failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.stack : JSON.stringify(error)) : undefined
      },
      { status: 500 }
    );
  }
}
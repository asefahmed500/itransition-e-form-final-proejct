// app/api/onedrive/folders/route.ts
import { getAccessToken } from '@/lib/models/onedrive';
import Folder, { IFolder } from '@/lib/models/Folder';
import dbConnect from '@/lib/utils/dbConnect';
import { NextResponse } from 'next/server';

interface FolderResponse {
  id: string;
  name: string;
  webUrl: string;
  message: string;
}

interface ErrorResponse {
  error: string;
}

// GET /api/onedrive/folders - List all folders from DB
export async function GET(): Promise<NextResponse<IFolder[] | ErrorResponse>> {
  await dbConnect();
  try {
    const folders = await Folder.find().lean<IFolder[]>();
    return NextResponse.json(folders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch folders';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/onedrive/folders - Create new folder and store in DB
export async function POST(request: Request): Promise<NextResponse<FolderResponse | ErrorResponse>> {
  const { folderName, userId } = await request.json();
  
  if (!folderName) {
    return NextResponse.json(
      { error: 'Folder name is required' },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    const accessToken = await getAccessToken(userId);
    
    // Check if folder exists in DB first
    const existingFolder = await Folder.findOne({ name: folderName }).lean<IFolder>();
    if (existingFolder) {
      return NextResponse.json({
        id: existingFolder.folderId,
        name: existingFolder.name,
        webUrl: existingFolder.webUrl,
        message: 'Folder already exists in database'
      });
    }

    // Microsoft Graph API calls
    const folderData = await createFolderInOneDrive(folderName, accessToken);

    // Save folder to database
    const newFolder = await Folder.create({
      folderId: folderData.id,
      name: folderData.name,
      webUrl: folderData.webUrl,
      userId: userId || null
    });

    return NextResponse.json({
      id: newFolder.folderId,
      name: newFolder.name,
      webUrl: newFolder.webUrl,
      message: 'Folder created and stored successfully'
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Folder operation failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

async function createFolderInOneDrive(folderName: string, accessToken: string): Promise<{ id: string; name: string; webUrl: string }> {
  // Check if folder exists in OneDrive
  const getResponse = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(folderName)}:`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (getResponse.ok) {
    return await getResponse.json();
  }

  // Create new folder in OneDrive
  const createResponse = await fetch(
    'https://graph.microsoft.com/v1.0/me/drive/root/children',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      }),
    }
  );

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(error.error?.message || 'Failed to create folder');
  }

  return await createResponse.json();
}
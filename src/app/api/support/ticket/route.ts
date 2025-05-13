// app/api/support/ticket/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getOrCreateFolder } from '@/lib/services/folder';
import { getAccessToken } from '@/lib/models/onedrive';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const ticketData = await request.json();

    // Get or create the support tickets folder
    const folder = await getOrCreateFolder('SupportTickets', session?.user?.id);

    const fullTicketData = {
      ...ticketData,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
    };

    // Upload to the specific folder
    const accessToken = await getAccessToken(session?.user?.id);
    const fileName = `ticket_${Date.now()}.json`;
    
    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drive/items/${folder.folderId}:/${fileName}:/content`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullTicketData, null, 2),
      }
    );

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error?.message || 'OneDrive upload failed');
    }

    return NextResponse.json({ 
      success: true,
      folderId: folder.folderId,
      fileUrl: (await uploadResponse.json()).webUrl
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Failed to create ticket' },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
import Token from '@/lib/models/Token';
import dbConnect from '@/lib/utils/dbConnect';

interface TokenDocument {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  userId?: string;
}

export async function checkTokensExist(userId?: string): Promise<boolean> {
  await dbConnect();
  const tokens = await Token.findOne({ 
    service: 'onedrive',
    ...(userId && { userId }) 
  }).lean();
  return !!tokens;
}

export async function getAccessToken(userId?: string): Promise<string> {
  await dbConnect();
  const tokens = await Token.findOne<TokenDocument>({ 
    service: 'onedrive',
    ...(userId && { userId }) 
  }).lean();

  if (!tokens) {
    throw new Error('OneDrive tokens not initialized. Please authenticate with OneDrive first.');
  }

  // Refresh token if it's about to expire (within 5 minutes)
  if (Date.now() >= new Date(tokens.expiresAt).getTime() - 300000) {
    try {
      await refreshAccessToken(tokens.refreshToken, userId);
      const newTokens = await Token.findOne<TokenDocument>({ 
        service: 'onedrive',
        ...(userId && { userId }) 
      }).lean();
      
      if (!newTokens) {
        throw new Error('Failed to refresh token');
      }
      return newTokens.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  return tokens.accessToken;
}

export async function refreshAccessToken(refreshToken: string, userId?: string): Promise<void> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/onedrive/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        refresh_token: refreshToken,
        ...(userId && { user_id: userId }) 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to refresh token');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

export async function ensureFolderExists(folderName: string, userId?: string): Promise<string> {
  try {
    const accessToken = await getAccessToken(userId);
    
    // Try to get existing folder first
    const getResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(folderName)}:`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (getResponse.ok) {
      const folder = await getResponse.json();
      return folder.id;
    }

    // Create new folder if not exists
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

    const newFolder = await createResponse.json();
    return newFolder.id;
  } catch (error) {
    console.error('Error ensuring folder exists:', error);
    throw error;
  }
}

export async function uploadToOneDrive(data: unknown, userId?: string): Promise<string> {
  try {
    const folderName = 'SupportTickets';
    const folderId = await ensureFolderExists(folderName, userId);
    const accessToken = await getAccessToken(userId);
    const fileName = `ticket_${Date.now()}.json`;
    const fileContent = JSON.stringify(data, null, 2);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${fileName}:/content`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OneDrive upload failed');
    }

    const result = await response.json();
    return result.webUrl;
  } catch (error) {
    console.error('Error uploading to OneDrive:', error);
    throw error;
  }
}
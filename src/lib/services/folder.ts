import Folder from "../models/Folder";
import { checkTokensExist, getAccessToken } from "../models/onedrive";

import dbConnect from "../utils/dbConnect";

export async function getOrCreateFolder(folderName: string, userId?: string) {
  await dbConnect();
  
  try {
    // First check if tokens exist
    const tokensExist = await checkTokensExist(userId);
    if (!tokensExist) {
      throw new Error('OneDrive authentication required. Please connect your OneDrive account first.');
    }

    // Check DB first
    const existingFolder = await Folder.findOne({ 
      name: folderName,
      ...(userId && { userId })
    }).lean();

    if (existingFolder) {
      return existingFolder;
    }

    // Create in OneDrive if not exists
    const accessToken = await getAccessToken(userId);
    
    // First get the user's OneDrive root info to ensure access
    const rootResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/drive/root',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!rootResponse.ok) {
      const rootError = await rootResponse.json();
      throw new Error(rootError.error?.message || 'Failed to access OneDrive root');
    }

    // Try to get existing folder
    const getResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(folderName)}:`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    let folderData;
    if (getResponse.ok) {
      folderData = await getResponse.json();
    } else {
      // Create new folder
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
        console.error('OneDrive API Error:', error);
        throw new Error(error.error?.message || 'Failed to create folder');
      }
      
      folderData = await createResponse.json();
    }

    // Save to database
    const newFolder = await Folder.create({
      folderId: folderData.id,
      name: folderData.name,
      webUrl: folderData.webUrl,
      service: 'onedrive',
      userId: userId || null
    });

    return newFolder;
  } catch (error) {
    console.error('Folder initialization error:', error);
    throw new Error(`Failed to initialize folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } 
}
import { DriveApiResponse, DriveFile } from '@/types/drive-types';

const GOOGLE_DRIVE_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || 'AIzaSyBnHPSdgv2Cc6wU38itY6YLriAb2g1_VQg';
const FOLDER_ID = '1zNc01nfAo3X_m4IaWCjoZHTA_6tHhmbH';

export async function fetchGoogleDriveFiles(): Promise<DriveFile[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name,mimeType,size,webViewLink,webContentLink)`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
    }
    
    const data: DriveApiResponse = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    throw error;
  }
}

export function getFileType(mimeType: string): string {
  if (mimeType.includes('video')) return 'video';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('document') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('spreadsheet')) return 'spreadsheet';
  if (mimeType.includes('presentation')) return 'presentation';
  return 'other';
}

export function formatFileSize(bytes?: string): string {
  if (!bytes) return 'Unknown size';
  const size = parseInt(bytes);
  if (isNaN(size)) return 'Unknown size';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return Math.round(size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function getVideoUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

export function getPDFUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

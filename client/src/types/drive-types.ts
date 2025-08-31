export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface DriveApiResponse {
  files: DriveFile[];
}

export type FileType = 'video' | 'pdf' | 'image' | 'document' | 'spreadsheet' | 'presentation' | 'other';

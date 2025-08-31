import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DriveFile } from '@/types/drive-types';
import { getFileType, formatFileSize } from '@/services/google-drive';
import { 
  PlayCircle, 
  FileText, 
  Image as ImageIcon, 
  File, 
  FileSpreadsheet, 
  Presentation,
  ExternalLink,
  Eye,
  Play,
  ZoomIn
} from 'lucide-react';

interface FileCardProps {
  file: DriveFile;
  onOpenVideo: (file: DriveFile) => void;
  onOpenPDF: (file: DriveFile) => void;
  onOpenImage: (file: DriveFile) => void;
  onWatchFolder: (file: DriveFile) => void;
}

export default function FileCard({ 
  file, 
  onOpenVideo, 
  onOpenPDF, 
  onOpenImage, 
  onWatchFolder 
}: FileCardProps) {
  const fileType = getFileType(file.mimeType);
  const fileSize = formatFileSize(file.size);

  const getFileIcon = () => {
    switch (fileType) {
      case 'video':
        return <PlayCircle className="w-12 h-12 text-primary" />;
      case 'pdf':
        return <FileText className="w-12 h-12 text-red-500" />;
      case 'image':
        return <ImageIcon className="w-12 h-12 text-green-500" />;
      case 'document':
        return <FileText className="w-12 h-12 text-blue-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-12 h-12 text-green-600" />;
      case 'presentation':
        return <Presentation className="w-12 h-12 text-orange-500" />;
      default:
        return <File className="w-12 h-12 text-gray-500" />;
    }
  };

  const getActionButton = () => {
    switch (fileType) {
      case 'video':
        return (
          <Button 
            onClick={() => onOpenVideo(file)}
            className="w-full"
            data-testid={`button-play-video-${file.id}`}
          >
            <Play className="w-4 h-4 mr-2" />
            Play Video
          </Button>
        );
      case 'pdf':
        return (
          <Button 
            onClick={() => onOpenPDF(file)}
            className="w-full"
            data-testid={`button-view-pdf-${file.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            View PDF
          </Button>
        );
      case 'image':
        return (
          <Button 
            onClick={() => onOpenImage(file)}
            className="w-full"
            data-testid={`button-view-image-${file.id}`}
          >
            <ZoomIn className="w-4 h-4 mr-2" />
            View Image
          </Button>
        );
      default:
        return (
          <Button 
            onClick={() => onWatchFolder(file)}
            variant="secondary"
            className="w-full"
            data-testid={`button-watch-folder-${file.id}`}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Watch Folder
          </Button>
        );
    }
  };

  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-6 text-center">
        <div className="mb-4 flex justify-center">
          {getFileIcon()}
        </div>
        <h3 
          className="font-semibold text-foreground mb-2 truncate" 
          title={file.name}
          data-testid={`text-filename-${file.id}`}
        >
          {file.name}
        </h3>
        <p 
          className="text-sm text-muted-foreground mb-4"
          data-testid={`text-filesize-${file.id}`}
        >
          {fileSize}
        </p>
        {getActionButton()}
      </CardContent>
    </Card>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGoogleDriveFiles, getFileType } from '@/services/google-drive';
import { DriveFile } from '@/types/drive-types';
import FileCard from './file-card';
import VideoModal from './video-modal';
import PDFModal from './pdf-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RefreshCw, FolderOpen, AlertTriangle, ArrowUpDown, Search } from 'lucide-react';

type SortField = 'name' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';

export default function FileGrid() {
  const [selectedVideo, setSelectedVideo] = useState<DriveFile | null>(null);
  const [selectedPDF, setSelectedPDF] = useState<DriveFile | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const { 
    data: files = [], 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['/api/google-drive-files'],
    queryFn: fetchGoogleDriveFiles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  const handleOpenVideo = (file: DriveFile) => {
    setSelectedVideo(file);
    setIsVideoModalOpen(true);
  };

  const handleOpenPDF = (file: DriveFile) => {
    setSelectedPDF(file);
    setIsPDFModalOpen(true);
  };

  const handleOpenImage = (file: DriveFile) => {
    // For images, we'll open them in a new tab for now
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  const handleWatchFolder = (file: DriveFile) => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    } else {
      // Fallback to the main folder if webViewLink is not available
      window.open('https://drive.google.com/drive/folders/1zNc01nfAo3X_m4IaWCjoZHTA_6tHhmbH', '_blank');
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const sortFiles = (files: DriveFile[]): DriveFile[] => {
    return [...files].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'name':
          // Enhanced numeric sorting for names with numbers
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          
          // Check if both names contain numbers
          const aMatch = aName.match(/(\d+)/);
          const bMatch = bName.match(/(\d+)/);
          
          if (aMatch && bMatch) {
            // Extract the numeric parts
            const aNum = parseInt(aMatch[0]);
            const bNum = parseInt(bMatch[0]);
            
            // If numbers are different, sort by number
            if (aNum !== bNum) {
              aValue = aNum;
              bValue = bNum;
            } else {
              // If numbers are same, sort alphabetically
              aValue = aName;
              bValue = bName;
            }
          } else {
            // Fallback to alphabetical sorting
            aValue = aName;
            bValue = bName;
          }
          break;
        case 'size':
          aValue = parseInt(a.size || '0');
          bValue = parseInt(b.size || '0');
          break;
        case 'type':
          aValue = getFileType(a.mimeType);
          bValue = getFileType(b.mimeType);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const sortedFiles = sortFiles(filteredFiles);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-primary">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">Loading files from Google Drive...</span>
            </div>
          </div>
        </div>
        
        {/* Loading skeleton grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6 text-center">
                <Skeleton className="w-12 h-12 mx-auto mb-4 rounded" />
                <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-1/2 mx-auto mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20">
        <div className="text-red-500">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Failed to load files</h3>
          <p className="mb-4 text-muted-foreground">
            {error instanceof Error ? error.message : 'There was an error accessing the Google Drive folder.'}
          </p>
          <Button onClick={handleRefresh} data-testid="button-retry">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (sortedFiles.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-muted-foreground">
          <FolderOpen className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No files found</h3>
          <p className="mb-4">The Google Drive folder appears to be empty or inaccessible.</p>
          <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh-empty">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {/* File count, sorting controls and refresh button */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground" data-testid="text-file-count">
          {sortedFiles.length} file{sortedFiles.length !== 1 ? 's' : ''} 
          {searchQuery && ` (filtered from ${files.length})`}
        </span>
        
        <div className="flex items-center gap-2">
          <Select value={sortField} onValueChange={(value: SortField) => setSortField(value)}>
            <SelectTrigger className="w-32" data-testid="select-sort-field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            data-testid="button-toggle-sort-order"
          >
            <ArrowUpDown className="w-4 h-4 mr-1" />
            {sortOrder === 'asc' ? '1-9' : '9-1'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Files grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedFiles.map((file) => (
          <div key={file.id} className="fade-in">
            <FileCard
              file={file}
              onOpenVideo={handleOpenVideo}
              onOpenPDF={handleOpenPDF}
              onOpenImage={handleOpenImage}
              onWatchFolder={handleWatchFolder}
            />
          </div>
        ))}
      </div>

      {/* Modals */}
      <VideoModal
        file={selectedVideo}
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setSelectedVideo(null);
        }}
      />

      <PDFModal
        file={selectedPDF}
        isOpen={isPDFModalOpen}
        onClose={() => {
          setIsPDFModalOpen(false);
          setSelectedPDF(null);
        }}
      />
    </div>
  );
}

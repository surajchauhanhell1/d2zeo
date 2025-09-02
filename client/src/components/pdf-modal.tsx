import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DriveFile } from '@/types/drive-types';
import { getPDFUrl } from '@/services/google-drive';
import { Download, ExternalLink } from 'lucide-react';

interface PDFModalProps {
  file: DriveFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFModal({ file, isOpen, onClose }: PDFModalProps) {
  const [pdfError, setPdfError] = useState(false);

  const handlePDFError = () => {
    setPdfError(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setPdfError(false);
    }
  };

  const handleDownload = () => {
    if (file?.webContentLink) {
      const link = document.createElement('a');
      link.href = file.webContentLink;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePopOut = () => {
    window.open('https://www.youtube.com/@ApnaCollegeOfficial', '_blank');
  };
  if (!file) return null;

  const pdfSrc = getPDFUrl(file.id);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle data-testid="text-pdf-title">{file.name}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePopOut}
              data-testid="button-popout-pdf"
              title="Visit Apna College YouTube Channel"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              data-testid="button-download-pdf"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>
        <div className="h-[85vh]">
          {pdfError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="mb-2">Unable to display PDF</p>
                <p className="text-sm text-muted-foreground mb-4">
                  The PDF viewer encountered an error. You can try downloading the file instead.
                </p>
                <Button onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          ) : (
            <iframe 
              src={pdfSrc}
              className="w-full h-full pdf-viewer border-0"
              onError={handlePDFError}
              data-testid="pdf-viewer"
              title={`PDF viewer for ${file.name}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

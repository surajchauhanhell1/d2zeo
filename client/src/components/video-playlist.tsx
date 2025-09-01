import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DriveFile } from '@/types/drive-types';
import { getVideoUrl, getFileType } from '@/services/google-drive';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Maximize,
  Minimize,
  List,
  X
} from 'lucide-react';

interface VideoPlaylistProps {
  files: DriveFile[];
  initialVideoId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoPlaylist({ files, initialVideoId, isOpen, onClose }: VideoPlaylistProps) {
  const videoFiles = files; // Files are already filtered in the parent component
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Find initial video index
  useEffect(() => {
    if (initialVideoId) {
      const index = videoFiles.findIndex(file => file.id === initialVideoId);
      if (index !== -1) {
        setCurrentVideoIndex(index);
      }
    }
  }, [initialVideoId, videoFiles]);

  const currentVideo = videoFiles[currentVideoIndex];

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    setVideoError(false);
  };

  const playNext = () => {
    if (currentVideoIndex < videoFiles.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
      setVideoError(false);
    }
  };

  const playPrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
      setVideoError(false);
    }
  };

  const selectVideo = (index: number) => {
    setCurrentVideoIndex(index);
    setVideoError(false);
  };

  const togglePlay = () => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = document.querySelector('.video-container') as HTMLElement;
    if (videoContainer) {
      if (!isFullscreen) {
        videoContainer.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setIsPlaying(false);
      setVideoError(false);
    }
  };

  if (!currentVideo || videoFiles.length === 0) return null;

  const videoSrc = getVideoUrl(currentVideo.id);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="flex-1" data-testid="text-playlist-title">
            {currentVideo.name} ({currentVideoIndex + 1} of {videoFiles.length})
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPlaylist(!showPlaylist)}
              data-testid="button-toggle-playlist"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex h-[85vh]">
          {/* Video Player */}
          <div className={`flex-1 flex flex-col ${showPlaylist ? 'pr-4' : ''}`}>
            <div className="flex-1 p-4">
              <div className="video-container relative bg-black rounded-lg overflow-hidden h-full">
                {videoError ? (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <p className="mb-2">Unable to play video</p>
                      <p className="text-sm text-gray-300 mb-4">
                        The video format may not be supported or there was an error loading the file.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={playPrevious} disabled={currentVideoIndex === 0}>
                          <SkipBack className="w-4 h-4 mr-2" />
                          Previous
                        </Button>
                        <Button onClick={playNext} disabled={currentVideoIndex === videoFiles.length - 1}>
                          Next
                          <SkipForward className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <video 
                    controls 
                    className="w-full h-full object-contain"
                    onError={handleVideoError}
                    onLoadStart={handleVideoLoad}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    data-testid="playlist-video-player"
                    key={currentVideo.id}
                    autoPlay
                  >
                    <source src={videoSrc} type="video/mp4" />
                    <source src={videoSrc} type="video/webm" />
                    <source src={videoSrc} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                )}
                
                {/* Custom Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={playPrevious}
                      disabled={currentVideoIndex === 0}
                      className="text-white hover:bg-white/20"
                      data-testid="button-previous-video"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlay}
                      className="text-white hover:bg-white/20"
                      data-testid="button-toggle-play"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={playNext}
                      disabled={currentVideoIndex === videoFiles.length - 1}
                      className="text-white hover:bg-white/20"
                      data-testid="button-next-video"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                      data-testid="button-toggle-mute"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20"
                      data-testid="button-toggle-fullscreen"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Playlist Sidebar */}
          {showPlaylist && (
            <div className="w-80 border-l bg-muted/30">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Playlist</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPlaylist(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {videoFiles.length} video{videoFiles.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <ScrollArea className="h-[calc(85vh-120px)]">
                <div className="p-2 space-y-2">
                  {videoFiles.map((video, index) => (
                    <Card 
                      key={video.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        index === currentVideoIndex 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => selectVideo(index)}
                      data-testid={`playlist-item-${index}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate" title={video.name}>
                              {video.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Video • {video.size ? `${Math.round(parseInt(video.size) / (1024 * 1024))}MB` : 'Unknown size'}
                            </p>
                          </div>
                          {index === currentVideoIndex && (
                            <div className="flex-shrink-0">
                              {isPlaying ? (
                                <Pause className="w-4 h-4 text-primary" />
                              ) : (
                                <Play className="w-4 h-4 text-primary" />
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
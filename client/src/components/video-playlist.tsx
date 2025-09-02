import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DriveFile } from '@/types/drive-types';
import { getVideoUrl, getVideoUrlAlternative, getVideoUrlEmbed, getFileType } from '@/services/google-drive';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  RotateCcw,
  RotateCw,
  List,
  X,
  RefreshCw,
  ExternalLink
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
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [urlAttempt, setUrlAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const currentVideo = videoFiles[currentVideoIndex];

  // Find initial video index
  useEffect(() => {
    if (initialVideoId) {
      const index = videoFiles.findIndex(file => file.id === initialVideoId);
      if (index !== -1) {
        setCurrentVideoIndex(index);
      }
    }
  }, [initialVideoId, videoFiles]);

  // Update video URL when current video changes
  useEffect(() => {
    if (currentVideo) {
      // Start with the highest quality preview URL
      setCurrentVideoUrl(`https://drive.google.com/file/d/${currentVideo.id}/preview?quality=hd1080`);
      setUrlAttempt(0);
      setVideoError(false);
    }
  }, [currentVideo]);

  const handleVideoError = async () => {
    console.log(`Video error on attempt ${urlAttempt + 1} for video:`, currentVideo?.name);
    
    if (urlAttempt === 0) {
      // Try high quality embed URL
      console.log('Trying high quality embed URL...');
      setCurrentVideoUrl(`https://drive.google.com/file/d/${currentVideo.id}/preview?quality=hd720`);
      setUrlAttempt(1);
    } else if (urlAttempt === 1) {
      // Try standard quality embed URL
      console.log('Trying standard quality embed URL...');
      setCurrentVideoUrl(`https://drive.google.com/file/d/${currentVideo.id}/preview`);
      setUrlAttempt(2);
    } else if (urlAttempt === 2) {
      // Try direct view URL as final fallback
      console.log('Trying direct view URL...');
      setCurrentVideoUrl(getVideoUrlEmbed(currentVideo.id));
      setUrlAttempt(3);
    } else {
      // All attempts failed
      console.log('All video URL attempts failed');
      setVideoError(true);
    }
  };

  const handleVideoLoad = () => {
    setVideoError(false);
    setIsRetrying(false);
    console.log('Video loaded successfully');
  };

  const retryVideo = () => {
    setIsRetrying(true);
    setVideoError(false);
    setUrlAttempt(0);
    // Start with the highest quality URL again
    setCurrentVideoUrl(`https://drive.google.com/file/d/${currentVideo.id}/preview?quality=hd1080`);
  };

  const playNext = () => {
    if (currentVideoIndex < videoFiles.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const playPrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const selectVideo = (index: number) => {
    setCurrentVideoIndex(index);
  };

  const togglePlay = () => {
    const video = document.querySelector('[data-testid="playlist-video-player"]') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
      } else {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.log('Play was prevented:', error);
              setIsPlaying(false);
            });
        }
      }
    } else {
      // If video element not found, might be using iframe
      console.log('Video element not found, might be using iframe player');
    }
  };

  const toggleMute = () => {
    const video = document.querySelector('[data-testid="playlist-video-player"]') as HTMLVideoElement;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipForward = () => {
    const video = document.querySelector('[data-testid="playlist-video-player"]') as HTMLVideoElement;
    if (video) {
      video.currentTime = Math.min(video.currentTime + 10, video.duration || 0);
    }
  };

  const skipBackward = () => {
    const video = document.querySelector('[data-testid="playlist-video-player"]') as HTMLVideoElement;
    if (video) {
      video.currentTime = Math.max(video.currentTime - 10, 0);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setIsPlaying(false);
      setVideoError(false);
    }
  };

  const handlePopOut = () => {
    window.open('https://www.youtube.com/@ApnaCollegeOfficial', '_blank');
  };
  if (!currentVideo || videoFiles.length === 0) return null;

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
              onClick={handlePopOut}
              data-testid="button-popout"
              title="Visit Apna College YouTube Channel"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
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
                      <p className="mb-2 text-lg font-semibold">Unable to play video</p>
                      <p className="text-sm text-gray-300 mb-4">
                        This video cannot be streamed directly. This may be due to:<br/>
                        • Large file size requiring download<br/>
                        • Restricted sharing permissions<br/>
                        • Unsupported video format<br/><br/>
                        Try opening in Google Drive or skip to another video.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={retryVideo} variant="outline">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Retry
                        </Button>
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
                ) : isRetrying ? (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                      <p className="text-lg">Loading video...</p>
                      <p className="text-sm text-gray-300">
                        Trying different streaming method...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full">
                    {urlAttempt < 2 ? (
                      <video 
                        controls 
                        className="w-full h-full object-contain"
                        onError={handleVideoError}
                        onLoadedData={handleVideoLoad}
                        onCanPlay={handleVideoLoad}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => {
                          setIsPlaying(false);
                          if (currentVideoIndex < videoFiles.length - 1) {
                            setTimeout(() => playNext(), 1000);
                          }
                        }}
                        data-testid="playlist-video-player"
                        key={`${currentVideo.id}-${urlAttempt}`}
                        autoPlay={false}
                        preload="metadata"
                      >
                        <source src={currentVideoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <iframe
                        src={currentVideoUrl}
                        className="w-full h-full border-0"
                        onError={handleVideoError}
                        onLoad={handleVideoLoad}
                        data-testid="playlist-video-iframe"
                        key={`${currentVideo.id}-iframe`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                       sandbox="allow-scripts allow-same-origin allow-presentation"
                      />
                    )}
                    
                    {/* Overlay to intercept pop-out clicks on iframe */}
                    {urlAttempt >= 2 && (
                      <div 
                        className="absolute top-2 right-2 w-10 h-10 cursor-pointer z-30"
                        onClick={handlePopOut}
                        title="Visit Apna College YouTube Channel"
                        data-testid="iframe-popout-overlay"
                      />
                    )}
                  </div>
                )}
                
                {/* Custom Video Controls */}
                {!videoError && urlAttempt < 2 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
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
                        data-testid="button-play-pause"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                        data-testid="button-mute"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
                  </div>
                )}
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
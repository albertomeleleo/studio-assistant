import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Play, Square, Volume2, VolumeX, MessageSquare } from 'lucide-react';
import VideoFeed from './VideoFeed';
import ChatPanel from './ChatPanel';
import TopicList from './TopicList';
import { useLiveApi } from '../services/useLiveApi';
import { StreamState } from '../types';

const StudioController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [aiVolume, setAiVolume] = useState(1.0); // 0 to 1
  const [isAiMuted, setIsAiMuted] = useState(false);

  const { 
    connect, 
    disconnect, 
    state: streamState, 
    messages,
    currentTopics,
    sendVideoFrame,
    updateAiVolume,
    sendTextMessage
  } = useLiveApi();

  // Update AI volume when slider/mute changes
  useEffect(() => {
    updateAiVolume(isAiMuted ? 0 : aiVolume);
  }, [aiVolume, isAiMuted, updateAiVolume]);

  // Video Frame Loop
  useEffect(() => {
    let intervalId: number;
    
    if (streamState === StreamState.ACTIVE && isCamOn) {
      intervalId = window.setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Ensure video is ready and has dimensions before attempting to draw
        if (video && canvas && video.readyState >= 2 && video.videoWidth > 0) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Check if canvas size matches downscaled video to avoid thrashing
            const targetWidth = video.videoWidth * 0.5;
            const targetHeight = video.videoHeight * 0.5;

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                canvas.width = targetWidth;
                canvas.height = targetHeight;
            }
            
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
            sendVideoFrame(base64);
          }
        }
      }, 1000); // Send frame every 1 second
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [streamState, isCamOn, sendVideoFrame]);

  const handleToggleConnect = () => {
    if (streamState === StreamState.ACTIVE || streamState === StreamState.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(100vh-120px)]">
      {/* Left Column: Video Feed & Controls */}
      <div className="flex-1 flex flex-col gap-4 min-h-[400px]">
        <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group min-h-0">
          <VideoFeed 
            videoRef={videoRef} 
            isCamOn={isCamOn} 
          />
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border flex items-center gap-2 ${
              streamState === StreamState.ACTIVE 
                ? 'bg-red-500/20 border-red-500/50 text-red-200' 
                : 'bg-slate-800/50 border-slate-700 text-slate-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                streamState === StreamState.ACTIVE ? 'bg-red-500 animate-pulse' : 'bg-slate-500'
              }`}></span>
              {streamState === StreamState.ACTIVE ? 'ON AIR' : 'OFFLINE'}
            </div>
          </div>
          
          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Control Bar */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-3 rounded-full transition-colors ${isMicOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
              title={isMicOn ? "Mute Mic" : "Unmute Mic"}
            >
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button 
              onClick={() => setIsCamOn(!isCamOn)}
              className={`p-3 rounded-full transition-colors ${isCamOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
              title={isCamOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            <button 
              onClick={() => setIsAiMuted(!isAiMuted)}
              className={`p-3 rounded-full transition-colors ${!isAiMuted ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30'}`}
              title={isAiMuted ? "Unmute Assistant" : "Mute Assistant"}
            >
              {isAiMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-3 border-l border-r border-slate-800 px-4 mx-2 hidden sm:flex">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">AI Vol</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1"
              value={aiVolume}
              onChange={(e) => setAiVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              disabled={isAiMuted}
            />
          </div>

          <button
            onClick={handleToggleConnect}
            disabled={streamState === StreamState.CONNECTING}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              streamState === StreamState.ACTIVE 
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20' 
                : streamState === StreamState.CONNECTING
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            {streamState === StreamState.ACTIVE ? (
              <>
                <Square size={18} fill="currentColor" />
                Stop Co-Host
              </>
            ) : streamState === StreamState.CONNECTING ? (
              "Connecting..."
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                Start Co-Host
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column: AI Tools */}
      <div className="w-full lg:w-96 flex flex-col gap-4 shrink-0">
        <TopicList 
          topics={currentTopics} 
          isActive={streamState === StreamState.ACTIVE} 
        />
        
        <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden flex flex-col min-h-[300px]">
           <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-400" />
              <span className="font-medium text-sm text-slate-200">Co-Host Chat</span>
           </div>
           <div className="flex-1 relative">
              <ChatPanel 
                messages={messages} 
                onSendMessage={sendTextMessage}
                isLive={streamState === StreamState.ACTIVE}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudioController;
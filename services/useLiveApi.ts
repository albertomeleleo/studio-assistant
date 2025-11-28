import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { StreamState, ChatMessage } from '../types';

// Helper functions for audio encoding/decoding
const floatTo16BitPCM = (float32Array: Float32Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Tool definition for updating topics
const updateTopicsDeclaration: FunctionDeclaration = {
  name: 'updateTopics',
  description: 'Update the list of topics currently being discussed in the live stream.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      topics: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'A list of 3-5 short topic keywords or phrases.',
      },
    },
    required: ['topics'],
  },
};

export const useLiveApi = () => {
  const [state, setState] = useState<StreamState>(StreamState.IDLE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTopics, setCurrentTopics] = useState<string[]>([]);
  const [currentVolume, setCurrentVolume] = useState(1.0);

  // Refs for persistent objects
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const gainNodeRef = useRef<GainNode | null>(null);

  const updateAiVolume = useCallback((vol: number) => {
    setCurrentVolume(vol);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = vol;
    }
  }, []);

  const connect = useCallback(async () => {
    if (state === StreamState.ACTIVE || state === StreamState.CONNECTING) return;
    setState(StreamState.CONNECTING);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      inputAudioContextRef.current = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = currentVolume;
      gainNodeRef.current.connect(audioContextRef.current.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        systemInstruction: `You are an expert live stream co-host. 
        1. LISTEN to the host and WATCH the video.
        2. Engage in the conversation naturally. Be witty, helpful, and concise.
        3. IMPORTANT: You have a tool 'updateTopics'. Use it frequently to update the list of topics based on what is being discussed right now. 
        4. If the host asks for help, provide suggestions or facts.
        5. Keep your audio responses short (under 15 seconds) to keep the flow dynamic.`,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            tools: [{ functionDeclarations: [updateTopicsDeclaration] }],
        }
      };

      const sessionPromise = ai.live.connect({
        model: config.model,
        config: {
          ...config.config,
          systemInstruction: config.systemInstruction,
        },
        callbacks: {
          onopen: () => {
            setState(StreamState.ACTIVE);
            setMessages([]); // Clear chat on new session
            
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            inputSourceRef.current = source;
            
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = floatTo16BitPCM(inputData);
              const base64 = arrayBufferToBase64(pcm16);
              
              if (sessionPromiseRef.current) {
                  sessionPromiseRef.current.then(session => {
                      session.sendRealtimeInput({
                          media: {
                              mimeType: 'audio/pcm;rate=16000',
                              data: base64
                          }
                      });
                  });
              }
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
             // 1. Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && audioContextRef.current && gainNodeRef.current) {
                 const ctx = audioContextRef.current;
                 const rawBytes = base64ToUint8Array(audioData);
                 const dataInt16 = new Int16Array(rawBytes.buffer);
                 const audioBuffer = ctx.createBuffer(1, dataInt16.length, 24000);
                 const channelData = audioBuffer.getChannelData(0);
                 for(let i=0; i<dataInt16.length; i++) {
                     channelData[i] = dataInt16[i] / 32768.0;
                 }
                 
                 const source = ctx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(gainNodeRef.current);
                 
                 const now = ctx.currentTime;
                 if (nextStartTimeRef.current < now) {
                     nextStartTimeRef.current = now;
                 }
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
             }

             // 2. Handle Transcriptions (Chat)
             // Handle User Input Transcription
             const inputText = msg.serverContent?.inputTranscription?.text;
             if (inputText) {
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.sender === 'user') {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                            ...lastMsg,
                            text: lastMsg.text + inputText
                        };
                        return newMessages;
                    }
                    return [...prev, {
                        id: crypto.randomUUID(),
                        text: inputText,
                        sender: 'user',
                        timestamp: Date.now(),
                        isFinal: false
                    }];
                });
             }

             // Handle AI Output Transcription
             const outputText = msg.serverContent?.outputTranscription?.text;
             if (outputText) {
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.sender === 'ai') {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                            ...lastMsg,
                            text: lastMsg.text + outputText
                        };
                        return newMessages;
                    }
                    return [...prev, {
                        id: crypto.randomUUID(),
                        text: outputText,
                        sender: 'ai',
                        timestamp: Date.now(),
                        isFinal: false
                    }];
                });
             }

             // 3. Handle Tool Calls (Topic Updates)
             if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                    if (fc.name === 'updateTopics') {
                        const args = fc.args as any;
                        if (args.topics && Array.isArray(args.topics)) {
                            setCurrentTopics(args.topics);
                        }
                        // Send response back
                        sessionPromiseRef.current?.then(session => {
                           session.sendToolResponse({
                               functionResponses: [{
                                   id: fc.id,
                                   name: fc.name,
                                   response: { result: 'Topics updated on UI' }
                               }]
                           });
                        });
                    }
                }
             }
          },
          onclose: () => {
             setState(StreamState.IDLE);
             cleanup();
          },
          onerror: (err) => {
             console.error("Live API Error:", err);
             setState(StreamState.ERROR);
             cleanup();
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      setState(StreamState.ERROR);
    }
  }, [state, currentVolume]);

  const disconnect = useCallback(() => {
    if (sessionPromiseRef.current) {
       sessionPromiseRef.current.then(s => s.close());
    }
    cleanup();
    setState(StreamState.IDLE);
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (state === StreamState.ACTIVE && sessionPromiseRef.current) {
        // Optimistically update UI
        setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            text: text,
            sender: 'user',
            timestamp: Date.now(),
            isFinal: true
        }]);

        sessionPromiseRef.current.then(session => {
            session.send({
                clientContent: {
                    turns: [{
                        role: 'user',
                        parts: [{ text }]
                    }],
                    turnComplete: true
                }
            });
        });
    }
  }, [state]);

  const cleanup = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    sessionPromiseRef.current = null;
  };

  const sendVideoFrame = useCallback((base64Image: string) => {
     if (state === StreamState.ACTIVE && sessionPromiseRef.current) {
         sessionPromiseRef.current.then(session => {
             session.sendRealtimeInput({
                 media: {
                     mimeType: 'image/jpeg',
                     data: base64Image
                 }
             });
         });
     }
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
      return () => cleanup();
  }, []);

  return {
    connect,
    disconnect,
    state,
    messages,
    currentTopics,
    sendVideoFrame,
    updateAiVolume,
    sendTextMessage
  };
};
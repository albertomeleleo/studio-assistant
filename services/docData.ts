export interface DocFile {
  name: string;
  type: 'file' | 'folder';
  content?: string; // Markdown content
  children?: DocFile[];
  isOpen?: boolean;
}

export const documentationData: DocFile[] = [
  {
    name: 'doc',
    type: 'folder',
    isOpen: true,
    children: [
      {
        name: 'architecture',
        type: 'folder',
        isOpen: true,
        children: [
          {
            name: 'OVERVIEW.md',
            type: 'file',
            content: `# Architecture Overview

## System Context
The Live Studio Assistant is a React-based Single Page Application (SPA) that interfaces directly with the Google Gemini Multimodal Live API via WebSockets.

## High-Level Diagram

\`\`\`mermaid
graph TD
    User[Host / User] -->|Video & Audio| App[React Application]
    App -->|Audio Stream PCM| Gemini[Google Gemini API]
    App -->|Video Frames JPEG| Gemini
    Gemini -->|Audio Response| App
    Gemini -->|Transcriptions| App
    Gemini -->|Tool Calls| App
    App -->|Visual Feedback| User
    
    subgraph Client Side
        App
        Hook[useLiveApi Hook]
        UI[StudioController UI]
    end
\`\`\`

## Key Components
1. **StudioController**: The main orchestrator. Manages layout and high-level state.
2. **useLiveApi**: A custom hook managing the WebSocket connection, audio buffering, and message parsing.
3. **VideoFeed**: Handles Camera access and canvas rendering for frame extraction.
4. **ChatPanel**: Displays the conversation history (User & AI).
`
          }
        ]
      },
      {
        name: 'live-api',
        type: 'folder',
        isOpen: false,
        children: [
          {
            name: 'README.md',
            type: 'file',
            content: `# Live API Service (useLiveApi)

## Description
The core logic of the application resides in \`services/useLiveApi.ts\`. This hook manages the full lifecycle of the connection to the Google GenAI Live API.

## Capability Map

\`\`\`mermaid
mindmap
  root((useLiveApi))
    Connection Management
        Connect
        Disconnect
        Error Handling
    Media Processing
        Audio Input (Mic)
        Audio Output (Speaker)
        Video Frame Sending
    Intelligence
        Context Management
        Tool Execution
    State
        Connection State
        Messages List
        Topics List
\`\`\`

## Flowchart: Connection & Audio Loop

\`\`\`mermaid
flowchart TD
    Start([User Clicks Start]) --> Init[Init AudioContext]
    Init --> Mic[Get User Media Stream]
    Mic --> Connect[ai.live.connect]
    
    Connect -->|Success| ActiveState[State: ACTIVE]
    Connect -->|Error| ErrorState[State: ERROR]
    
    subgraph AudioLoop [Audio Processing Loop]
        mic_input[Mic Input] -->|PCM 16k| Processor[ScriptProcessor]
        Processor -->|Base64| Send[session.sendRealtimeInput]
    end
    
    ActiveState --> AudioLoop
    
    subgraph ReceiveLoop [Receiving Data]
        Socket[WebSocket Message] --> Check{Type?}
        Check -->|Audio| Play[Decode & Play Audio]
        Check -->|Transcription| UpdateChat[Update Messages State]
        Check -->|ToolCall| ExecTool[Execute Function]
    end
    
    Send --> Socket
\`\`\`
`
          },
          {
            name: 'SEQUENCE.md',
            type: 'file',
            content: `# Sequence Diagram: Interaction Loop

This diagram illustrates the flow of data when the user speaks and the AI responds.

\`\`\`mermaid
sequenceDiagram
    actor Host
    participant UI as StudioController
    participant Hook as useLiveApi
    participant Audio as AudioContext
    participant API as Gemini Live API

    Host->>UI: Speaks
    UI->>Audio: Capture Mic Stream
    Audio->>Hook: Raw PCM Data
    Hook->>API: sendRealtimeInput(Audio)
    
    Note over API: Model Thinking...
    
    API->>Hook: ServerMessage (Audio)
    Hook->>Audio: Decode & Queue Buffer
    Audio->>Host: Plays AI Voice
    
    API->>Hook: ServerMessage (Transcription)
    Hook->>UI: Update Messages State
    UI->>Host: Show Text in ChatPanel
\`\`\`
`
          }
        ]
      },
      {
        name: 'topics-feature',
        type: 'folder',
        isOpen: false,
        children: [
          {
            name: 'README.md',
            type: 'file',
            content: `# Topic Extraction Feature

## Purpose
To provide the host with a real-time summary of the current conversation context. The AI autonomously decides when to update this list using Function Calling.

## Logic
The model is provided with a tool definition \`updateTopics\`. It observes the conversation and, when the subject shifts, it sends a structured tool call containing the new topics.

## Flowchart: Tool Execution

\`\`\`mermaid
flowchart LR
    Model[Gemini Model] -->|Decides to update| ToolCall[ToolCall: updateTopics]
    ToolCall -->|JSON Args| Hook[useLiveApi]
    Hook -->|Extract Topics| State[setCurrentTopics]
    State -->|Re-render| UI[TopicList Component]
    Hook -->|Success Response| Model
\`\`\`

## Data Structure
The tool expects the following schema:
\`\`\`json
{
  "name": "updateTopics",
  "parameters": {
    "topics": ["Array of Strings"]
  }
}
\`\`\`
`
          }
        ]
      }
    ]
  }
];

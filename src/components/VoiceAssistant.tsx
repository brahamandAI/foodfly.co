'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageCircle, 
  X, 
  Loader2, 
  Heart, 
  AlertTriangle,
  ShoppingCart,
  Send,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// RecordRTC types (since we're adding it as dependency)
declare global {
  interface Window {
    RecordRTC: any;
  }
}

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderAction?: (action: any) => void;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  healthRecommendations?: any;
  actions?: any[];
}

interface HealthRecommendation {
  name: string;
  calories: number;
  healthScore: number;
  dietaryTags: string[];
  nutritionalInfo: any;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  isOpen, 
  onClose, 
  onOrderAction 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [healthRecommendations, setHealthRecommendations] = useState<HealthRecommendation[]>([]);
  const [sessionId] = useState(() => `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const mediaRecorderRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Load user's health profile
  useEffect(() => {
    if (isOpen) {
      loadHealthProfile();
      // Add welcome message
      setConversation([{
        role: 'assistant',
        content: "Hello! I'm your AI food assistant. I can help you order food based on your health preferences. Try saying 'I want something healthy' or 'Show me low-calorie options'!",
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);

  const loadHealthProfile = async () => {
    try {
      const response = await fetch('/api/health/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setHealthProfile(result.data);
      }
    } catch (error) {
      console.error('Error loading health profile:', error);
    }
  };

  // Initialize audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      streamRef.current = stream;

      // Use MediaRecorder API for browser compatibility
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const audioChunks: BlobPart[] = [];

      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processVoiceCommand(audioBlob);
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      toast.success('🎤 Listening... Speak your order!');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processVoiceCommand = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-command.webm');
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/voice/voice-to-order', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process voice command');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        const { 
          transcription, 
          response: aiResponse, 
          actions, 
          hasAudio, 
          healthRecommendations: newHealthRecs 
        } = result.data;

        // Add user message to conversation
        setConversation(prev => [...prev, {
          role: 'user',
          content: transcription,
          timestamp: new Date(),
        }]);

        // Add AI response to conversation
        setTimeout(() => {
          setConversation(prev => [...prev, {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date(),
            healthRecommendations: newHealthRecs,
            actions,
          }]);
        }, 500);

        // Update health recommendations
        if (newHealthRecs) {
          setHealthRecommendations(newHealthRecs.recommended || []);
        }

        // Handle actions
        if (actions && actions.length > 0) {
          actions.forEach((action: any) => {
            handleAction(action);
          });
        }

        // Play audio response if available
        if (hasAudio) {
          await playAudioResponse();
        }

        toast.success('Command processed successfully!');
      } else {
        throw new Error(result.message || 'Failed to process command');
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      toast.error(`Sorry, I couldn't understand that. ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextInput = async () => {
    if (!textInput.trim()) return;

    try {
      setIsProcessing(true);
      
      // Add user message immediately
      const userMessage = {
        role: 'user' as const,
        content: textInput,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, userMessage]);
      const currentInput = textInput;
      setTextInput('');

      // Handle common static commands first
      const lowerInput = currentInput.toLowerCase();
      if (lowerInput.includes('show me my cart') || lowerInput.includes('cart')) {
        const cartItems = JSON.parse(localStorage.getItem('testCart') || '{}');
        const cartCount = Object.values(cartItems).reduce((sum: number, qty: any) => sum + Number(qty), 0);
        
        setTimeout(() => {
          setConversation(prev => [...prev, {
            role: 'assistant',
            content: Number(cartCount) > 0 
              ? `You have ${cartCount} items in your cart. Would you like to proceed to checkout or continue shopping?`
              : 'Your cart is currently empty. Would you like me to recommend some delicious dishes?',
            timestamp: new Date(),
          }]);
        }, 500);
        return;
      }

      if (lowerInput.includes('recommend') || lowerInput.includes('suggestion')) {
        setTimeout(() => {
          setConversation(prev => [...prev, {
            role: 'assistant',
            content: 'Based on your preferences, I recommend trying our Butter Chicken with Garlic Naan, or if you prefer vegetarian, our Paneer Butter Masala is excellent! Would you like me to add any of these to your cart?',
            timestamp: new Date(),
          }]);
        }, 500);
        return;
      }

      if (lowerInput.includes('order') && (lowerInput.includes('butter chicken') || lowerInput.includes('chicken'))) {
        setTimeout(() => {
          setConversation(prev => [...prev, {
            role: 'assistant',
            content: 'Great choice! I can add Butter Chicken to your cart for ₹349. It comes with rice and is highly rated. Would you like to add it?',
            timestamp: new Date(),
          }]);
        }, 500);
        return;
      }

      // Try API call for more complex processing
      const response = await fetch('/api/voice/process-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: currentInput,
          sessionId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        setTimeout(() => {
          setConversation(prev => [...prev, {
            role: 'assistant',
            content: result.data?.response || 'I understand. How can I help you with your order?',
            timestamp: new Date(),
            healthRecommendations: result.data?.healthRecommendations,
            actions: result.data?.actions,
          }]);
        }, 500);

        // Handle actions if any
        if (result.data?.actions && result.data.actions.length > 0) {
          result.data.actions.forEach((action: any) => handleAction(action));
        }
      } else {
        // Fallback response for API errors
        setTimeout(() => {
          setConversation(prev => [...prev, {
            role: 'assistant',
            content: 'I\'m here to help you order food! You can ask me to recommend dishes, show your cart, or help you place an order. What would you like to do?',
            timestamp: new Date(),
          }]);
        }, 500);
      }
    } catch (error) {
      console.error('Error with text input:', error);
      // Fallback response for any errors
      setTimeout(() => {
        setConversation(prev => [...prev, {
          role: 'assistant',
          content: 'I\'m having trouble processing that right now, but I\'m here to help! You can ask me about our menu, recommendations, or check your cart. What would you like to know?',
          timestamp: new Date(),
        }]);
      }, 500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'update_cart':
      case 'show_restaurants':
      case 'show_menu_items':
      case 'show_health_recommendations':
      case 'order_placed':
        if (onOrderAction) {
          onOrderAction(action);
        }
        break;
      default:
        console.log('Unhandled action:', action);
    }
  };

  const playAudioResponse = async () => {
    try {
      setIsPlayingAudio(true);
      
      const response = await fetch(`/api/voice/response-audio/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.onended = () => {
            setIsPlayingAudio(false);
            URL.revokeObjectURL(audioUrl);
          };
          await audioRef.current.play();
        }
      }
    } catch (error) {
      console.error('Error playing audio response:', error);
      setIsPlayingAudio(false);
    }
  };

  const clearConversation = async () => {
    try {
      await fetch(`/api/voice/conversation/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      setConversation([{
        role: 'assistant',
        content: "Let's start fresh! How can I help you order something delicious and healthy today?",
        timestamp: new Date(),
      }]);
      setHealthRecommendations([]);
      toast.success('Conversation cleared!');
    } catch (error) {
      console.error('Error clearing conversation:', error);
      toast.error('Failed to clear conversation');
    }
  };

  const handleQuickCommand = async (command: string) => {
    try {
      setIsProcessing(true);
      
      // Add user message
      setConversation(prev => [...prev, {
        role: 'user',
        content: command,
        timestamp: new Date(),
      }]);

      // Handle commands locally for better reliability
      let response = '';
      
      if (command.toLowerCase().includes('cart')) {
        const cartItems = JSON.parse(localStorage.getItem('testCart') || '{}');
        const cartCount = Object.values(cartItems).reduce((sum: number, qty: any) => sum + Number(qty), 0);
        response = Number(cartCount) > 0 
          ? `You have ${cartCount} items in your cart. Would you like to proceed to checkout?`
          : 'Your cart is currently empty. Let me recommend some popular dishes!';
      } else if (command.toLowerCase().includes('recommend')) {
        response = 'I recommend our popular Butter Chicken (₹349), Paneer Butter Masala (₹299), or Chicken Fried Rice (₹249). All are highly rated by customers!';
      } else if (command.toLowerCase().includes('order')) {
        response = 'I can help you place an order! What type of cuisine are you in the mood for today? We have North Indian, Chinese, Italian, and more options available.';
      } else {
        response = 'I can help you with ordering food, checking your cart, or getting recommendations. What would you like to do?';
      }

      // Add AI response with delay for natural feel
      setTimeout(() => {
        setConversation(prev => [...prev, {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        }]);
      }, 300);

    } catch (error) {
      console.error('Error with quick command:', error);
      setTimeout(() => {
        setConversation(prev => [...prev, {
          role: 'assistant',
          content: 'I\'m here to help! You can ask me about our menu, check your cart, or get recommendations. What would you like to know?',
          timestamp: new Date(),
        }]);
      }, 300);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Voice Assistant Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 bg-gray-900 rounded-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Food Assistant</h3>
              <p className="text-sm text-gray-400">
                {healthProfile ? 'Health-aware ordering' : 'Voice & text ordering'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Health Profile Status */}
        {healthProfile && (
          <div className="p-4 bg-green-900/20 border-b border-gray-700">
            <div className="flex items-center gap-2 text-green-400">
              <Heart className="w-4 h-4" />
              <span className="text-sm">
                Health Profile Active - Personalized recommendations enabled
              </span>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
                
                {/* Health Recommendations */}
                {message.healthRecommendations && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1 text-green-400">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-xs font-medium">Health Recommendations</span>
                    </div>
                    {message.healthRecommendations.recommended?.slice(0, 2).map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-800 p-2 rounded text-xs">
                        <div className="font-medium text-green-400">{item.name}</div>
                        <div className="text-gray-400">{item.calories} cal • Health Score: {item.healthScore}/10</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-gray-100">Processing...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Quick Commands */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleQuickCommand("Show me healthy options")}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-full transition-colors"
              disabled={isProcessing}
            >
              Healthy Options
            </button>
            <button
              onClick={() => handleQuickCommand("I want low-calorie food")}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-full transition-colors"
              disabled={isProcessing}
            >
              Low Calorie
            </button>
            <button
              onClick={() => handleQuickCommand("Show my cart")}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-full transition-colors"
              disabled={isProcessing}
            >
              <ShoppingCart className="w-3 h-3 inline mr-1" />
              Cart
            </button>
            <button
              onClick={() => handleQuickCommand("Recommend something based on my health profile")}
              className="px-3 py-1 bg-pink-600 hover:bg-pink-700 text-white text-xs rounded-full transition-colors"
              disabled={isProcessing}
            >
              Personal Rec
            </button>
          </div>

          {/* Input Area */}
          <div className="flex items-center gap-2">
            {/* Voice Recording Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Text Input */}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                placeholder="Type your message or use voice..."
                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                disabled={isProcessing || isRecording}
              />
              <button
                onClick={handleTextInput}
                disabled={!textInput.trim() || isProcessing || isRecording}
                className="w-12 h-12 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Audio Playback Button */}
            <button
              onClick={playAudioResponse}
              disabled={isPlayingAudio || conversation.length === 0}
              className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                isPlayingAudio
                  ? 'bg-yellow-600 animate-pulse'
                  : 'bg-gray-600 hover:bg-gray-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPlayingAudio ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Clear Conversation */}
            <button
              onClick={clearConversation}
              className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center transition-colors"
              disabled={isProcessing}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Health Warnings */}
        {!healthProfile && (
          <div className="p-4 bg-yellow-900/20 border-t border-gray-700">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                Complete your health profile for personalized recommendations
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </>
  );
};

export default VoiceAssistant;
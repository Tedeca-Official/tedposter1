import React, { useState, useRef, useEffect } from 'react';
import { Upload, Video, Image, Calendar, Send, Check, X, Play, Pause, Scissors, Type, Music, Volume2, Zap, Link2, Settings, Loader2, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Simulated storage for demo (replace with actual database)
const storage = {
  async get(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  async set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Type definitions
interface Platform {
  id: string;
  name: string;
  connected: boolean;
  postTypes: string[];
  icon: string;
  color: string;
  username?: string;
  connectionData?: any;
}

interface VideoFile {
  file: File;
  url: string;
  duration: number;
  dimensions: { width: number; height: number };
}

interface Caption {
  platform: string;
  text: string;
}

interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  authUrl: string;
  scopes: string[];
}

// Main App Component
export default function SocialCrossPostApp() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'edit' | 'publish'>('upload');
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: 'tiktok', name: 'TikTok', connected: false, postTypes: ['Video'], icon: '🎵', color: 'bg-black' },
    { id: 'instagram', name: 'Instagram', connected: false, postTypes: ['Story', 'Post', 'Reel'], icon: '📷', color: 'bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-600' },
    { id: 'facebook', name: 'Facebook', connected: false, postTypes: ['Story', 'Post', 'Reel'], icon: '👤', color: 'bg-blue-600' },
    { id: 'youtube', name: 'YouTube', connected: false, postTypes: ['Video', 'Shorts'], icon: '▶️', color: 'bg-red-600' },
    { id: 'threads', name: 'Threads', connected: false, postTypes: ['Post'], icon: '🧵', color: 'bg-gray-900' }
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  // Load connections from storage on mount
  useEffect(() => {
    loadConnections();
    // Check for OAuth callback
    checkOAuthCallback();
  }, []);

  const loadConnections = async () => {
    const connections = await storage.get('platform_connections');
    if (connections) {
      setPlatforms(prev => prev.map(p => {
        const conn = connections[p.id];
        return conn ? { ...p, connected: true, username: conn.username, connectionData: conn } : p;
      }));
    }
  };

  const checkOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const platform = params.get('platform');

    if (code && platform) {
      handleOAuthCallback(platform, code, state);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleOAuthCallback = async (platform: string, code: string, state: string | null) => {
    // Verify state matches (security check)
    const savedState = localStorage.getItem('oauth_state');
    const savedPlatform = localStorage.getItem('oauth_platform');
    
    if (!savedState || !savedPlatform) {
      setError('OAuth state verification failed');
      return;
    }

    // Clear saved OAuth state
    localStorage.removeItem('oauth_state');
    localStorage.removeItem('oauth_platform');

    setSuccess(`Successfully connected to ${platform}!`);
    
    // Store connection data
    const connectionData = {
      platform,
      code,
      accessToken: platform === 'instagram' 
        ? 'IGAAMg21sN3MhBZAGF1c0JBcmJieVNlNEVoVThsblJSSGpfSUxVcjViQUhpSlZADU2xFN1pHc0dzbkJYWWRjR0JKS0xYemxGdGJjazQ5d1YwSnRWTVJ6ZAlN1VTRUaXF1ZAWlMbjJLVDFvZAm52czRvNGtaUUYyM3BFNW5vS0x6S003MAZDZD'
        : `mock_token_${Date.now()}`,
      username: `user_${platform}`,
      connectedAt: new Date().toISOString(),
      appId: platform === 'instagram' || platform === 'facebook' || platform === 'threads' ? '880551427693768' : undefined,
      clientKey: platform === 'tiktok' ? 'aw7sbxi93q5sl7gm' : undefined
    };

    // Save to storage
    const connections = await storage.get('platform_connections') || {};
    connections[platform] = connectionData;
    await storage.set('platform_connections', connections);

    // Update platforms state
    setPlatforms(prev => prev.map(p => 
      p.id === platform ? { ...p, connected: true, username: connectionData.username, connectionData } : p
    ));

    setTimeout(() => setSuccess(''), 5000);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return <UploadStep 
          onUpload={(file) => {
            setVideoFile(file);
            setCurrentStep('edit');
          }}
          onError={setError}
        />;
      case 'edit':
        return <EditorStep 
          videoFile={videoFile}
          onNext={() => setCurrentStep('publish')}
          onBack={() => setCurrentStep('upload')}
          setCaptions={setCaptions}
          platforms={platforms}
        />;
      case 'publish':
        return <PublishStep 
          videoFile={videoFile}
          platforms={platforms}
          selectedPlatforms={selectedPlatforms}
          setSelectedPlatforms={setSelectedPlatforms}
          captions={captions}
          setCaptions={setCaptions}
          onBack={() => setCurrentStep('edit')}
          onPublish={() => setSuccess('Posts scheduled successfully!')}
          setError={setError}
          onShowConnections={() => setShowConnectionModal(true)}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CrossPost Pro
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowConnectionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <Link2 className="w-4 h-4" />
              <span className="font-medium">Connections</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                {platforms.filter(p => p.connected).length}/{platforms.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-4">
          <StepIndicator 
            step={1} 
            label="Upload" 
            active={currentStep === 'upload'} 
            completed={currentStep === 'edit' || currentStep === 'publish'} 
          />
          <div className={`h-1 w-24 ${currentStep !== 'upload' ? 'bg-purple-600' : 'bg-gray-300'}`} />
          <StepIndicator 
            step={2} 
            label="Edit" 
            active={currentStep === 'edit'} 
            completed={currentStep === 'publish'} 
          />
          <div className={`h-1 w-24 ${currentStep === 'publish' ? 'bg-purple-600' : 'bg-gray-300'}`} />
          <StepIndicator 
            step={3} 
            label="Publish" 
            active={currentStep === 'publish'} 
            completed={false} 
          />
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <Alert className="bg-red-50 border-red-200">
            <X className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <Alert className="bg-green-50 border-green-200">
            <Check className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-12">
        {renderStep()}
      </main>

      {/* Connection Modal */}
      {showConnectionModal && (
        <ConnectionModal
          platforms={platforms}
          setPlatforms={setPlatforms}
          onClose={() => setShowConnectionModal(false)}
          connectingPlatform={connectingPlatform}
          setConnectingPlatform={setConnectingPlatform}
        />
      )}
    </div>
  );
}

// Connection Modal Component
function ConnectionModal({ 
  platforms, 
  setPlatforms, 
  onClose,
  connectingPlatform,
  setConnectingPlatform
}: any) {
  const [showInstructions, setShowInstructions] = useState<string | null>(null);

  const getOAuthConfig = (platformId: string): OAuthConfig => {
    const baseUrl = window.location.origin;
    const redirectUri = `${baseUrl}?platform=${platformId}`;

    switch (platformId) {
      case 'facebook':
        return {
          clientId: '880551427693768',
          redirectUri,
          authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
          scopes: ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish']
        };
      case 'instagram':
        return {
          clientId: '880551427693768', // Instagram uses Facebook OAuth
          redirectUri,
          authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
          scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'instagram_manage_comments', 'instagram_manage_insights']
        };
      case 'tiktok':
        return {
          clientId: 'aw7sbxi93q5sl7gm',
          redirectUri,
          authUrl: 'https://www.tiktok.com/v2/auth/authorize',
          scopes: ['user.info.basic', 'video.publish', 'video.upload']
        };
      case 'youtube':
        return {
          clientId: 'YOUR_GOOGLE_CLIENT_ID',
          redirectUri,
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube']
        };
      case 'threads':
        return {
          clientId: '880551427693768', // Threads uses same Meta App
          redirectUri,
          authUrl: 'https://threads.net/oauth/authorize',
          scopes: ['threads_basic', 'threads_content_publish']
        };
      default:
        return {
          clientId: '',
          redirectUri: '',
          authUrl: '',
          scopes: []
        };
    }
  };

  const connectPlatform = (platformId: string) => {
    const config = getOAuthConfig(platformId);
    
    // Show setup instructions for YouTube (not configured yet)
    if (platformId === 'youtube' && config.clientId.startsWith('YOUR_')) {
      setShowInstructions(platformId);
      return;
    }

    // Build OAuth URL
    let authUrl = '';
    const state = `${platformId}_${Date.now()}`;

    switch (platformId) {
      case 'facebook':
      case 'instagram':
      case 'threads':
        authUrl = `${config.authUrl}?` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
          `scope=${config.scopes.join(',')}&` +
          `response_type=code&` +
          `state=${state}`;
        break;
      case 'tiktok':
        authUrl = `${config.authUrl}?` +
          `client_key=${config.clientId}&` +
          `scope=${config.scopes.join(',')}&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
          `state=${state}`;
        break;
      case 'youtube':
        authUrl = `${config.authUrl}?` +
          `client_id=${config.clientId}&` +
          `redirect_uri=${encodeURIComponent(config.redirectUri)}&` +
          `response_type=code&` +
          `scope=${encodeURIComponent(config.scopes.join(' '))}&` +
          `access_type=offline&` +
          `prompt=consent&` +
          `state=${state}`;
        break;
    }

    // Save state to verify callback
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_platform', platformId);
    
    // Redirect to OAuth
    setConnectingPlatform(platformId);
    window.location.href = authUrl;
  };

  const disconnectPlatform = async (platformId: string) => {
    const connections = await storage.get('platform_connections') || {};
    delete connections[platformId];
    await storage.set('platform_connections', connections);

    setPlatforms((prev: Platform[]) => prev.map(p => 
      p.id === platformId ? { ...p, connected: false, username: undefined, connectionData: undefined } : p
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (showInstructions) {
    const platform = platforms.find((p: Platform) => p.id === showInstructions);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInstructions(null)}>
        <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Setup {platform?.name} Connection</h3>
            <button onClick={() => setShowInstructions(null)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                To connect {platform?.name}, you need to set up OAuth credentials. Follow these steps:
              </AlertDescription>
            </Alert>

            {showInstructions === 'facebook' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">1. Create Facebook App</h4>
                  <p className="text-sm text-gray-600 mb-2">Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta for Developers</a></p>
                  <button
                    onClick={() => window.open('https://developers.facebook.com/apps/create/', '_blank')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Create Facebook App
                  </button>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. Configure OAuth Settings</h4>
                  <p className="text-sm text-gray-600 mb-2">Add this redirect URI to your app:</p>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                    <code className="text-sm flex-1">{window.location.origin}?platform=facebook</code>
                    <button onClick={() => copyToClipboard(`${window.location.origin}?platform=facebook`)} className="p-2 hover:bg-gray-200 rounded">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3. Required Permissions</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>pages_manage_posts</li>
                    <li>pages_read_engagement</li>
                    <li>instagram_basic</li>
                    <li>instagram_content_publish</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">4. Get Your Credentials</h4>
                  <p className="text-sm text-gray-600 mb-2">Copy your App ID and App Secret from the Facebook App Dashboard.</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">5. Update Environment Variables</h4>
                  <div className="p-3 bg-gray-50 rounded border font-mono text-xs">
                    FACEBOOK_CLIENT_ID=your_app_id<br/>
                    FACEBOOK_CLIENT_SECRET=your_app_secret
                  </div>
                </div>
              </div>
            )}

            {showInstructions === 'instagram' && (
              <div className="space-y-4">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    Instagram uses the same OAuth as Facebook. Complete Facebook setup first.
                  </AlertDescription>
                </Alert>

                <div>
                  <h4 className="font-semibold mb-2">Additional Requirements</h4>
                  <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                    <li>Must have an Instagram Business Account</li>
                    <li>Instagram account must be connected to a Facebook Page</li>
                    <li>Use the same Facebook App credentials</li>
                  </ul>
                </div>

                <button
                  onClick={() => window.open('https://developers.facebook.com/docs/instagram-api/getting-started', '_blank')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Instagram API Docs
                </button>
              </div>
            )}

            {showInstructions === 'tiktok' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">1. Register TikTok Developer Account</h4>
                  <button
                    onClick={() => window.open('https://developers.tiktok.com', '_blank')}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    TikTok for Developers
                  </button>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. Create App & Request Permissions</h4>
                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <AlertDescription className="text-orange-900">
                      TikTok Content Posting API requires approval. Apply at the developer portal.
                    </AlertDescription>
                  </Alert>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3. Redirect URI</h4>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                    <code className="text-sm flex-1">{window.location.origin}?platform=tiktok</code>
                    <button onClick={() => copyToClipboard(`${window.location.origin}?platform=tiktok`)} className="p-2 hover:bg-gray-200 rounded">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">4. Environment Variables</h4>
                  <div className="p-3 bg-gray-50 rounded border font-mono text-xs">
                    TIKTOK_CLIENT_KEY=your_client_key<br/>
                    TIKTOK_CLIENT_SECRET=your_client_secret
                  </div>
                </div>
              </div>
            )}

            {showInstructions === 'youtube' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">1. Create Google Cloud Project</h4>
                  <button
                    onClick={() => window.open('https://console.cloud.google.com', '_blank')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Google Cloud Console
                  </button>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. Enable YouTube Data API v3</h4>
                  <p className="text-sm text-gray-600">Navigate to APIs & Services → Enable APIs and Services → Search for "YouTube Data API v3"</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3. Create OAuth 2.0 Credentials</h4>
                  <p className="text-sm text-gray-600 mb-2">Add this authorized redirect URI:</p>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                    <code className="text-sm flex-1">{window.location.origin}?platform=youtube</code>
                    <button onClick={() => copyToClipboard(`${window.location.origin}?platform=youtube`)} className="p-2 hover:bg-gray-200 rounded">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">4. Environment Variables</h4>
                  <div className="p-3 bg-gray-50 rounded border font-mono text-xs">
                    YOUTUBE_CLIENT_ID=your_client_id<br/>
                    YOUTUBE_CLIENT_SECRET=your_client_secret
                  </div>
                </div>
              </div>
            )}

            {showInstructions === 'threads' && (
              <div className="space-y-4">
                <Alert className="bg-purple-50 border-purple-200">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    Threads API is currently in limited beta. You may need to request access.
                  </AlertDescription>
                </Alert>

                <div>
                  <h4 className="font-semibold mb-2">1. Request Threads API Access</h4>
                  <button
                    onClick={() => window.open('https://developers.facebook.com/docs/threads', '_blank')}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Threads API Docs
                  </button>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. Similar to Instagram Setup</h4>
                  <p className="text-sm text-gray-600">Threads uses Meta's OAuth system. You'll need a Meta App with Threads permissions.</p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={() => setShowInstructions(null)}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Platform Connections</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {platforms.map((platform: Platform) => (
            <div 
              key={platform.id} 
              className={`p-4 border-2 rounded-xl transition-all ${
                platform.connected ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center text-2xl`}>
                    {platform.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{platform.name}</div>
                    {platform.connected && platform.username && (
                      <div className="text-sm text-gray-600">@{platform.username}</div>
                    )}
                    {!platform.connected && (
                      <div className="text-xs text-gray-500">{platform.postTypes.join(', ')}</div>
                    )}
                  </div>
                </div>
                
                {platform.connected ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Connected
                    </div>
                    <button
                      onClick={() => disconnectPlatform(platform.id)}
                      className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-all"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => connectPlatform(platform.id)}
                    disabled={connectingPlatform === platform.id}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {connectingPlatform === platform.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Connect
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> OAuth credentials need to be configured for each platform. Click "Connect" on a platform to see setup instructions.
          </p>
        </div>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ step, label, active, completed }: { step: number; label: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
        completed ? 'bg-purple-600 text-white' : 
        active ? 'bg-purple-600 text-white ring-4 ring-purple-200' : 
        'bg-gray-200 text-gray-500'
      }`}>
        {completed ? <Check className="w-6 h-6" /> : step}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-purple-600' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

// Upload Step Component
function UploadStep({ onUpload, onError }: { onUpload: (file: VideoFile) => void; onError: (error: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessVideo = async (file: File) => {
    setIsProcessing(true);
    onError('');

    if (!file.type.startsWith('video/')) {
      onError('Please upload a valid video file');
      setIsProcessing(false);
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      onError('Video file too large. Maximum 500MB.');
      setIsProcessing(false);
      return;
    }

    try {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve(null);
        video.onerror = () => reject(new Error('Failed to load video'));
      });

      if (video.duration > 90) {
        onError(`Video is ${Math.round(video.duration)}s long. Maximum allowed is 90 seconds (1:30 min). Please trim your video and try again.`);
        URL.revokeObjectURL(url);
        setIsProcessing(false);
        return;
      }

      onUpload({
        file,
        url,
        duration: video.duration,
        dimensions: { width: video.videoWidth, height: video.videoHeight }
      });

    } catch (err) {
      onError('Failed to process video. Please try another file.');
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndProcessVideo(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndProcessVideo(file);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Video</h2>
          <p className="text-gray-600">Maximum 90 seconds (1:30 min) • MP4, MOV, or WebM</p>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative border-3 border-dashed rounded-2xl p-12 transition-all ${
            isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isProcessing ? (
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-10 h-10 text-purple-600" />
              )}
            </div>
            
            {isProcessing ? (
              <p className="text-lg text-gray-700 mb-2">Processing video...</p>
            ) : (
              <>
                <p className="text-lg text-gray-700 mb-2">
                  <span className="font-semibold">Drop your video here</span> or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Select Video
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-sm font-medium text-gray-700">Max 90s</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-1">📱</div>
            <div className="text-sm font-medium text-gray-700">5 Platforms</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mb-1">✨</div>
            <div className="text-sm font-medium text-gray-700">AI Captions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Editor Step Component
function EditorStep({ videoFile, onNext, onBack, setCaptions, platforms }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(videoFile?.duration || 0);
  const [generatingCaptions, setGeneratingCaptions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleGenerateCaptions = async () => {
    setGeneratingCaptions(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const generatedCaptions = [
      { platform: 'tiktok', text: '🔥 Check this out! Amazing content coming your way! #viral #trending #fyp #foryoupage' },
      { platform: 'instagram', text: '✨ New video alert! Swipe to see more 👉 #instagood #reels #explore #viral' },
      { platform: 'facebook', text: 'Watch this amazing video! Share with friends who need to see this. 🎥 Tag someone!' },
      { platform: 'youtube', text: 'Incredible Video You Need to Watch | Full Tutorial & Tips' },
      { platform: 'threads', text: 'Just dropped something amazing 👀 What do you think? Let me know below!' }
    ];
    
    setCaptions(generatedCaptions);
    setGeneratingCaptions(false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      const handleTimeUpdate = () => setCurrentTime(video.currentTime);
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, []);

  if (!videoFile) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-600" />
          Video Editor
        </h3>
        
        <div className="relative bg-black rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '9/16', maxHeight: '500px' }}>
          <video
            ref={videoRef}
            src={videoFile.url}
            className="w-full h-full object-contain"
            onEnded={() => setIsPlaying(false)}
          />
          
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all group"
          >
            {isPlaying ? (
              <Pause className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            ) : (
              <Play className="w-16 h-16 text-white" />
            )}
          </button>

          <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-full text-white text-sm">
            {Math.floor(currentTime)}s / {Math.floor(videoFile.duration)}s
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              Trim Video
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max={videoFile.duration}
                step="0.1"
                value={trimStart}
                onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-16">{trimStart.toFixed(1)}s</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <input
                type="range"
                min="0"
                max={videoFile.duration}
                step="0.1"
                value={trimEnd}
                onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-16">{trimEnd.toFixed(1)}s</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-all">
              <Type className="w-4 h-4" />
              Add Text
            </button>
            <button className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-all">
              <Music className="w-4 h-4" />
              Add Music
            </button>
            <button className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-all">
              <Image className="w-4 h-4" />
              Thumbnail
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          AI Captions
        </h3>

        <button
          onClick={handleGenerateCaptions}
          disabled={generatingCaptions}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
        >
          {generatingCaptions ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate AI Captions
            </>
          )}
        </button>

        <div className="space-y-3">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-700">
              <strong>✨ Pro Tip:</strong> AI will generate platform-optimized captions with hashtags, hooks, and SEO keywords!
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Video Info</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Duration: {videoFile.duration.toFixed(1)}s</p>
              <p>Resolution: {videoFile.dimensions.width}x{videoFile.dimensions.height}</p>
              <p>Aspect: {videoFile.dimensions.height > videoFile.dimensions.width ? 'Portrait' : 'Landscape'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// Publish Step Component
function PublishStep({ videoFile, platforms, selectedPlatforms, setSelectedPlatforms, captions, setCaptions, onBack, onPublish, setError, onShowConnections }: any) {
  const [postTypes, setPostTypes] = useState<{ [key: string]: string }>({});
  const [scheduleTime, setScheduleTime] = useState<string>('now');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    const unconnected = selectedPlatforms.filter(p => !platforms.find((pl: any) => pl.id === p)?.connected);
    if (unconnected.length > 0) {
      setError('Please connect all selected platforms first');
      return;
    }

    setIsPublishing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPublishing(false);
    onPublish();
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev: string[]) =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold mb-6">Publish to Platforms</h2>

        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Select Platforms</h3>
          <div className="grid grid-cols-2 gap-4">
            {platforms.map((platform: Platform) => (
              <div
                key={platform.id}
                onClick={() => platform.connected && togglePlatform(platform.id)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!platform.connected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{platform.icon}</span>
                    <span className="font-medium">{platform.name}</span>
                  </div>
                  {selectedPlatforms.includes(platform.id) && (
                    <Check className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                {!platform.connected ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowConnections();
                    }}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    Connect first →
                  </button>
                ) : (
                  selectedPlatforms.includes(platform.id) && (
                    <select
                      value={postTypes[platform.id] || platform.postTypes[0]}
                      onChange={(e) => setPostTypes({ ...postTypes, [platform.id]: e.target.value })}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {platform.postTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedPlatforms.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Customize Captions</h3>
            <div className="space-y-4">
              {selectedPlatforms.map(platformId => {
                const platform = platforms.find((p: Platform) => p.id === platformId);
                const caption = captions.find(c => c.platform === platformId);
                return (
                  <div key={platformId}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {platform?.icon} {platform?.name}
                    </label>
                    <textarea
                      value={caption?.text || ''}
                      onChange={(e) => {
                        const newCaptions = captions.filter(c => c.platform !== platformId);
                        setCaptions([...newCaptions, { platform: platformId, text: e.target.value }]);
                      }}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={`Caption for ${platform?.name}...`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule
          </h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="schedule"
                value="now"
                checked={scheduleTime === 'now'}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-4 h-4 text-purple-600"
              />
              <span>Post Now</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="schedule"
                value="later"
                checked={scheduleTime === 'later'}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-4 h-4 text-purple-600"
              />
              <span>Schedule for Today</span>
            </label>
          </div>
          {scheduleTime === 'later' && (
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              min={getCurrentTime()}
              className="mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            Back to Editor
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing || selectedPlatforms.length === 0}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPublishing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {scheduleTime === 'now' ? 'Publish Now' : 'Schedule Post'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure uploads folder exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// -------------------------------------------------------------
// In-Memory Database with Initial Realistic Seed
// -------------------------------------------------------------
const initialUsers = [
  {
    id: 'user_raju',
    name: 'Raju Sharma',
    username: 'raju',
    email: 'raju@chatx.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raju&backgroundColor=b6e3f4',
    bio: 'Building the next-gen real-time web 🚀',
    phone: '+1 (555) 019-2834',
    online: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'user_sarah',
    name: 'Sarah Chen',
    username: 'sarah_c',
    email: 'sarah@chatx.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffd5dc',
    bio: 'Product Designer • Crafting intuitive UI/UX ✨',
    phone: '+1 (555) 014-9982',
    online: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'user_alex',
    name: 'Alex Rivera',
    username: 'alex_r',
    email: 'alex@chatx.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=d1d4f9',
    bio: 'Fullstack Dev • Coffee & WebSockets ☕',
    phone: '+1 (555) 018-4421',
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: 'user_priya',
    name: 'Priya Patel',
    username: 'priya_p',
    email: 'priya@chatx.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=c0aede',
    bio: 'Mobile Architect & Open Source Enthusiast 📱',
    phone: '+1 (555) 012-7733',
    online: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: 'user_maya',
    name: 'Maya Lin',
    username: 'maya_l',
    email: 'maya@chatx.io',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&backgroundColor=ffdfbf',
    bio: 'Photography & AI Researcher 📸',
    phone: '+1 (555) 015-8829',
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 65).toISOString()
  }
];

let users = [...initialUsers];

let conversations = [
  {
    id: 'conv_1',
    type: 'direct',
    participants: ['user_raju', 'user_sarah'],
    pinnedBy: ['user_raju'],
    mutedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
  },
  {
    id: 'conv_2',
    type: 'direct',
    participants: ['user_raju', 'user_alex'],
    pinnedBy: [],
    mutedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: 'conv_3',
    type: 'group',
    name: 'ChatX Core Engineering ⚡',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=ChatXCore&backgroundColor=c0aede',
    description: 'Sprint planning and real-time infrastructure discussion',
    admins: ['user_raju'],
    participants: ['user_raju', 'user_sarah', 'user_alex', 'user_priya'],
    pinnedBy: ['user_raju'],
    mutedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'conv_4',
    type: 'direct',
    participants: ['user_raju', 'user_priya'],
    pinnedBy: [],
    mutedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'conv_5',
    type: 'direct',
    participants: ['user_raju', 'user_maya'],
    pinnedBy: [],
    mutedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString()
  }
];

let messages = [
  {
    id: 'msg_101',
    conversationId: 'conv_1',
    senderId: 'user_sarah',
    type: 'text',
    text: 'Hey Raju! Have you checked out the new design system components for ChatX? 🎨',
    status: 'read',
    readBy: ['user_raju', 'user_sarah'],
    reactions: { '👍': ['user_raju'] },
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'msg_102',
    conversationId: 'conv_1',
    senderId: 'user_raju',
    type: 'text',
    text: 'Yes! The typography and dark mode contrast look phenomenal. Clean, modern, and snappy ⚡',
    status: 'read',
    readBy: ['user_sarah', 'user_raju'],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'msg_103',
    conversationId: 'conv_1',
    senderId: 'user_sarah',
    type: 'text',
    text: 'Awesome! Real-time WebSockets and voice notes are running seamlessly too.',
    status: 'read',
    readBy: ['user_raju', 'user_sarah'],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 'msg_104',
    conversationId: 'conv_1',
    senderId: 'user_sarah',
    type: 'text',
    text: 'Are you free for a quick voice call later to review the group settings?',
    status: 'delivered',
    readBy: ['user_sarah'],
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
  },
  {
    id: 'msg_201',
    conversationId: 'conv_2',
    senderId: 'user_raju',
    type: 'text',
    text: 'Hey Alex, did you push the updated WebRTC signaling handlers?',
    status: 'read',
    readBy: ['user_alex', 'user_raju'],
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString()
  },
  {
    id: 'msg_202',
    conversationId: 'conv_2',
    senderId: 'user_alex',
    type: 'text',
    text: 'Yes, both audio and video streams work with direct peer connections and STUN fallback! 🚀',
    status: 'read',
    readBy: ['user_raju', 'user_alex'],
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString()
  },
  {
    id: 'msg_301',
    conversationId: 'conv_3',
    senderId: 'user_raju',
    type: 'text',
    text: 'Welcome everyone to the ChatX Core team group! 🚀',
    status: 'read',
    readBy: ['user_raju', 'user_sarah', 'user_alex', 'user_priya'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'msg_302',
    conversationId: 'conv_3',
    senderId: 'user_priya',
    type: 'text',
    text: 'Excited to be here! The responsive layout across mobile and desktop is super fluid.',
    status: 'read',
    readBy: ['user_raju', 'user_sarah', 'user_alex', 'user_priya'],
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString()
  },
  {
    id: 'msg_303',
    conversationId: 'conv_3',
    senderId: 'user_alex',
    type: 'text',
    text: 'Just tested the media upload and 24h stories feature. Works like a charm.',
    status: 'read',
    readBy: ['user_raju', 'user_sarah', 'user_alex'],
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  }
];

let statuses = [
  {
    id: 'status_1',
    userId: 'user_sarah',
    type: 'text',
    content: '🚀 Shipping the new ChatX dark theme today! Clean lines, zero clutter.',
    background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    textColor: '#ffffff',
    viewers: ['user_raju'],
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 22).toISOString()
  },
  {
    id: 'status_2',
    userId: 'user_priya',
    type: 'text',
    content: '🎧 Coding with lo-fi beats & WebSockets. Loving the instant delivery.',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    textColor: '#ffffff',
    viewers: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 19).toISOString()
  }
];

// Persistent File Storage in uploads/
const DATA_FILE = path.join(UPLOADS_DIR, 'chatx_store.json');

function loadPersistentData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        const uMap = new Map();
        users.forEach(u => uMap.set(u.id, u));
        parsed.users.forEach(u => uMap.set(u.id, u));
        users = Array.from(uMap.values());
      }
      if (Array.isArray(parsed.conversations) && parsed.conversations.length > 0) {
        const cMap = new Map();
        conversations.forEach(c => cMap.set(c.id, c));
        parsed.conversations.forEach(c => cMap.set(c.id, c));
        conversations = Array.from(cMap.values());
      }
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        const mMap = new Map();
        messages.forEach(m => mMap.set(m.id, m));
        parsed.messages.forEach(m => mMap.set(m.id, m));
        messages = Array.from(mMap.values());
      }
      if (Array.isArray(parsed.statuses) && parsed.statuses.length > 0) {
        statuses = parsed.statuses;
      }
      console.log(`[ChatX Store] Loaded: ${users.length} users, ${conversations.length} convs, ${messages.length} msgs`);
    }
  } catch (err) {
    console.warn('[ChatX Store] Could not read store file:', err.message);
  }
}

function savePersistentData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ users, conversations, messages, statuses }, null, 2)
    );
  } catch (err) {
    console.error('[ChatX Store] Could not write store file:', err.message);
  }
}

loadPersistentData();

// Connected WebSocket clients mapping: userId -> Set of WebSocket instances
const clients = new Map();

function broadcastToUsers(userIds, eventPayload) {
  const messageStr = JSON.stringify(eventPayload);
  userIds.forEach(uid => {
    const userSockets = clients.get(uid);
    if (userSockets) {
      userSockets.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  });
}

function broadcastToAll(eventPayload) {
  const messageStr = JSON.stringify(eventPayload);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// -------------------------------------------------------------
// WebSocket Real-Time Connection Handling
// -------------------------------------------------------------
wss.on('connection', (ws) => {
  let currentUserId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'auth') {
        currentUserId = msg.userId;
        if (!clients.has(currentUserId)) {
          clients.set(currentUserId, new Set());
        }
        clients.get(currentUserId).add(ws);

        // Update user status to online
        const user = users.find(u => u.id === currentUserId);
        if (user) {
          user.online = true;
          user.lastSeen = new Date().toISOString();
        }

        // Notify everyone about online presence
        broadcastToAll({
          type: 'presence:update',
          userId: currentUserId,
          online: true,
          lastSeen: new Date().toISOString()
        });
      }

      else if (msg.type === 'typing') {
        const { conversationId, isTyping } = msg;
        const conv = conversations.find(c => c.id === conversationId);
        if (conv) {
          broadcastToUsers(conv.participants.filter(id => id !== currentUserId), {
            type: 'typing:update',
            conversationId,
            userId: currentUserId,
            isTyping
          });
        }
      }

      // WebRTC Call Signaling
      else if (msg.type === 'call:initiate' || msg.type === 'call:signal' || msg.type === 'call:answer' || msg.type === 'call:reject' || msg.type === 'call:end' || msg.type === 'call:ice-candidate') {
        const { recipientId } = msg;
        if (recipientId) {
          broadcastToUsers([recipientId], {
            ...msg,
            senderId: currentUserId
          });
        }
      }
    } catch (err) {
      console.error('WS parse error:', err);
    }
  });

  ws.on('close', () => {
    if (currentUserId && clients.has(currentUserId)) {
      const userSockets = clients.get(currentUserId);
      userSockets.delete(ws);
      if (userSockets.size === 0) {
        clients.delete(currentUserId);
        const user = users.find(u => u.id === currentUserId);
        if (user) {
          user.online = false;
          user.lastSeen = new Date().toISOString();
        }
        broadcastToAll({
          type: 'presence:update',
          userId: currentUserId,
          online: false,
          lastSeen: new Date().toISOString()
        });
      }
    }
  });
});

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account found with these credentials' });
  }

  return res.json({
    user,
    token: `chatx_token_${user.id}`
  });
});

// Auth: Register or Upsert
app.post('/api/auth/register', (req, res) => {
  const { id, name, username, email, avatar, bio, phone } = req.body;
  if (!name || !username || !email) {
    return res.status(400).json({ error: 'Name, username, and email are required' });
  }

  const existing = users.find(u => 
    (id && u.id === id) || 
    u.email.toLowerCase() === email.toLowerCase() || 
    u.username.toLowerCase() === username.toLowerCase()
  );

  if (existing) {
    if (id) existing.id = id;
    existing.name = name;
    if (avatar) existing.avatar = avatar;
    if (bio !== undefined) existing.bio = bio;
    if (phone !== undefined) existing.phone = phone;
    existing.online = true;
    return res.json({
      user: existing,
      token: `chatx_token_${existing.id}`
    });
  }

  const newUser = {
    id: id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    email,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
    bio: bio || 'Hey there! I am using ChatX.',
    phone: phone || '',
    online: true,
    lastSeen: new Date().toISOString()
  };

  users.push(newUser);

  // Auto create welcoming direct conversation with Raju
  const welcomeConv = {
    id: `conv_${Date.now()}`,
    type: 'direct',
    participants: [newUser.id, 'user_raju'],
    pinnedBy: [],
    mutedBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  conversations.unshift(welcomeConv);

  const welcomeMsg = {
    id: `msg_${Date.now()}`,
    conversationId: welcomeConv.id,
    senderId: 'user_raju',
    type: 'text',
    text: `Welcome to ChatX, ${name}! 🎉 Feel free to explore real-time messaging, audio calls, voice notes, and stories.`,
    status: 'delivered',
    readBy: ['user_raju'],
    createdAt: new Date().toISOString()
  };
  messages.push(welcomeMsg);

  return res.json({
    user: newUser,
    token: `chatx_token_${newUser.id}`
  });
});

// Explicit Sync User from Firebase
app.post('/api/auth/sync-user', (req, res) => {
  const { id, name, username, email, avatar, bio, phone } = req.body;
  if (!id) return res.status(400).json({ error: 'User ID is required' });

  let existing = users.find(u => u.id === id || (email && u.email && u.email.toLowerCase() === email.toLowerCase()));
  if (existing) {
    existing.id = id;
    if (name) existing.name = name;
    if (username) existing.username = username;
    if (avatar) existing.avatar = avatar;
    if (bio !== undefined) existing.bio = bio;
    if (phone !== undefined) existing.phone = phone;
    existing.online = true;
    return res.json({ user: existing });
  }

  const newUser = {
    id,
    name: name || 'ChatX User',
    username: (username || (email ? email.split('@')[0] : 'user')).toLowerCase().replace(/[^a-z0-9_]/g, ''),
    email: email || '',
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || id)}&backgroundColor=b6e3f4`,
    bio: bio || 'Hey there! I am using ChatX.',
    phone: phone || '',
    online: true,
    lastSeen: new Date().toISOString()
  };

  users.push(newUser);
  return res.json({ user: newUser });
});

// Get Current User Profile
app.get('/api/auth/me', (req, res) => {
  const userId = req.headers['x-user-id'] || 'user_raju';
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// Update Profile
app.post('/api/auth/update-profile', (req, res) => {
  const userId = req.headers['x-user-id'] || req.body.id;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, bio, avatar, phone } = req.body;
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar) user.avatar = avatar;
  if (phone !== undefined) user.phone = phone;

  broadcastToAll({
    type: 'user:update',
    user
  });

  res.json({ user });
});

// Search & List Users
app.get('/api/users', (req, res) => {
  const currentUserId = req.headers['x-user-id'];
  const query = (req.query.q || '').toLowerCase();
  
  let result = users;
  if (currentUserId) {
    result = result.filter(u => u.id !== currentUserId);
  }
  if (query) {
    result = result.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.username.toLowerCase().includes(query)
    );
  }
  res.json({ users: result });
});

// Conversations List
app.get('/api/conversations', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  
  const userConvs = conversations.filter(c => c.participants.includes(currentUserId));
  
  const enriched = userConvs.map(conv => {
    // Get last message
    const convMessages = messages.filter(m => m.conversationId === conv.id && !(m.deletedFor && m.deletedFor.includes(currentUserId)));
    const lastMsg = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;

    // Count unread
    const unreadCount = convMessages.filter(m => m.senderId !== currentUserId && (!m.readBy || !m.readBy.includes(currentUserId))).length;

    // Get other participant(s) details
    const participantDetails = conv.participants.map(pid => users.find(u => u.id === pid)).filter(Boolean);
    const otherParticipant = conv.type === 'direct' 
      ? participantDetails.find(p => p.id !== currentUserId) || participantDetails[0]
      : null;

    return {
      ...conv,
      lastMessage: lastMsg,
      unreadCount,
      otherParticipant,
      participantDetails,
      isPinned: conv.pinnedBy && conv.pinnedBy.includes(currentUserId),
      isMuted: conv.mutedBy && conv.mutedBy.includes(currentUserId)
    };
  });

  // Sort pinned first, then by latest update
  enriched.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
    const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
    return timeB - timeA;
  });

  res.json({ conversations: enriched });
});

// Create Conversation (Direct or Group)
app.post('/api/conversations', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  const { id, type, recipientId, participantIds, name, description, avatar } = req.body;

  if (type === 'direct') {
    if (!recipientId) return res.status(400).json({ error: 'recipientId is required' });

    // Check if conversation already exists by ID or by participants
    const existing = conversations.find(c => 
      (id && c.id === id) ||
      (c.type === 'direct' && 
       c.participants.includes(currentUserId) && 
       c.participants.includes(recipientId))
    );

    if (existing) {
      if (id && existing.id !== id) existing.id = id;
      if (!existing.participants.includes(currentUserId)) existing.participants.push(currentUserId);
      if (!existing.participants.includes(recipientId)) existing.participants.push(recipientId);
      return res.json({ conversation: existing, created: false });
    }

    const newConv = {
      id: id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'direct',
      participants: [currentUserId, recipientId],
      pinnedBy: [],
      mutedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    conversations.unshift(newConv);
    savePersistentData();

    broadcastToUsers([currentUserId, recipientId], {
      type: 'conversation:new',
      conversation: newConv
    });

    return res.json({ conversation: newConv, created: true });
  } else if (type === 'group') {
    if (!name) return res.status(400).json({ error: 'Group name is required' });
    const allParticipants = Array.from(new Set([currentUserId, ...(participantIds || [])]));

    const newGroup = {
      id: id || `conv_grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'group',
      name,
      description: description || '',
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4`,
      admins: [currentUserId],
      participants: allParticipants,
      pinnedBy: [],
      mutedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    conversations.unshift(newGroup);

    // Initial system welcome message
    const sysMsg = {
      id: `msg_sys_${Date.now()}`,
      conversationId: newGroup.id,
      senderId: currentUserId,
      type: 'system',
      text: `${users.find(u => u.id === currentUserId)?.name || 'Someone'} created group "${name}"`,
      status: 'read',
      readBy: allParticipants,
      createdAt: new Date().toISOString()
    };
    messages.push(sysMsg);

    broadcastToUsers(allParticipants, {
      type: 'conversation:new',
      conversation: newGroup
    });

    return res.json({ conversation: newGroup, created: true });
  }

  res.status(400).json({ error: 'Invalid conversation type' });
});

// Update Conversation (Pin, Mute, Leave, Add/Remove Member, Group Subject)
app.put('/api/conversations/:id', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  const { id } = req.params;
  const conv = conversations.find(c => c.id === id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const { action, name, description, avatar, memberId, role } = req.body;

  if (action === 'toggle-pin') {
    conv.pinnedBy = conv.pinnedBy || [];
    if (conv.pinnedBy.includes(currentUserId)) {
      conv.pinnedBy = conv.pinnedBy.filter(u => u !== currentUserId);
    } else {
      conv.pinnedBy.push(currentUserId);
    }
  } else if (action === 'toggle-mute') {
    conv.mutedBy = conv.mutedBy || [];
    if (conv.mutedBy.includes(currentUserId)) {
      conv.mutedBy = conv.mutedBy.filter(u => u !== currentUserId);
    } else {
      conv.mutedBy.push(currentUserId);
    }
  } else if (action === 'update-group') {
    if (name) conv.name = name;
    if (description !== undefined) conv.description = description;
    if (avatar) conv.avatar = avatar;
  } else if (action === 'add-member' && memberId) {
    if (!conv.participants.includes(memberId)) {
      conv.participants.push(memberId);
      const addedUser = users.find(u => u.id === memberId);
      messages.push({
        id: `msg_sys_${Date.now()}`,
        conversationId: conv.id,
        senderId: currentUserId,
        type: 'system',
        text: `${addedUser ? addedUser.name : 'A member'} was added to the group`,
        status: 'read',
        readBy: conv.participants,
        createdAt: new Date().toISOString()
      });
    }
  } else if (action === 'remove-member' && memberId) {
    conv.participants = conv.participants.filter(p => p !== memberId);
    if (conv.admins) conv.admins = conv.admins.filter(a => a !== memberId);
    const remUser = users.find(u => u.id === memberId);
    messages.push({
      id: `msg_sys_${Date.now()}`,
      conversationId: conv.id,
      senderId: currentUserId,
      type: 'system',
      text: `${remUser ? remUser.name : 'A member'} was removed from the group`,
      status: 'read',
      readBy: conv.participants,
      createdAt: new Date().toISOString()
    });
  } else if (action === 'set-admin' && memberId) {
    conv.admins = conv.admins || [];
    if (role === 'admin' && !conv.admins.includes(memberId)) {
      conv.admins.push(memberId);
    } else if (role === 'member') {
      conv.admins = conv.admins.filter(a => a !== memberId);
    }
  }

  broadcastToUsers(conv.participants, {
    type: 'conversation:update',
    conversation: conv
  });

  res.json({ conversation: conv });
});

// Messages for Conversation
app.get('/api/conversations/:id/messages', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  const { id } = req.params;

  const conv = conversations.find(c => c.id === id);
  if (!conv || !conv.participants.includes(currentUserId)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const convMessages = messages
    .filter(m => m.conversationId === id && !(m.deletedFor && m.deletedFor.includes(currentUserId)))
    .map(m => {
      const sender = users.find(u => u.id === m.senderId);
      return {
        ...m,
        senderName: sender ? sender.name : 'Unknown',
        senderAvatar: sender ? sender.avatar : null
      };
    });

  res.json({ messages: convMessages });
});

// Send Message
app.post('/api/conversations/:id/messages', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || req.body.senderId || 'user_raju';
  const { id } = req.params;
  const { id: clientMsgId, text, type, mediaUrl, fileName, fileSize, fileType, duration, replyTo, participants } = req.body;

  let conv = conversations.find(c => c.id === id);
  if (!conv) {
    // If conversation was created on client/Firestore, auto-register it
    conv = {
      id,
      type: req.body.conversationType || (participants && participants.length > 2 ? 'group' : 'direct'),
      participants: Array.isArray(participants) && participants.length > 0 ? [...participants] : [currentUserId],
      pinnedBy: [],
      mutedBy: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!conv.participants.includes(currentUserId)) {
      conv.participants.push(currentUserId);
    }
    conversations.unshift(conv);
  } else {
    if (!conv.participants.includes(currentUserId)) {
      conv.participants.push(currentUserId);
    }
    if (Array.isArray(participants)) {
      participants.forEach(p => {
        if (!conv.participants.includes(p)) conv.participants.push(p);
      });
    }
  }

  let sender = users.find(u => u.id === currentUserId);
  if (!sender) {
    sender = {
      id: currentUserId,
      name: req.body.senderName || 'User',
      avatar: req.body.senderAvatar || null
    };
    users.push(sender);
  }

  const newMsg = {
    id: clientMsgId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    conversationId: id,
    senderId: currentUserId,
    senderName: sender ? sender.name : (req.body.senderName || 'Unknown'),
    senderAvatar: sender ? sender.avatar : (req.body.senderAvatar || null),
    type: type || 'text',
    text: text || '',
    mediaUrl: mediaUrl || null,
    fileName: fileName || null,
    fileSize: fileSize || null,
    fileType: fileType || null,
    duration: duration || null,
    replyTo: replyTo || null,
    status: 'sent',
    readBy: [currentUserId],
    reactions: {},
    createdAt: req.body.createdAt || new Date().toISOString()
  };

  messages.push(newMsg);
  conv.updatedAt = newMsg.createdAt;
  conv.lastMessage = newMsg;

  // Broadcast to other participants
  const recipients = conv.participants.filter(p => p !== currentUserId);
  
  // Set delivered if recipient is connected
  const anyConnected = recipients.some(r => clients.has(r) && clients.get(r).size > 0);
  if (anyConnected) {
    newMsg.status = 'delivered';
  }

  savePersistentData();

  broadcastToUsers(conv.participants, {
    type: 'message:new',
    conversationId: id,
    message: newMsg
  });

  broadcastToUsers(conv.participants, {
    type: 'conversation:update',
    conversationId: id,
    conversation: conv,
    lastMessage: newMsg
  });

  res.json({ message: newMsg });
});

// Mark messages as read in conversation
app.post('/api/conversations/:id/messages/read', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  const { id } = req.params;

  const conv = conversations.find(c => c.id === id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  let updatedCount = 0;
  messages.forEach(m => {
    if (m.conversationId === id && m.senderId !== currentUserId) {
      if (!m.readBy) m.readBy = [];
      if (!m.readBy.includes(currentUserId)) {
        m.readBy.push(currentUserId);
        m.status = 'read';
        updatedCount++;
      }
    }
  });

  if (updatedCount > 0) {
    broadcastToUsers(conv.participants, {
      type: 'message:read',
      conversationId: id,
      readByUserId: currentUserId,
      timestamp: new Date().toISOString()
    });
  }

  res.json({ success: true, updatedCount });
});

// Edit Message
app.put('/api/conversations/:id/messages/:msgId', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  const { id, msgId } = req.params;
  const { text } = req.body;

  const msg = messages.find(m => m.id === msgId && m.conversationId === id);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.senderId !== currentUserId) return res.status(403).json({ error: 'Can only edit own messages' });

  msg.text = text;
  msg.isEdited = true;
  msg.editedAt = new Date().toISOString();

  const conv = conversations.find(c => c.id === id);
  if (conv) {
    broadcastToUsers(conv.participants, {
      type: 'message:update',
      conversationId: id,
      message: msg
    });
  }

  res.json({ message: msg });
});

// Delete Message
app.delete('/api/conversations/:id/messages/:msgId', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  const { id, msgId } = req.params;
  const { deleteForEveryone } = req.query;

  const msgIndex = messages.findIndex(m => m.id === msgId && m.conversationId === id);
  if (msgIndex === -1) return res.status(404).json({ error: 'Message not found' });

  const msg = messages[msgIndex];
  const conv = conversations.find(c => c.id === id);

  if (deleteForEveryone === 'true' && msg.senderId === currentUserId) {
    msg.isDeleted = true;
    msg.text = 'This message was deleted';
    msg.mediaUrl = null;

    if (conv) {
      broadcastToUsers(conv.participants, {
        type: 'message:update',
        conversationId: id,
        message: msg
      });
    }
  } else {
    msg.deletedFor = msg.deletedFor || [];
    if (!msg.deletedFor.includes(currentUserId)) {
      msg.deletedFor.push(currentUserId);
    }
    broadcastToUsers([currentUserId], {
      type: 'message:delete_for_me',
      conversationId: id,
      messageId: msgId
    });
  }

  res.json({ success: true });
});

// Status / Stories
app.get('/api/statuses', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  const now = new Date().toISOString();
  
  // Clean up expired statuses (> 24 hours)
  const validStatuses = statuses.filter(s => s.expiresAt > now);

  // Group by user
  const userMap = {};
  validStatuses.forEach(st => {
    if (!userMap[st.userId]) {
      const user = users.find(u => u.id === st.userId);
      userMap[st.userId] = {
        user: user || { id: st.userId, name: 'Unknown', avatar: null },
        items: []
      };
    }
    userMap[st.userId].items.push({
      ...st,
      viewedByMe: st.viewers && st.viewers.includes(currentUserId)
    });
  });

  const myStatus = userMap[currentUserId] || {
    user: users.find(u => u.id === currentUserId),
    items: []
  };

  const recentUpdates = [];
  const viewedUpdates = [];

  Object.keys(userMap).forEach(uid => {
    if (uid !== currentUserId) {
      const entry = userMap[uid];
      const allViewed = entry.items.every(i => i.viewedByMe);
      if (allViewed) {
        viewedUpdates.push(entry);
      } else {
        recentUpdates.push(entry);
      }
    }
  });

  res.json({
    myStatus,
    recentUpdates,
    viewedUpdates
  });
});

// Create Status
app.post('/api/statuses', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  const { type, content, mediaUrl, background, textColor, caption } = req.body;

  const newStatus = {
    id: `status_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: currentUserId,
    type: type || 'text',
    content: content || '',
    mediaUrl: mediaUrl || null,
    background: background || 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    textColor: textColor || '#ffffff',
    caption: caption || '',
    viewers: [],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
  };

  statuses.unshift(newStatus);

  broadcastToAll({
    type: 'status:new',
    status: newStatus
  });

  res.json({ status: newStatus });
});

// Mark status as viewed
app.post('/api/statuses/:id/view', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'user_raju';
  const { id } = req.params;

  const status = statuses.find(s => s.id === id);
  if (status) {
    status.viewers = status.viewers || [];
    if (!status.viewers.includes(currentUserId)) {
      status.viewers.push(currentUserId);
    }
  }

  res.json({ success: true });
});

// Media Upload Endpoint
app.post('/api/upload', (req, res) => {
  const { data, name, type } = req.body;
  if (!data) return res.status(400).json({ error: 'No data provided' });

  // If base64 data url provided
  if (data.startsWith('data:')) {
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const ext = name ? path.extname(name) : (matches[1].split('/')[1] || 'bin');
      const filename = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext.startsWith('.') ? ext : '.' + ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);
      const buffer = Buffer.from(matches[2], 'base64');
      fs.writeFileSync(filepath, buffer);

      return res.json({
        url: `/uploads/${filename}`,
        fileName: name || filename,
        fileSize: buffer.length,
        fileType: type || matches[1]
      });
    }
  }

  res.json({
    url: data,
    fileName: name || 'file',
    fileSize: data.length,
    fileType: type || 'application/octet-stream'
  });
});

// Reset Demo Data helper
app.post('/api/reset-demo', (req, res) => {
  users = [...initialUsers];
  res.json({ success: true, message: 'Reset completed' });
});

// -------------------------------------------------------------
// Vite Server Middlewares Integration
// -------------------------------------------------------------
async function setupServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ChatX server running on port ${PORT}`);
  });
}

setupServer();

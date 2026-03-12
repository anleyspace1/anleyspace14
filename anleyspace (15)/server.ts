import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import db from "./src/lib/db.js"; // Note: .js extension for ES modules in tsx
import { v4 as uuidv4 } from 'uuid';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.json(user || { error: 'User not found' });
  });

  app.post("/api/user/:id/verify", (req, res) => {
    db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/transactions/:userId", (req, res) => {
    const txs = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC').all(req.params.userId);
    res.json(txs);
  });

  app.get("/api/groups", (req, res) => {
    const groups = db.prepare('SELECT * FROM groups').all();
    res.json(groups);
  });

  app.get("/api/groups/joined/:userId", (req, res) => {
    const groups = db.prepare(`
      SELECT g.* FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
    `).all(req.params.userId);
    res.json(groups);
  });

  app.get("/api/groups/:id", (req, res) => {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    const members = db.prepare(`
      SELECT u.id, u.username, gm.role 
      FROM group_members gm 
      JOIN users u ON gm.user_id = u.id 
      WHERE gm.group_id = ?
    `).all(req.params.id);
    
    res.json({ ...group, members });
  });

  app.post("/api/groups", (req, res) => {
    const { name, description, image, type, creatorId } = req.body;
    const id = uuidv4();
    
    db.prepare('INSERT INTO groups (id, name, description, image, type, creator_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, description, image || `https://picsum.photos/seed/${id}/400/200`, type || 'Public', creatorId);
    
    db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)')
      .run(id, creatorId, 'creator');
      
    res.json({ id, name, description });
  });

  app.post("/api/groups/:id/join", (req, res) => {
    const { userId } = req.body;
    const groupId = req.params.id;
    
    try {
      db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)')
        .run(groupId, userId, 'member');
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: 'Already a member or group not found' });
    }
  });

  app.post("/api/groups/:id/invite", (req, res) => {
    const { username } = req.body;
    const groupId = req.params.id;
    
    const user = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    try {
      db.prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)')
        .run(groupId, user.id, 'member');
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: 'User is already a member' });
    }
  });

  app.post("/api/calls/start", (req, res) => {
    const { hostId, type } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO calls (id, host_id, type) VALUES (?, ?, ?)').run(id, hostId, type);
    res.json({ id, capacity: 20 });
  });

  app.post("/api/calls/:id/upgrade", (req, res) => {
    const { hostId, capacity, cost } = req.body;
    const callId = req.params.id;
    
    const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(hostId);
    if (!user || user.coins < cost) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(cost, hostId);
    db.prepare('UPDATE calls SET capacity = ? WHERE id = ?').run(capacity, callId);
    
    // Record transaction
    db.prepare('INSERT INTO transactions (id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), hostId, 'withdrawal', cost, `Call upgrade to ${capacity} participants`);
      
    res.json({ success: true, newCapacity: capacity });
  });

  app.get("/api/live-calls", (req, res) => {
    const liveCalls = db.prepare(`
      SELECT c.*, u.username as host_username, 
             COALESCE(g.name, u.username || '''s Live Call') as group_name, 
             COALESCE(g.image, 'https://picsum.photos/seed/' || u.id || '/400/200') as group_image
      FROM calls c
      JOIN users u ON c.host_id = u.id
      LEFT JOIN groups g ON u.id = g.creator_id
      WHERE c.is_live = 1 AND c.status = 'active'
      GROUP BY c.id
    `).all();
    res.json(liveCalls);
  });

  app.get("/api/streams", (req, res) => {
    const streams = db.prepare(`
      SELECT s.*, u.username as streamer_username, u.avatar as streamer_avatar
      FROM streams s
      JOIN users u ON s.streamer_id = u.id
      WHERE s.status = 'live'
      ORDER BY s.viewer_count DESC
    `).all();
    
    // If no real streams, return some mock ones for discovery
    if (streams.length === 0) {
      return res.json([
        { id: 's1', viewer_count: 1200, streamer_id: 'u2', streamer_username: 'sarah_j', title: 'Morning Yoga & Meditation', category: 'fitness' },
        { id: 's2', viewer_count: 850, streamer_id: 'u3', streamer_username: 'tech_guru', title: 'Building a SaaS in 24h', category: 'tech' },
        { id: 's3', viewer_count: 3400, streamer_id: 'u4', streamer_username: 'alex_vibe', title: 'Late Night DJ Set 🎧', category: 'music' },
        { id: 's4', viewer_count: 150, streamer_id: 'u5', streamer_username: 'nature_lover', title: 'Exploring the Amazon', category: 'education' },
      ]);
    }
    res.json(streams);
  });

  app.post("/api/calls/:id/go-live", (req, res) => {
    const callId = req.params.id;
    const streamId = uuidv4();
    
    db.prepare('UPDATE calls SET is_live = 1, stream_id = ? WHERE id = ?').run(streamId, callId);
    
    // Create a corresponding stream entry
    const call = db.prepare('SELECT * FROM calls WHERE id = ?').get(callId);
    db.prepare("INSERT INTO streams (id, streamer_id, status) VALUES (?, ?, ?)")
      .run(streamId, call.host_id, 'live');
      
    res.json({ success: true, streamId });
  });

  app.post("/api/calls/:id/request-join", (req, res) => {
    const { userId, amount } = req.body;
    const callId = req.params.id;
    
    const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId);
    if (!user || user.coins < amount) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    
    // Deduct coins
    db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(amount, userId);
    
    const requestId = uuidv4();
    db.prepare('INSERT INTO join_requests (id, call_id, user_id, amount) VALUES (?, ?, ?, ?)')
      .run(requestId, callId, userId, amount);
      
    res.json({ success: true, requestId });
  });

  app.post("/api/calls/:id/respond-join", (req, res) => {
    const { requestId, status } = req.body;
    const callId = req.params.id;
    
    const request = db.prepare('SELECT * FROM join_requests WHERE id = ?').get(requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    db.prepare('UPDATE join_requests SET status = ? WHERE id = ?').run(status, requestId);
    
    if (status === 'accepted') {
      // Add as speaker
      db.prepare('INSERT OR IGNORE INTO call_speakers (call_id, user_id) VALUES (?, ?)').run(callId, request.user_id);
      
      // Revenue split (70% host, 30% platform)
      const call = db.prepare('SELECT host_id FROM calls WHERE id = ?').get(callId);
      const hostPayout = Math.floor(request.amount * 0.7);
      db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(hostPayout, call.host_id);
      
      // Record transaction for host
      db.prepare('INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), call.host_id, hostPayout, 'support', 'Speaker join commission');
    } else if (status === 'declined') {
      // Refund user
      db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(request.amount, request.user_id);
    }
    
    res.json({ success: true });
  });

  app.get("/api/calls/:id/requests", (req, res) => {
    const requests = db.prepare(`
      SELECT jr.*, u.username 
      FROM join_requests jr
      JOIN users u ON jr.user_id = u.id
      WHERE jr.call_id = ? AND jr.status = 'pending'
    `).all(req.params.id);
    res.json(requests);
  });

  app.get("/api/inventory/:userId", (req, res) => {
    const products = db.prepare('SELECT * FROM products WHERE seller_id = ?').all(req.params.userId);
    res.json(products);
  });

  app.post("/api/live-selling/start", (req, res) => {
    const { streamerId, productIds } = req.body;
    const sessionId = uuidv4();
    
    db.prepare('INSERT INTO live_selling_sessions (id, streamer_id) VALUES (?, ?)').run(sessionId, streamerId);
    
    const insertProduct = db.prepare('INSERT INTO live_session_products (session_id, product_id) VALUES (?, ?)');
    for (const pid of productIds) {
      insertProduct.run(sessionId, pid);
    }
    
    res.json({ sessionId });
  });

  app.get("/api/live-selling/:sessionId/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.* FROM products p
      JOIN live_session_products lsp ON p.id = lsp.product_id
      WHERE lsp.session_id = ?
    `).all(req.params.sessionId);
    res.json(products);
  });

  app.post("/api/live-selling/buy", (req, res) => {
    const { buyerId, productId, sessionId, paymentMethod } = req.body;
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product || product.stock <= 0) {
      return res.status(400).json({ error: 'Product out of stock' });
    }

    const buyer = db.prepare('SELECT * FROM users WHERE id = ?').get(buyerId);
    if (!buyer) return res.status(404).json({ error: 'Buyer not found' });

    // Payment validation
    if (paymentMethod === 'coins' && buyer.coins < product.price) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    if (paymentMethod === 'wallet' && buyer.usd_balance < product.price) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    // Process payment
    if (paymentMethod === 'coins') {
      db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(product.price, buyerId);
    } else if (paymentMethod === 'wallet') {
      db.prepare('UPDATE users SET usd_balance = usd_balance - ? WHERE id = ?').run(product.price, buyerId);
    }
    // Card payment simulated as success

    // Update stock
    db.prepare('UPDATE products SET stock = stock - 1 WHERE id = ?').run(productId);

    // Commission split (10% platform, 90% seller)
    const commission = product.price * 0.1;
    const payout = product.price * 0.9;
    
    db.prepare('UPDATE users SET usd_balance = usd_balance + ? WHERE id = ?').run(payout, product.seller_id);

    // Record order
    const orderId = uuidv4();
    db.prepare(`
      INSERT INTO orders (id, buyer_id, seller_id, product_id, session_id, amount, payment_method, platform_commission, seller_payout)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, buyerId, product.seller_id, productId, sessionId, product.price, paymentMethod, commission, payout);

    res.json({ success: true, orderId, newStock: product.stock - 1 });
  });

  app.get("/api/orders/:sellerId", (req, res) => {
    const orders = db.prepare(`
      SELECT o.*, p.title as product_title, u.username as buyer_username
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = ?
      ORDER BY o.created_at DESC
    `).all(req.params.sellerId);
    res.json(orders);
  });

  // Marketplace Endpoints
  app.get("/api/marketplace/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, u.username as seller_username
      FROM products p
      JOIN users u ON p.seller_id = u.id
      ORDER BY p.id DESC
    `).all();
    res.json(products);
  });

  app.get("/api/marketplace/products/:id", (req, res) => {
    const product = db.prepare(`
      SELECT p.*, u.username as seller_username
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);
    
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  });

  app.post("/api/marketplace/products", (req, res) => {
    const { title, price, category, location, image, sellerId } = req.body;
    const id = `p${Date.now()}`;
    db.prepare('INSERT INTO products (id, title, price, category, location, image, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, title, price, category, location, image, sellerId);
    res.json({ id, title, price });
  });

  app.post("/api/marketplace/buy", (req, res) => {
    const { buyerId, productId } = req.body;
    
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product || product.stock <= 0) {
      return res.status(400).json({ error: 'Product out of stock' });
    }

    const buyer = db.prepare('SELECT * FROM users WHERE id = ?').get(buyerId);
    if (!buyer) return res.status(404).json({ error: 'Buyer not found' });

    if (buyer.coins < product.price) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }

    // Process payment
    db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(product.price, buyerId);
    
    // Update stock
    db.prepare('UPDATE products SET stock = stock - 1 WHERE id = ?').run(productId);

    // Commission split (10% platform, 90% seller)
    const commission = product.price * 0.1;
    const payout = product.price * 0.9;
    
    db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(payout, product.seller_id);

    // Record order
    const orderId = uuidv4();
    db.prepare(`
      INSERT INTO orders (id, buyer_id, seller_id, product_id, amount, payment_method, platform_commission, seller_payout)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderId, buyerId, product.seller_id, productId, product.price, 'coins', commission, payout);

    res.json({ success: true, orderId, newStock: product.stock - 1 });
  });

  // Game Sessions State
  const activeGames = new Map<string, any>();
  const socketToRoom = new Map<string, string>();
  const hostSockets = new Set<string>();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_live", (streamId) => {
      socket.join(streamId);
      socketToRoom.set(socket.id, streamId);
      db.prepare('UPDATE streams SET viewer_count = viewer_count + 1 WHERE id = ?').run(streamId);
      console.log(`Socket ${socket.id} joined live stream ${streamId}`);
    });

    socket.on("start_stream", (data) => {
      const { streamId, streamerId, title, category } = data;
      socketToRoom.set(socket.id, streamId);
      hostSockets.add(socket.id);
      db.prepare("INSERT OR REPLACE INTO streams (id, streamer_id, title, category, status, started_at) VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))")
        .run(streamId, streamerId, title || 'Live Stream', category || 'General', 'live');
      console.log(`Stream ${streamId} started by ${streamerId} in category ${category}`);
    });

    socket.on("end_stream", (data) => {
      const { streamId } = data;
      db.prepare("UPDATE streams SET status = ?, ended_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?")
        .run('ended', streamId);
      
      const summary = db.prepare('SELECT * FROM streams WHERE id = ?').get(streamId);
      io.to(streamId).emit("stream_ended", { streamId, summary });
      hostSockets.delete(socket.id);
      console.log(`Stream ${streamId} ended`);
    });

    socket.on("live_selling:purchase", (data) => {
      const { streamId, productId, buyerName, productTitle } = data;
      // Broadcast to everyone in the stream
      io.to(streamId).emit("live_selling:alert", { buyerName, productTitle });
      io.to(streamId).emit("live_selling:stock_update", { productId });
    });

    socket.on("send_comment", (data) => {
      const { streamId, user, text } = data;
      io.to(streamId).emit("call:new_message", { username: user, text });
    });

    socket.on("send_gift", (data) => {
      const { streamId, user, giftName, icon, animation } = data;
      io.to(streamId).emit("call:new_gift", { id: Date.now(), username: user, giftName, icon, animation });
    });

    socket.on("send_reaction", (data) => {
      const { streamId } = data;
      io.to(streamId).emit("call:new_reaction", { streamId });
    });

    // 1) Coin Rain War
    socket.on("start_coin_rain", (data) => {
      const { streamerId, streamId } = data;
      const cost = 50;

      const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(streamerId);
      if (user && user.coins >= cost) {
        db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(cost, streamerId);
        db.prepare('INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
          .run(uuidv4(), streamerId, -cost, 'game_start', 'Started Coin Rain War');

        const gameId = uuidv4();
        const game = {
          id: gameId,
          type: 'coin_rain',
          streamerId,
          scores: new Map(),
          endTime: Date.now() + 30000
        };
        activeGames.set(gameId, game);

        io.to(streamId).emit("game_started", { 
          gameType: 'coin_rain', 
          gameId, 
          duration: 30,
          streamerName: 'Streamer' 
        });

        setTimeout(() => {
          // End game and find winner
          const scores = Array.from(game.scores.entries()).sort((a, b) => b[1] - a[1]);
          const winner = scores[0];
          if (winner) {
            const [winnerId, score] = winner;
            const reward = 100;
            db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(reward, winnerId);
            db.prepare('INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
              .run(uuidv4(), winnerId, reward, 'game_win', 'Won Coin Rain War');

            const winnerUser = db.prepare('SELECT username FROM users WHERE id = ?').get(winnerId);
            io.to(streamId).emit("game_ended", { 
              gameType: 'coin_rain', 
              winner: winnerUser?.username || 'Unknown', 
              reward 
            });
          }
          activeGames.delete(gameId);
        }, 30000);
      } else {
        socket.emit("error", "Insufficient coins to start game");
      }
    });

    socket.on("catch_coin", (data) => {
      const { gameId, userId, streamId } = data;
      const game = activeGames.get(gameId);
      if (game && Date.now() < game.endTime) {
        const currentScore = game.scores.get(userId) || 0;
        game.scores.set(userId, currentScore + 1);
        
        // Broadcast real-time leaderboard
        const leaderboard = Array.from(game.scores.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([uid, score]) => {
            const u = db.prepare('SELECT username FROM users WHERE id = ?').get(uid);
            return { username: u?.username || 'Anonymous', score };
          });
        
        io.to(streamId).emit("leaderboard_update", { gameId, leaderboard });
      }
    });

    // 2) Secret Gift Bomb
    socket.on("start_gift_bomb", (data) => {
      const { streamerId, streamId } = data;
      const gameId = uuidv4();
      const game = {
        id: gameId,
        type: 'gift_bomb',
        streamerId,
        contributions: new Map(),
        target: 500, // Total coins needed to unlock
        current: 0
      };
      activeGames.set(gameId, game);
      io.to(streamId).emit("game_started", { gameType: 'gift_bomb', gameId, target: 500 });
    });

    socket.on("contribute_gift_bomb", (data) => {
      const { gameId, userId, amount, streamId } = data;
      const game = activeGames.get(gameId);
      if (game) {
        const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId);
        if (user && user.coins >= amount) {
          db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(amount, userId);
          db.prepare('INSERT INTO transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
            .run(uuidv4(), userId, -amount, 'gift', 'Contributed to Gift Bomb');

          game.current += amount;
          const userContrib = game.contributions.get(userId) || 0;
          game.contributions.set(userId, userContrib + amount);

          io.to(streamId).emit("gift_bomb_update", { gameId, current: game.current, target: game.target });

          if (game.current >= game.target) {
            const topContributor = Array.from(game.contributions.entries()).sort((a, b) => (b[1] as number) - (a[1] as number))[0] as any;
            if (topContributor) {
              const [winnerId] = topContributor;
              const winnerUser = db.prepare('SELECT username FROM users WHERE id = ?').get(winnerId);
              
              // Prize logic
              const reward = 200;
              db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(reward, winnerId);
              
              io.to(streamId).emit("game_ended", { 
                gameType: 'gift_bomb', 
                winner: winnerUser?.username || 'Unknown', 
                prize: '200 Coins & VIP Badge' 
              });
              activeGames.delete(gameId);
            }
          }
        }
      }
    });

    // 3) Power Duel
    socket.on("start_power_duel", (data) => {
      const { streamerId, streamId, opponentId } = data;
      const gameId = uuidv4();
      const game = {
        id: gameId,
        type: 'power_duel',
        streamerId,
        opponentId,
        streamerScore: 0,
        opponentScore: 0,
        endTime: Date.now() + 15000
      };
      activeGames.set(gameId, game);
      io.to(streamId).emit("game_started", { gameType: 'power_duel', gameId, streamerId, opponentId });

      setTimeout(() => {
        const winnerId = game.streamerScore > game.opponentScore ? game.streamerId : game.opponentId;
        const loserId = winnerId === game.streamerId ? game.opponentId : game.streamerId;
        
        const cost = 30;
        db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(cost, loserId);
        db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').run(cost, winnerId);
        
        const winnerUser = db.prepare('SELECT username FROM users WHERE id = ?').get(winnerId);
        io.to(streamId).emit("game_ended", { gameType: 'power_duel', winner: winnerUser?.username || 'Unknown' });
        activeGames.delete(gameId);
      }, 15000);
    });

    socket.on("duel_tap", (data) => {
      const { gameId, userId, streamId } = data;
      const game = activeGames.get(gameId);
      if (game && Date.now() < game.endTime) {
        if (userId === game.streamerId) game.streamerScore++;
        else if (userId === game.opponentId) game.opponentScore++;
        io.to(streamId).emit("duel_update", { 
          gameId, 
          streamerScore: game.streamerScore, 
          opponentScore: game.opponentScore 
        });
      }
    });

    // 4) Live Kingdom
    const kingdoms = new Map(); // streamId -> { kingdomA: 0, kingdomB: 0 }
    socket.on("start_live_kingdom", (data) => {
      const { streamId } = data;
      kingdoms.set(streamId, { kingdomA: 0, kingdomB: 0 });
      io.to(streamId).emit("game_started", { gameType: 'live_kingdom', gameId: uuidv4() });
    });

    socket.on("kingdom_support", (data) => {
      const { streamId, kingdom, amount, userId } = data;
      const user = db.prepare('SELECT coins FROM users WHERE id = ?').get(userId);
      if (user && user.coins >= amount) {
        db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(amount, userId);
        
        const streamKingdoms = kingdoms.get(streamId) || { kingdomA: 0, kingdomB: 0 };
        streamKingdoms[kingdom] += amount;
        kingdoms.set(streamId, streamKingdoms);

        let dominant = '';
        if (streamKingdoms.kingdomA > streamKingdoms.kingdomB) dominant = 'kingdomA';
        else if (streamKingdoms.kingdomB > streamKingdoms.kingdomA) dominant = 'kingdomB';
        
        io.to(streamId).emit("kingdom_update", { 
          kingdomA: streamKingdoms.kingdomA, 
          kingdomB: streamKingdoms.kingdomB,
          dominant
        });
      }
    });

    // Group Chat Events
    socket.on("join_group", (groupId) => {
      socket.join(`group_${groupId}`);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
      
      // Send message history
      const history = db.prepare('SELECT * FROM group_messages WHERE group_id = ? ORDER BY timestamp ASC LIMIT 50').all(groupId);
      socket.emit("group_history", history);
    });

    socket.on("send_group_message", (data) => {
      const { groupId, userId, username, text, type, audioUrl, imageUrl } = data;
      const messageId = uuidv4();
      const timestamp = new Date().toISOString();

      // Save to DB
      db.prepare('INSERT INTO group_messages (id, group_id, user_id, username, text, timestamp, type, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(messageId, groupId, userId, username, text, timestamp, type || 'text', audioUrl || null, imageUrl || null);

      // Broadcast to group
      io.to(`group_${groupId}`).emit("group_message", {
        id: messageId,
        group_id: groupId,
        user_id: userId,
        username,
        text,
        timestamp,
        type: type || 'text',
        audio_url: audioUrl || null,
        image_url: imageUrl || null
      });
    });

    socket.on("join_direct_chat", (data) => {
      const { userId, targetId } = data;
      const roomId = [userId, targetId].sort().join('_');
      socket.join(`direct_${roomId}`);
      
      // Send message history
      const history = db.prepare('SELECT * FROM direct_messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp ASC LIMIT 50')
        .all(userId, targetId, targetId, userId);
      socket.emit("direct_history", history);
    });

    socket.on("send_direct_message", (data) => {
      const { senderId, receiverId, text, type, audioUrl, imageUrl } = data;
      const messageId = uuidv4();
      const timestamp = new Date().toISOString();
      const roomId = [senderId, receiverId].sort().join('_');

      // Save to DB
      db.prepare('INSERT INTO direct_messages (id, sender_id, receiver_id, text, timestamp, type, audio_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(messageId, senderId, receiverId, text, timestamp, type || 'text', audioUrl || null, imageUrl || null);

      // Broadcast to room
      io.to(`direct_${roomId}`).emit("direct_message", {
        id: messageId,
        sender_id: senderId,
        receiver_id: receiverId,
        text,
        timestamp,
        type: type || 'text',
        audio_url: audioUrl || null,
        image_url: imageUrl || null
      });
    });

    // Call Signaling
    socket.on('call:join', (data) => {
      const { callId, userId, username } = data;
      socket.join(`call:${callId}`);
      socket.to(`call:${callId}`).emit('call:user_joined', { userId, username, socketId: socket.id });
    });

    socket.on('call:signal', (data) => {
      const { to, signal, from } = data;
      io.to(to).emit('call:signal', { signal, from });
    });

    socket.on('call:leave', (data) => {
      const { callId, userId } = data;
      socket.leave(`call:${callId}`);
      socket.to(`call:${callId}`).emit('call:user_left', { userId });
    });

    socket.on('call:go_live', (data) => {
      const { callId, streamId } = data;
      io.to(`call:${callId}`).emit('call:is_live', { streamId });
    });

    socket.on('call:request_join', (data) => {
      const { callId, requestId, userId, username, amount } = data;
      const call = db.prepare('SELECT host_id FROM calls WHERE id = ?').get(callId);
      // Send to host only (or broadcast to call room if host is there)
      io.to(`call:${callId}`).emit('call:new_request', { requestId, userId, username, amount });
    });

    socket.on('call:respond_join', (data) => {
      const { callId, requestId, userId, status } = data;
      io.to(`call:${callId}`).emit('call:request_resolved', { requestId, userId, status });
    });

    // 5) Mystery Spin Storm
    socket.on("start_spin_storm", (data) => {
      const { streamId } = data;
      const gameId = uuidv4();
      io.to(streamId).emit("game_started", { gameType: 'spin_storm', gameId, duration: 10 });
      
      setTimeout(() => {
        // In a real app, we'd track participants. For now, pick a random viewer or just end.
        io.to(streamId).emit("game_ended", { 
          gameType: 'spin_storm', 
          winner: 'Everyone!',
          prize: 'Mystery Box' 
        });
      }, 10000);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      const streamId = socketToRoom.get(socket.id);
      if (streamId) {
        if (hostSockets.has(socket.id)) {
          // End stream if host disconnects
          db.prepare("UPDATE streams SET status = ?, ended_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?")
            .run('ended', streamId);
          const summary = db.prepare('SELECT * FROM streams WHERE id = ?').get(streamId);
          io.to(streamId).emit("stream_ended", { streamId, summary });
          hostSockets.delete(socket.id);
        } else {
          // Decrement viewer count if viewer disconnects
          db.prepare('UPDATE streams SET viewer_count = MAX(0, viewer_count - 1) WHERE id = ?').run(streamId);
        }
        socketToRoom.delete(socket.id);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

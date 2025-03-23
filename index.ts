import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import pool from "./db.ts";

const packageDefinition = protoLoader.loadSync("server/proto/chat.proto");
const chatProto = grpc.loadPackageDefinition(packageDefinition) as any;

const clients: { [channel: string]: grpc.ServerWritableStream<any, any>[] } = {};
const dmClients: { [user: string]: grpc.ServerWritableStream<any, any>[] } = {}; 


const chatService = {
  SendMessage: async (call: any, callback: any) => {
    const { sender, channel, content } = call.request;

    // Save message to database
    await pool.query("INSERT INTO messages (sender, channel, content) VALUES ($1, $2, $3)", [sender, channel, content]);

    // Broadcast message to all users in the channel
    const message = { sender, channel, content, timestamp: new Date().toISOString() };
    if (clients[channel]) {
      clients[channel].forEach(client => client.write(message));
    }

    callback(null, message);
    

  },

  JoinChannel: async (call: any) => {
    const { username, channel } = call.request;

    const res = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    let userId = res.rows.length > 0 ? res.rows[0].id : null;

    if (!userId) {
      console.log("User not found")
      throw Error("Ouch")
    }

    await pool.query("INSERT INTO user_channels (user_id, channel) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, channel]);

    if (!clients[channel]) {
      clients[channel] = [];
    }
    clients[channel].push(call);

    call.on("cancelled", () => {
      clients[channel] = clients[channel].filter(client => client !== call);
    });
  },

  LoginUser: async (call: any) => {
    const { username } = call.request;
    const res = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    let userId = res.rows.length > 0 ? res.rows[0].id : null;

    if (!userId) {
      const result = await pool.query("INSERT INTO users (username) VALUES ($1) RETURNING id", [username]);
      userId = result.rows[0].id;
    }
    if (!dmClients[username]) {
      dmClients[username] = [];
    }
    dmClients[username].push(call);

    call.on("cancelled", () => {
      dmClients[username] = dmClients[username].filter(client => client !== call);
    });

  }, 

  LeaveChannel: async (call: any) => {
    const { username, channel } = call.request;

    // Get user ID
    const res = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
    const userId = res.rows[0]?.id;

    if (userId) {
      // Remove user from the user_channels table
      await pool.query("DELETE FROM user_channels WHERE user_id = $1 AND channel = $2", [userId, channel]);

      // Remove the user from the clients list
      if (clients[channel]) {
        clients[channel] = clients[channel].filter(client => client !== call);
        call.write({ message: `You have left the channel ${channel}` });
      }
    } else {
      call.write({ message: "User not found" });
    }
  },

  SendDirectMessage: async (call: any) => {
    // Handle receiving a direct message (DM)
    const { sender, receiver, content } = call.request;

    if (!dmClients[receiver]) {
      dmClients[receiver] = [];
    }

    // Save the DM to the database
    const senderRes = await pool.query("SELECT id FROM users WHERE username = $1", [sender]);
    const receiverRes = await pool.query("SELECT id FROM users WHERE username = $1", [receiver]);

    if (senderRes.rows.length === 0 || receiverRes.rows.length === 0) {
      return call.write({ message: "User not found" });
    }

    const senderId = senderRes.rows[0].id;
    const receiverId = receiverRes.rows[0].id;

    await pool.query("INSERT INTO direct_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)", [senderId, receiverId, content]);

    const dmMessage = { sender, receiver, content, timestamp: new Date().toISOString() };
    dmClients[receiver].forEach(client => client.write(dmMessage));

    call.write({ message: "DM sent" });
  }
};

const server = new grpc.Server();
server.addService(chatProto.ChatService.service, chatService);
server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
  console.log("Server running on port 50051");
});
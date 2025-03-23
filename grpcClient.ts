import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const packageDefinition = protoLoader.loadSync("./server/proto/chat.proto");
const chatProto =  grpc.loadPackageDefinition(packageDefinition) as any;

const client = new chatProto.ChatService("localhost:50051", grpc.credentials.createInsecure());

export const joinChannel = (username: string, channel: string, callback: (error: any, response: any) => void) => {
  client.JoinChannel({ username, channel }, callback);
};

export const leaveChannel = (username: string, channel: string, callback: (error: any, response: any) => void) => {
    client.LeaveChannel({ username, channel }, callback);
  };

export const sendMessage = (username: string, channel: string, message: string, callback: (error: any, response: any) => void) => {
  client.SendMessage({ sender: username, channel, content: message }, callback);
};

export const sendDirectMessage = (username: string, receiver: string, message: string, callback: (error: any, response: any) => void) => {
  client.SendDirectMessage({ sender: username, receiver, content: message }, callback);
};

export const loginUser = (username: string, callback: (error: any, response: any) => void) => {
  client.LoginUser({ username }, callback);
};

export const listenForMessages = (username: string, channel: string, onMessage: (message: any) => void) => {
  const stream = client.JoinChannel({ username, channel });

  stream.on("data", onMessage);
  stream.on("error", (error: any) => {
    console.error("Error receiving messages:", error);
  });
};

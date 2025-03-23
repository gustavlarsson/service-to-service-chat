import readline from "readline";
import { joinChannel, sendMessage, listenForMessages, loginUser, leaveChannel, sendDirectMessage } from "./grpcClient.ts";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let username: string;
let channel: string;

const promptUser = () => {
  rl.question("Enter your username: ", (userInput: string) => {
    username = userInput;
    // Should await result
    loginUser(username, (error: any, response: any) => {
        if (error) {
          console.error("Error when trying to login:", error);
          return;
        }
      });

    // Lazy await
      setTimeout( () => {
        listenForMessages(username, username, (message: any) => {
            const { sender, content, timestamp } = message;
            console.log(`[${timestamp}] ${sender}: ${content}`);
        });
        }, 1000)
    console.log(`Logged in as ${username}. \n Use /join <channel-name> to join channels and then /leave to leave the channel. \n Use /dm <username> <message> to dm a user` );

      rl.on("line", (input: string) => {
        if (input.startsWith("/join")) {
          const newChannel = input.split(" ")[1];
          if (newChannel) {
            channel = newChannel;
            joinChannel(username, channel, (error: any, response: any) => {
              if (error) {
                console.error("Error joining new channel:", error);
                return;
              }
                console.log(`Joined new channel ${newChannel}`);
            });
            listenForMessages(username, channel, (message: any) => {
                const { sender, content, timestamp } = message;
                console.log(`[${timestamp}] ${sender}: ${content}`);
            });
          } else {
            console.log("Please specify a channel name to join.");
          }
        } else if (input === "/leave") {
          leaveChannel(username, channel, (error: any, response: any) => {
            if (error) {
              console.error("Error leaving channel:", error);
              return;
            }
            console.log(`You have left the channel ${channel}`);
            channel = ""; // Clear the current channel
          });
        } else if (input.startsWith("/dm")) {
            const parts = input.split(" ");
            const dmUser = parts[1];
            const dmMessage = parts.slice(2).join(" ");
  
            sendDirectMessage(username, dmUser, dmMessage, (error: any, response: any) => {
              if (error) {
                console.error("Error sending DM:", error);
                return;
              }
              console.log(`DM to ${dmUser}: ${dmMessage}`);
            });
          } else if (input.startsWith("/send")){
          const message = input.split(" ")[1];
          sendMessage(username, channel, message, (error: any, response: any) => {
            if (error) {
              console.error("Error sending message:", error);
              return;
            }
          });
        }
    });
  })
};

promptUser();


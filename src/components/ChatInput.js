import React, { useState } from "react";
import styled from "styled-components";
import Button from "@mui/material/Button";
import { auth, db }  from "../firebase";
import firebase from "firebase";
import { useAuthState } from "react-firebase-hooks/auth";

function ChatInput({channelName, channelId, chatRef}) {
    const [input, setInput] = useState('');
    const [user] = useAuthState(auth);

    const sendMessage = async (e) => {
        e.preventDefault(); // prevents refresh

        if (!channelId || !input.trim() || !user) {
            return false;
        }

        try {
            await db.collection('rooms').doc(channelId).collection('messages').add({
                message: input.trim(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                user: user.displayName || user.email?.split('@')[0] || "User",
                userImage: user.photoURL || "",
                userId: user.uid,
            });

            if (chatRef && chatRef.current) {
                chatRef.current.scrollIntoView({
                    behavior: "smooth",
                });
            }

            setInput("");
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message: " + error.message);
        }
    };
    
    return (
        <ChatInputContainer>
            <form onSubmit={sendMessage}>
                <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder={`Message #${channelName || "channel"}`}
                />
                <Button hidden type="submit">
                    SEND
                </Button>
            </form>
        </ChatInputContainer>
    );
}

export default ChatInput;

const ChatInputContainer = styled.div`
    flex-shrink: 0;
    padding: 12px 20px 20px;
    background-color: #ffffff;
    border-top: 1px solid #e8e8e8;

    > form {
        position: relative;
        display: flex;
        justify-content: center;
    }

    > form > input {
        width: 100%;
        border: 1px solid #d0d0d0;
        border-radius: 8px;
        padding: 14px 18px;
        font-size: 14px;
        outline: none;
    }

    > form > input:focus {
        border-color: #3f0e40;
        box-shadow: 0 0 0 2px rgba(63, 14, 64, 0.1);
    }

    > form > button {
        display: none !important;
    }
`;

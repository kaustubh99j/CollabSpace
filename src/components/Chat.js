import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ChatInput from './ChatInput';
import { db, auth } from "../firebase";
import firebase from "firebase";
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectRoomId } from '../features/appSlice';
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Message from './Message';
import Spinner from 'react-spinkit';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function Chat() {
  const chatRef = useRef(null);
  const messagesRef = useRef(null);
  const { id: routeRoomId } = useParams();
  const selectedRoomId = useSelector(selectRoomId);
  // The URL is the source of truth so refreshing a channel keeps it open.
  const roomId = routeRoomId || selectedRoomId;
  const [user] = useAuthState(auth);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  // Fetch current room doc
  const [roomDetails, roomLoading, roomError] = useDocument(
    roomId && user ? db.collection('rooms').doc(roomId) : null
  );

  const roomData = roomDetails?.data();
  const members = roomData?.members || [];
  const createdBy = roomData?.createdBy;
  const isAuthorized = Boolean(user && members.includes(user.uid));

  // Fetch messages strictly when authorized
  const [roomMessages, messagesLoading] = useCollection(
    roomId && isAuthorized ?
      db
        .collection('rooms')
        .doc(roomId)
        .collection('messages')
        .orderBy('timestamp', "asc")
      : null
  );

  // Fetch all registered workspace users to allow inviting
  const [usersSnapshot] = useCollection(
    membersDialogOpen && user ? db.collection('users') : null
  );

  const allUsers = usersSnapshot?.docs.map(doc => ({
    id: doc.id,
    uid: doc.id,
    displayName: doc.data().displayName || doc.data().name || 'Workspace User',
    email: doc.data().email || '',
    photoURL: doc.data().photoURL || ''
  })) || [];

  const currentMembersList = allUsers.filter(u => members.includes(u.id));
  const nonMembersList = allUsers.filter(u => 
    !members.includes(u.id) && 
    (u.displayName.toLowerCase().includes(memberSearchTerm.toLowerCase()) || 
     u.email.toLowerCase().includes(memberSearchTerm.toLowerCase()))
  );

  useEffect(() => {
    const messagesContainer = messagesRef.current;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [roomId, messagesLoading, roomMessages]);

  const handleInviteUser = async (targetUserId) => {
    if (!roomId || !targetUserId) return;
    try {
      await db.collection('rooms').doc(roomId).update({
        members: firebase.firestore.FieldValue.arrayUnion(targetUserId)
      });
    } catch (err) {
      console.error("Error inviting user to channel:", err);
      alert("Failed to invite member: " + err.message);
    }
  };

  const handleRemoveUser = async (targetUserId) => {
    if (!roomId || !targetUserId) return;
    if (targetUserId === createdBy) {
      alert("Cannot remove the channel creator.");
      return;
    }
    try {
      await db.collection('rooms').doc(roomId).update({
        members: firebase.firestore.FieldValue.arrayRemove(targetUserId)
      });
    } catch (err) {
      console.error("Error removing user from channel:", err);
      alert("Failed to remove member: " + err.message);
    }
  };

  if (!roomId) {
    return (
      <ChatContainer>
        <EmptyStateContainer>
          <h2>Select a channel</h2>
          <p>Choose a channel from the sidebar to start collaborating.</p>
        </EmptyStateContainer>
      </ChatContainer>
    );
  }

  if (roomLoading) {
    return (
      <ChatContainer>
        <LoadingBox>
          <Spinner name="three-bounce" color="#3f0e40" />
          <p>Verifying access permissions and loading channel...</p>
        </LoadingBox>
      </ChatContainer>
    );
  }

  if (roomError || (roomDetails && !isAuthorized)) {
    return (
      <ChatContainer>
        <Header>
          <HeaderLeft>
            <h4><strong>#restricted-channel</strong></h4>
          </HeaderLeft>
        </Header>
        <AccessDeniedBox>
          <LockIcon style={{ fontSize: 44, color: '#c62828', marginBottom: 12 }} />
          <h3>Access Denied</h3>
          <p>
            You are not a member of this channel. In accordance with user-specific data isolation policies, 
            only explicitly invited members can read or post messages.
          </p>
          <p style={{ marginTop: 8, fontSize: 13, color: '#777' }}>
            Please contact the channel owner to request an invite.
          </p>
        </AccessDeniedBox>
      </ChatContainer>
    );
  }

  return (
    <ChatContainer>
      {roomDetails && isAuthorized && (
        <>
          <Header>
            <HeaderLeft>
              <h4><strong>#{roomData?.name}</strong></h4>
              <StarBorderOutlinedIcon />
              <ChannelBadge>
                <LockIcon style={{ fontSize: 13, marginRight: 4 }} />
                Private Channel
              </ChannelBadge>
            </HeaderLeft>

            <HeaderRight>
              <MemberPill onClick={() => setMembersDialogOpen(true)}>
                <GroupIcon style={{ fontSize: 16, marginRight: 6 }} />
                <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
              </MemberPill>
              <InviteButton onClick={() => setMembersDialogOpen(true)}>
                <PersonAddIcon style={{ fontSize: 16, marginRight: 4 }} />
                Invite
              </InviteButton>
            </HeaderRight>
          </Header>

          <ChatMessages ref={messagesRef}>
            {roomMessages?.docs.map(doc => {
              const { message, timestamp, user: authorName, userImage } = doc.data();

              return (
                <Message
                  key={doc.id}
                  message={message}
                  timestamp={timestamp}
                  user={authorName}
                  userImage={userImage}
                />
              );
            })}
            <ChatBottom ref={chatRef} />
          </ChatMessages>

          <ChatInput
            chatRef={chatRef}
            channelName={roomData?.name}
            channelId={roomId}
          />

          {/* Member Management & Access Control Dialog */}
          <Dialog
            open={membersDialogOpen}
            onClose={() => setMembersDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 18 }}>Manage Access: #{roomData?.name}</span>
                <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0 0' }}>
                  Control who can view, read, and send messages in this channel
                </p>
              </div>
              <IconButton size="small" onClick={() => setMembersDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers style={{ padding: '16px 24px' }}>
              <SectionTitle>Current Members ({members.length})</SectionTitle>
              <MembersList>
                {currentMembersList.length > 0 ? (
                  currentMembersList.map(member => (
                    <MemberItem key={member.id}>
                      <Avatar src={member.photoURL} alt={member.displayName} style={{ width: 34, height: 34, marginRight: 12 }} />
                      <MemberDetails>
                        <MemberName>
                          {member.displayName} {member.id === user?.uid && "(You)"}
                        </MemberName>
                        <MemberEmail>{member.email}</MemberEmail>
                      </MemberDetails>
                      <MemberRole>
                        {member.id === createdBy ? (
                          <Chip label="Creator" size="small" color="primary" variant="outlined" />
                        ) : (
                          <Chip label="Member" size="small" variant="outlined" />
                        )}
                        {/* Creator can remove other members */}
                        {user?.uid === createdBy && member.id !== user?.uid && (
                          <IconButton 
                            size="small" 
                            color="error" 
                            title="Remove member"
                            onClick={() => handleRemoveUser(member.id)}
                            style={{ marginLeft: 6 }}
                          >
                            <PersonRemoveIcon fontSize="small" />
                          </IconButton>
                        )}
                      </MemberRole>
                    </MemberItem>
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: '#888' }}>
                    {members.includes(user?.uid) ? `${user?.displayName} (You)` : 'Loading members...'}
                  </p>
                )}
              </MembersList>

              <SectionTitle style={{ marginTop: 24 }}>Invite Workspace Members</SectionTitle>
              <TextField
                fullWidth
                size="small"
                placeholder="Search teammates by name or email..."
                value={memberSearchTerm}
                onChange={e => setMemberSearchTerm(e.target.value)}
                style={{ marginBottom: 12 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <NonMembersList>
                {nonMembersList.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: '16px 0' }}>
                    {allUsers.length <= members.length 
                      ? "All workspace members already have access to this channel." 
                      : "No other workspace members match your search."}
                  </p>
                ) : (
                  nonMembersList.map(u => (
                    <MemberItem key={u.id}>
                      <Avatar src={u.photoURL} alt={u.displayName} style={{ width: 34, height: 34, marginRight: 12 }} />
                      <MemberDetails>
                        <MemberName>{u.displayName}</MemberName>
                        <MemberEmail>{u.email}</MemberEmail>
                      </MemberDetails>
                      <Button
                        size="small"
                        variant="contained"
                        style={{ backgroundColor: '#3f0e40', color: 'white', textTransform: 'none' }}
                        onClick={() => handleInviteUser(u.id)}
                      >
                        Grant Access
                      </Button>
                    </MemberItem>
                  ))
                )}
              </NonMembersList>
            </DialogContent>

            <DialogActions style={{ padding: '12px 24px' }}>
              <Button onClick={() => setMembersDialogOpen(false)} color="inherit">
                Done
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </ChatContainer>
  );
}

export default Chat;

const ChatBottom = styled.div`
  padding-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #ffffff;
  z-index: 1;
`;

const ChatMessages = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;

  > h4 {
    display: flex;
    text-transform: lowercase;
    margin-right: 10px;
    font-size: 16px;
    font-weight: 700;
  }
  > h4 > .MuiSvgIcon-root {
    margin-left: 10px;
    font-size: 18px;
  }
`;

const ChannelBadge = styled.span`
  display: inline-flex;
  align-items: center;
  background-color: #f0f0f0;
  color: #555;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 10px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MemberPill = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 10px;
  background-color: #f4ede4;
  color: #3f0e40;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #ebe2d6;
  }
`;

const InviteButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #3f0e40;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
`;

const AccessDeniedBox = styled.div`
  padding: 40px;
  text-align: center;
  background-color: #fff0f0;
  border: 1px solid #ffd0d0;
  border-radius: 8px;
  margin: 30px;
  color: #c62828;

  > h3 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  > p {
    font-size: 14px;
    color: #555;
    max-width: 500px;
    margin: 0 auto;
  }
`;

const LoadingBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;

  > p {
    margin-top: 16px;
    font-size: 14px;
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
  padding: 20px;

  > h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1d1c1d;
    margin-bottom: 8px;
  }

  > p {
    font-size: 15px;
    color: #616061;
    max-width: 450px;
    margin-bottom: 20px;
  }
`;

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: #1d1c1d;
  margin-bottom: 10px;
`;

const MembersList = styled.div`
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: 8px;
`;

const NonMembersList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const MemberDetails = styled.div`
  flex: 1;
`;

const MemberName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1d1c1d;
`;

const MemberEmail = styled.div`
  font-size: 12px;
  color: #616061;
`;

const MemberRole = styled.div`
  display: flex;
  align-items: center;
`;

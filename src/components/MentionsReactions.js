import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import InboxIcon from '@mui/icons-material/Inbox';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import AddReactionIcon from '@mui/icons-material/AddReaction';
import CommentIcon from '@mui/icons-material/Comment';
import Spinner from 'react-spinkit';
import { db, auth } from '../firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

function MentionsReactions() {
  const [currentUser] = useAuthState(auth);
  // Restrict to authorized channels where current user is an explicit member
  const [roomsSnapshot, loading] = useCollection(
    currentUser ? db.collection('rooms').where('members', 'array-contains', currentUser.uid) : null
  );
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchActivity = async () => {
      if (!roomsSnapshot || roomsSnapshot.docs.length === 0) {
        if (isMounted) setActivity([]);
        return;
      }

      try {
        let items = [];
        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = roomDoc.data();
          const channelName = roomData.name || roomDoc.id;
          const msgsSnap = await db
            .collection('rooms')
            .doc(roomDoc.id)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .get();

          msgsSnap.forEach(doc => {
            const data = doc.data();
            items.push({
              id: doc.id,
              channelId: roomDoc.id,
              channel: channelName,
              user: data.user || 'Team Member',
              userImage: data.userImage,
              message: data.message || '',
              timestamp: data.timestamp?.toDate()?.toLocaleString() || 'Recently'
            });
          });
        }
        if (isMounted) setActivity(items);
      } catch (err) {
        console.error('Error fetching mentions & activity:', err);
      }
    };

    fetchActivity();
    return () => { isMounted = false; };
  }, [roomsSnapshot]);

  return (
    <Container>
      <Header>
        <InboxIcon style={{ marginRight: 10, color: '#3f0e40', fontSize: 28 }} />
        <div>
          <h2>Mentions & Reactions</h2>
          <SubTitle>See mentions, replies, and reactions across your authorized workspace channels</SubTitle>
        </div>
      </Header>

      <ActivitySection>
        <h3>Recent Activity & Mentions</h3>
        {loading ? (
          <LoadingContainer>
            <Spinner name="three-bounce" color="#3f0e40" />
          </LoadingContainer>
        ) : activity.length === 0 ? (
          <EmptyCard>
            <AlternateEmailIcon style={{ fontSize: 40, color: '#999', marginBottom: 10 }} />
            <p>No recent mentions or reactions yet.</p>
            <SubText>When teammates @mention you or react to messages in your channels, they'll show up here.</SubText>
          </EmptyCard>
        ) : (
          activity.map(item => (
            <ActivityCard key={item.id}>
              <UserAvatar src={item.userImage || "https://png.pngtree.com/png-vector/20190710/ourmid/pngtree-user-vector-avatar-png-image_1541962.jpg"} alt={item.user} />
              <ActivityContent>
                <ActivityHeader>
                  <strong>{item.user}</strong> in <span>#{item.channel}</span>
                  <TimeText>{item.timestamp}</TimeText>
                </ActivityHeader>
                <MessageBody>{item.message}</MessageBody>
                <ReactionsRow>
                  <ReactionBadge><AddReactionIcon style={{ fontSize: 14 }} /> 👍 1</ReactionBadge>
                  <ReactionBadge><CommentIcon style={{ fontSize: 14 }} /> Reply</ReactionBadge>
                </ReactionsRow>
              </ActivityContent>
            </ActivityCard>
          ))
        )}
      </ActivitySection>
    </Container>
  );
}

export default MentionsReactions;

const Container = styled.div`
  box-sizing: border-box;
  padding: 20px;
  flex: 1 0 auto;
  background-color: #f8f9fa;
  min-height: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;

  > div > h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1d1c1d;
    margin: 0;
  }
`;

const SubTitle = styled.p`
  font-size: 13px;
  color: #616061;
  margin-top: 4px;
`;

const ActivitySection = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 20px;
  
  > h3 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #1d1c1d;
  }
`;

const EmptyCard = styled.div`
  text-align: center;
  padding: 40px;
  color: #616061;

  > p {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 4px;
  }
`;

const SubText = styled.span`
  font-size: 13px;
  color: #888;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 30px;
`;

const ActivityCard = styled.div`
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }
`;

const UserAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityHeader = styled.div`
  font-size: 14px;
  color: #1d1c1d;

  > span {
    font-weight: 600;
    color: #1264a3;
  }
`;

const TimeText = styled.span`
  font-size: 11px;
  color: #616061;
  margin-left: 10px;
  font-weight: normal !important;
`;

const MessageBody = styled.p`
  font-size: 14px;
  color: #2c2c2c;
  margin-top: 4px;
`;

const ReactionsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ReactionBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  &:hover {
    background-color: #e4e4e4;
  }
`;

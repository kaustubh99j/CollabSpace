import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import TagIcon from "@mui/icons-material/Tag";
import ForumIcon from "@mui/icons-material/Forum";
import { auth, db } from "../firebase";
import { enterRoom } from "../features/appSlice";

const toDate = value => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return null;
};

const formatLastSeen = date => {
  if (!date) return "";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function ChannelActivityList({ limit, emptyMessage }) {
  const dispatch = useDispatch();
  const history = useHistory();
  const [user] = useAuthState(auth);
  const [lastMessages, setLastMessages] = useState({});

  // Only channels the signed-in user is explicitly a member of.
  const [roomsSnapshot, roomsLoading] = useCollection(
    user
      ? db.collection("rooms").where("members", "array-contains", user.uid)
      : null
  );

  const channels = useMemo(
    () =>
      roomsSnapshot?.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.id,
      })) || [],
    [roomsSnapshot]
  );

  // Keep a live "last message" listener for each accessible channel.
  useEffect(() => {
    if (!roomsSnapshot) return undefined;

    const unsubscribes = roomsSnapshot.docs.map(roomDoc =>
      db
        .collection("rooms")
        .doc(roomDoc.id)
        .collection("messages")
        .orderBy("timestamp", "desc")
        .limit(1)
        .onSnapshot(
          snapshot => {
            const lastDoc = snapshot.docs[0];
            setLastMessages(prev => ({
              ...prev,
              [roomDoc.id]: lastDoc ? { id: lastDoc.id, ...lastDoc.data() } : null,
            }));
          },
          error => {
            console.error(`Error fetching last message for ${roomDoc.id}:`, error);
            setLastMessages(prev => ({ ...prev, [roomDoc.id]: null }));
          }
        )
    );

    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [roomsSnapshot]);

  const channelActivity = useMemo(() => {
    return channels
      .map(channel => {
        const hasLoaded = Object.prototype.hasOwnProperty.call(
          lastMessages,
          channel.id
        );
        const last = lastMessages[channel.id];
        return {
          ...channel,
          hasLoaded,
          last,
          lastTimestamp: toDate(last?.timestamp),
        };
      })
      .sort((a, b) => {
        if (a.lastTimestamp && b.lastTimestamp) {
          return b.lastTimestamp.getTime() - a.lastTimestamp.getTime();
        }
        if (a.lastTimestamp) return -1;
        if (b.lastTimestamp) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [channels, lastMessages]);

  const visibleChannels = limit ? channelActivity.slice(0, limit) : channelActivity;

  const openChannel = id => {
    dispatch(enterRoom({ roomId: id }));
    history.push(`/room/${id}`);
  };

  if (roomsLoading) {
    return (
      <ListShell>
        <StatusRow>Loading your channels…</StatusRow>
      </ListShell>
    );
  }

  if (visibleChannels.length === 0) {
    return (
      <EmptyState>
        <EmptyIcon>
          <ForumIcon style={{ fontSize: 30 }} />
        </EmptyIcon>
        <h3>No channels yet</h3>
        <p>
          {emptyMessage ||
            "Create a channel or browse the channels you have access to."}
        </p>
        <EmptyAction onClick={() => history.push("/channel-browser")}>
          <TagIcon fontSize="small" />
          Browse or create a channel
        </EmptyAction>
      </EmptyState>
    );
  }

  return (
    <ListShell>
      {visibleChannels.map(channel => {
        const lastMessage = channel.last?.message;
        const author = channel.last?.user;

        return (
          <ActivityRow
            key={channel.id}
            onClick={() => openChannel(channel.id)}
            type="button"
          >
            <ChannelGlyph>#</ChannelGlyph>
            <RowBody>
              <RowTop>
                <ChannelName>#{channel.name}</ChannelName>
                <LastSeen>{formatLastSeen(channel.lastTimestamp)}</LastSeen>
              </RowTop>
              <Preview>
                {!channel.hasLoaded ? (
                  "Loading latest message…"
                ) : lastMessage ? (
                  <>
                    {author && <PreviewAuthor>{author}: </PreviewAuthor>}
                    {lastMessage}
                  </>
                ) : (
                  "No messages yet — start the conversation"
                )}
              </Preview>
            </RowBody>
          </ActivityRow>
        );
      })}
    </ListShell>
  );
}

export default ChannelActivityList;

const ListShell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ActivityRow = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  font: inherit;
  color: inherit;
  background-color: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease,
    transform 0.15s ease;

  &:hover {
    border-color: #3f0e40;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
    transform: translateY(-1px);
  }
`;

const ChannelGlyph = styled.div`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: #f4ede4;
  color: #3f0e40;
  font-size: 18px;
  font-weight: 700;
`;

const RowBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const RowTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const ChannelName = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: #1d1c1d;
`;

const LastSeen = styled.span`
  flex-shrink: 0;
  font-size: 11px;
  color: #868686;
  white-space: nowrap;
`;

const Preview = styled.p`
  margin-top: 3px;
  overflow: hidden;
  font-size: 13px;
  color: #616061;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PreviewAuthor = styled.span`
  color: #3f0e40;
  font-weight: 600;
`;

const StatusRow = styled.div`
  padding: 30px 16px;
  text-align: center;
  font-size: 13px;
  color: #868686;
`;

const EmptyState = styled.div`
  padding: 40px 24px;
  text-align: center;
  background-color: #ffffff;
  border: 1px dashed #d9d9d9;
  border-radius: 10px;

  > h3 {
    margin-top: 12px;
    font-size: 16px;
    font-weight: 700;
    color: #1d1c1d;
  }

  > p {
    max-width: 420px;
    margin: 6px auto 16px;
    font-size: 13px;
    color: #616061;
  }
`;

const EmptyIcon = styled.div`
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #f4ede4;
  color: #3f0e40;
`;

const EmptyAction = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background-color: #3f0e40;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

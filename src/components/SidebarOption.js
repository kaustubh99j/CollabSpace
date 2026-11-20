import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { useAuthState } from "react-firebase-hooks/auth";
import firebase from "firebase";
import { auth, db } from "../firebase";
import { enterRoom } from "../features/appSlice";
import { useHistory } from "react-router-dom";

function SidebarOption({Icon, title, addChannelOption, id}) {
  
  const dispatch = useDispatch(); 
  const history = useHistory();
  const [user] = useAuthState(auth);

  const addChannel = async () => {
    if (!user) return;
    const channelName = prompt("Please enter the channel name: ");

    if (channelName && channelName.trim()) {
      try {
        const docRef = await db.collection('rooms').add({
          name: channelName.trim(),
          members: [user.uid],
          createdBy: user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        dispatch(enterRoom({ roomId: docRef.id }));
        history.push(`/room/${docRef.id}`);
      } catch (err) {
        console.error("Error creating channel:", err);
        alert("Failed to create channel: " + err.message);
      }
    }
  };

  const selectChannel = () => {
    if (addChannelOption) {
      addChannel();
    } else if (title === "Saved items") {
      history.push("/saved-items");
    } else if (title === "Threads") {
      history.push("/threads");
    } else if (title === "Tasks") {
      history.push("/tasks");
    } else if (title === "File Browser") {
      history.push("/files");
    } else if (title === "Mentions & Reactions") {
      history.push("/mentions");
    } else if (title === "Channel browser") {
      history.push("/channel-browser");
    } else if (title === "People & User Groups") {
      history.push("/people-groups");
    } else if (id) {
      dispatch(
        enterRoom({
          roomId: id,
        })
      );
      history.push(`/room/${id}`);
    }
  };
  
  return( 
    <SidebarOptionContainer
      onClick={addChannelOption ? addChannel : selectChannel}
    >
      {Icon && <Icon fontSize="small" style={{padding: 10}} />}
      {Icon ? (
        <h3>{title}</h3>
      ): (
        <SidebarOptionChannel>
          <span>#</span> {title}
        </SidebarOptionChannel>
      )}
    </SidebarOptionContainer>
  );
}

export default SidebarOption;

const SidebarOptionContainer = styled.div`
  display: flex;
  align-items: center;
  padding-left: 2px;
  font-size: 12px;
  cursor: pointer;

  :hover{
    opacity: 0.9;
    background-color: #340e36;
  }

  > h3 {
    font-weight: 500;
  }

  > h3 > span {
    padding: 15px;
  }
`;

const SidebarOptionChannel = styled.h3`
  padding: 10px 0;
  font-weight: 300;

  :hover{
    opacity: 0.9;
    background-color: #340e36;
  }
`;

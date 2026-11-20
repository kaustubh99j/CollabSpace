import React, { useEffect, useState } from "react";
import styled from "styled-components";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CreateIcon from '@mui/icons-material/Create';
import SidebarOption from "./SidebarOption";
import InsertCommentIcon from '@mui/icons-material/InsertComment';
import InboxIcon from '@mui/icons-material/Inbox';
import DraftsIcon from '@mui/icons-material/Drafts';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { db, auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useHistory } from "react-router-dom";

function Sidebar() {
  const [channels, setChannels] = useState([]);
  const [user] = useAuthState(auth);
  const [showLess, setShowLess] = useState(false);
  const history = useHistory();

  useEffect(() => {
    if (!user) return;
    // Query ONLY channels where the authenticated user is an explicit member
    const unsubscribe = db
      .collection("rooms")
      .where("members", "array-contains", user.uid)
      .onSnapshot(
        snapshot => {
          setChannels(
            snapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.data().name,
              members: doc.data().members || [],
              createdBy: doc.data().createdBy
            }))
          );
        },
        error => {
          console.error("Error fetching authorized channels:", error);
        }
      );

    return () => unsubscribe();
  }, [user]);

  return (
    <SidebarContainer>
      <SidebarHeader>
        <SideBarInfo
          onClick={() => history.push("/")}
          title="Go to home"
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              history.push("/");
            }
          }}
        >
          <h2>CollabSpace HQ</h2>
          <h3>
            <FiberManualRecordIcon />
            {user?.displayName}
          </h3>
        </SideBarInfo>
        <CreateIcon />
      </SidebarHeader>      

      <SidebarOption Icon={InsertCommentIcon} title="Threads" />
      <SidebarOption Icon={InboxIcon} title="Mentions & Reactions" />
      <SidebarOption Icon={DraftsIcon} title="Saved items" />

      {!showLess && (
        <>
          <SidebarOption Icon={BookmarkBorderIcon} title="Channel browser" />
          <SidebarOption Icon={PeopleAltIcon} title="People & User Groups" />
          <SidebarOption Icon={FileCopyIcon} title="File Browser" />
          <SidebarOption Icon={BookmarkBorderIcon} title="Tasks" />
        </>
      )}

      <div onClick={() => setShowLess(!showLess)}>
        <SidebarOption 
          Icon={showLess ? ExpandMoreIcon : ExpandLessIcon} 
          title={showLess ? "Show More" : "Show Less"} 
        />
      </div>
      
      <hr />

      {/* Add Channel button first */}
      <SidebarOption Icon={AddIcon} addChannelOption title="Add Channel" />
      <hr />

      {/* Dynamically render channels below Add Channel */}
      {channels.map(channel => (
        <SidebarOption key={channel.id} id={channel.id} title={channel.name} />
      ))}

    </SidebarContainer>
  );
}

export default Sidebar;

// Styled components
const SidebarContainer = styled.div`
  background-color: var(--slack-color);
  color: white;
  flex: 0.3;
  border-top: 1px solid #49274b;
  max-width: 260px;
  height: 100%;
  overflow-y: auto;

  >hr{
    margin-top:10px;
    margin-bottom: 10px;
    border: 1px solid #49274b;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #49274b;
  padding-bottom: 10px;
  padding: 13px;

  >.MuiSvgIcon-root {
    padding: 8px;
    color: #49274b;
    font-size: 18px;
    background-color: white;
    border-radius: 999px;
  }
`;

const SideBarInfo = styled.div`
  flex: 1;
  cursor: pointer;
  border-radius: 6px;

  &:hover h2 {
    text-decoration: underline;
  }

  >h2{
    font-size: 15px;
    font-weight: 900;
    margin-bottom: 5px;
  }

  >h3 {
    display: flex;
    font-size: 13px;
    font-weight: 400;
    align-items: center;
  }

  >h3 > .MuiSvgIcon-root {
    font-size: 14px;
    margin-top: 1px;
    margin-right: 2px;
    color: green;
  }
`;

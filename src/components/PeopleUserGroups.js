import React, { useState } from 'react';
import styled from 'styled-components';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import EmailIcon from '@mui/icons-material/Email';
import ChatIcon from '@mui/icons-material/Chat';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import firebase from 'firebase';
import { auth, db } from '../firebase';
import { enterRoom } from '../features/appSlice';

function PeopleUserGroups() {
  const [currentUser] = useAuthState(auth);
  const dispatch = useDispatch();
  const history = useHistory();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('people'); // 'people' | 'groups'

  const [usersSnapshot] = useCollection(db.collection('users'));

  // Get real users stored in Firebase
  const peopleList = usersSnapshot?.docs.map(doc => ({
    id: doc.id,
    name: doc.data().displayName || doc.data().name || 'Workspace User',
    email: doc.data().email || 'No email provided',
    role: doc.data().role || 'Team Member',
    status: 'Online',
    avatar: doc.data().photoURL || 'https://png.pngtree.com/png-vector/20190710/ourmid/pngtree-user-vector-avatar-png-image_1541962.jpg'
  })) || [];

  const userGroups = [
    {
      id: 'g1',
      handle: '@frontend-devs',
      name: 'Frontend Development Team',
      membersCount: 3,
      description: 'Engineers responsible for React, UI components, and state management.'
    },
    {
      id: 'g2',
      handle: '@product-leads',
      name: 'Product & Design Leads',
      membersCount: 2,
      description: 'Product managers and UX designers coordinating roadmaps.'
    },
    {
      id: 'g3',
      handle: '@mcp-integrators',
      name: 'AI & MCP Task Force',
      membersCount: 4,
      description: 'Specialists building Model Context Protocol and Ollama LLM services.'
    }
  ];

  const filteredPeople = peopleList.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = userGroups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartDirectChat = async (targetUser) => {
    if (!currentUser || !targetUser) return;
    try {
      // Look for an existing direct channel between current user and target user
      const existingRoomsSnap = await db
        .collection('rooms')
        .where('members', 'array-contains', currentUser.uid)
        .get();

      let targetRoomId = null;
      existingRoomsSnap.forEach(doc => {
        const data = doc.data();
        if (data.members && data.members.includes(targetUser.id) && data.members.length === 2 && data.isDirect) {
          targetRoomId = doc.id;
        }
      });

      if (!targetRoomId) {
        // Create an isolated 1-on-1 private chat channel
        const newRoomRef = await db.collection('rooms').add({
          name: `dm-${targetUser.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          members: [currentUser.uid, targetUser.id],
          createdBy: currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          isDirect: true
        });
        targetRoomId = newRoomRef.id;
      }

      dispatch(enterRoom({ roomId: targetRoomId }));
      history.push(`/room/${targetRoomId}`);
    } catch (err) {
      console.error("Error starting direct chat:", err);
      alert("Could not start direct chat: " + err.message);
    }
  };

  return (
    <Container>
      <Header>
        <HeaderTitle>
          <PeopleAltIcon style={{ marginRight: 10, color: '#3f0e40', fontSize: 28 }} />
          <div>
            <h2>People & User Groups</h2>
            <SubTitle>Find teammates, manage roles, and communicate directly with private chats</SubTitle>
          </div>
        </HeaderTitle>
      </Header>

      <TabRow>
        <TabButton active={activeTab === 'people'} onClick={() => setActiveTab('people')}>
          <PersonIcon style={{ fontSize: 18 }} /> People ({filteredPeople.length})
        </TabButton>
        <TabButton active={activeTab === 'groups'} onClick={() => setActiveTab('groups')}>
          <GroupsIcon style={{ fontSize: 18 }} /> User Groups ({filteredGroups.length})
        </TabButton>
      </TabRow>

      <SearchBar>
        <SearchIcon style={{ color: '#888', marginRight: 8 }} />
        <input 
          type="text" 
          placeholder={activeTab === 'people' ? "Search people by name, email, or role..." : "Search user groups by handle..."} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchBar>

      {activeTab === 'people' ? (
        <PeopleGrid>
          {filteredPeople.map(p => (
            <PersonCard key={p.id}>
              <AvatarWrapper>
                <Avatar src={p.avatar} alt={p.name} />
                <StatusDot status={p.status}>
                  <FiberManualRecordIcon style={{ fontSize: 12 }} />
                </StatusDot>
              </AvatarWrapper>
              <PersonInfo>
                <h3>{p.name} {p.id === currentUser?.uid && "(You)"}</h3>
                <RoleBadge>{p.role}</RoleBadge>
                <EmailRow>
                  <EmailIcon style={{ fontSize: 14, color: '#666', marginRight: 4 }} />
                  {p.email}
                </EmailRow>
              </PersonInfo>
              {p.id !== currentUser?.uid && (
                <DirectChatButton onClick={() => handleStartDirectChat(p)} title="Start Private Chat">
                  <ChatIcon fontSize="small" />
                  Chat
                </DirectChatButton>
              )}
            </PersonCard>
          ))}
        </PeopleGrid>
      ) : (
        <GroupsGrid>
          {filteredGroups.map(g => (
            <GroupCard key={g.id}>
              <GroupHeader>
                <GroupsIcon style={{ color: '#3f0e40', fontSize: 22 }} />
                <div>
                  <h3>{g.name}</h3>
                  <HandleBadge>{g.handle}</HandleBadge>
                </div>
              </GroupHeader>
              <GroupBody>
                <p>{g.description}</p>
              </GroupBody>
              <GroupFooter>
                <span>{g.membersCount} Members</span>
              </GroupFooter>
            </GroupCard>
          ))}
        </GroupsGrid>
      )}
    </Container>
  );
}

export default PeopleUserGroups;

const Container = styled.div`
  box-sizing: border-box;
  padding: 20px;
  flex: 1 0 auto;
  background-color: #f8f9fa;
  min-height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
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

const TabRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid ${props => props.active ? '#3f0e40' : '#ccc'};
  background-color: ${props => props.active ? '#3f0e40' : '#fff'};
  color: ${props => props.active ? '#fff' : '#333'};
  cursor: pointer;
  transition: all 0.2s;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 8px 14px;
  margin-bottom: 20px;

  > input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
  }
`;

const PeopleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const PersonCard = styled.div`
  display: flex;
  gap: 14px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  align-items: center;
`;

const AvatarWrapper = styled.div`
  position: relative;
`;

const Avatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
`;

const StatusDot = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  color: ${props => props.status === 'Online' ? '#2eb67d' : '#e01e5a'};
  background: white;
  border-radius: 50%;
  display: flex;
`;

const PersonInfo = styled.div`
  flex: 1;
  > h3 {
    font-size: 15px;
    font-weight: 700;
    color: #1d1c1d;
  }
`;

const RoleBadge = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  background-color: #f4ede4;
  color: #3f0e40;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 4px 0;
`;

const EmailRow = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #616061;
`;

const DirectChatButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #f4ede4;
  color: #3f0e40;
  border: 1px solid #3f0e40;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #3f0e40;
    color: white;
  }
`;

const GroupsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const GroupCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;

  > div > h3 {
    font-size: 15px;
    font-weight: 700;
    color: #1d1c1d;
  }
`;

const HandleBadge = styled.span`
  font-size: 12px;
  color: #1264a3;
  font-weight: 600;
`;

const GroupBody = styled.div`
  font-size: 13px;
  color: #616061;
  margin-bottom: 12px;
`;

const GroupFooter = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #888;
`;

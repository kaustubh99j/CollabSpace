import React, { useState } from 'react';
import styled from 'styled-components';
import { db, auth } from '../firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDispatch } from 'react-redux';
import { enterRoom } from '../features/appSlice';
import { useHistory } from 'react-router-dom';
import TagIcon from '@mui/icons-material/Tag';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ForumIcon from '@mui/icons-material/Forum';
import LockIcon from '@mui/icons-material/Lock';
import GroupIcon from '@mui/icons-material/Group';
import CloseIcon from '@mui/icons-material/Close';
import Spinner from 'react-spinkit';
import firebase from 'firebase';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Avatar,
  IconButton
} from '@mui/material';

function ChannelBrowser() {
  const [currentUser] = useAuthState(auth);
  const dispatch = useDispatch();
  const history = useHistory();

  // Query ONLY channels where the current user is an authorized member
  const [channelsSnapshot, loading] = useCollection(
    currentUser ? db.collection('rooms').where('members', 'array-contains', currentUser.uid) : null
  );

  // Fetch workspace users for channel creation invitation
  const [usersSnapshot] = useCollection(currentUser ? db.collection('users') : null);

  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  const channels = channelsSnapshot?.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || doc.id,
    members: doc.data().members || [],
    createdBy: doc.data().createdBy
  })) || [];

  const workspaceUsers = usersSnapshot?.docs
    .map(doc => ({
      id: doc.id,
      displayName: doc.data().displayName || doc.data().name || 'Workspace User',
      email: doc.data().email || '',
      photoURL: doc.data().photoURL || ''
    }))
    .filter(u => u.id !== currentUser?.uid) || [];

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectChannel = (id) => {
    dispatch(enterRoom({ roomId: id }));
    history.push(`/room/${id}`);
  };

  const handleToggleMember = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim() || !currentUser) return;

    setCreating(true);
    try {
      const docRef = await db.collection('rooms').add({
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
        members: [currentUser.uid, ...selectedMembers],
        createdBy: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      setNewChannelName('');
      setSelectedMembers([]);
      setCreateDialogOpen(false);
      dispatch(enterRoom({ roomId: docRef.id }));
      history.push(`/room/${docRef.id}`);
    } catch (err) {
      console.error("Error creating channel:", err);
      alert("Failed to create channel: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container>
      <Header>
        <HeaderTitle>
          <TagIcon style={{ marginRight: 10, color: '#3f0e40', fontSize: 28 }} />
          <div>
            <h2>Channel Browser</h2>
            <SubTitle>Browse and access your private and shared workspace channels</SubTitle>
          </div>
        </HeaderTitle>
        <CreateButton onClick={() => setCreateDialogOpen(true)}>
          <AddIcon fontSize="small" />
          Create Channel
        </CreateButton>
      </Header>

      <PrivacyNotice>
        <LockIcon style={{ fontSize: 16, marginRight: 8, color: '#2e7d32' }} />
        <span>
          <strong>User Data Isolation Enforced:</strong> You can only view channels you have created or been explicitly invited to.
        </span>
      </PrivacyNotice>

      <SearchBar>
        <SearchIcon style={{ color: '#888', marginRight: 8 }} />
        <input 
          type="text" 
          placeholder="Search your accessible channels by name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchBar>

      <GridList>
        {loading ? (
          <LoadingContainer>
            <Spinner name="three-bounce" color="#3f0e40" />
          </LoadingContainer>
        ) : filteredChannels.length === 0 ? (
          <EmptyState>
            {searchTerm ? `No accessible channels matching "${searchTerm}"` : "You haven't joined or created any channels yet. Click 'Create Channel' to get started."}
          </EmptyState>
        ) : (
          filteredChannels.map(ch => {
            const isCreator = ch.createdBy === currentUser?.uid;
            return (
              <ChannelCard key={ch.id} onClick={() => handleSelectChannel(ch.id)}>
                <ChannelCardHeader>
                  <TagIcon style={{ color: '#3f0e40', fontSize: 20 }} />
                  <h3>#{ch.name}</h3>
                </ChannelCardHeader>
                <ChannelCardBody>
                  <p>
                    {isCreator 
                      ? 'Channel created by you.' 
                      : 'Intentionally shared channel you have access to.'}
                  </p>
                  <MembersCount>
                    <GroupIcon style={{ fontSize: 14, marginRight: 4 }} />
                    {ch.members.length} {ch.members.length === 1 ? 'member' : 'members'}
                  </MembersCount>
                </ChannelCardBody>
                <ChannelCardFooter>
                  <span>
                    <ForumIcon style={{ fontSize: 14, marginRight: 4 }} /> 
                    Open Channel
                  </span>
                </ChannelCardFooter>
              </ChannelCard>
            );
          })
        )}
      </GridList>

      {/* Create Channel Dialog with Optional Invite Selection */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => !creating && setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleCreateChannelSubmit}>
          <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Create New Channel</span>
            <IconButton 
              size="small" 
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <TextField
              autoFocus
              margin="dense"
              label="Channel Name"
              placeholder="e.g. project-apollo or team-chat"
              fullWidth
              size="small"
              value={newChannelName}
              onChange={e => setNewChannelName(e.target.value)}
              required
              helperText="Channels are private by default. Only you and explicitly invited members will have access."
            />

            <InviteSection>
              <h4>Invite Teammates (Optional)</h4>
              <p>Select workspace members to grant them immediate access to this channel:</p>
              
              <TeammatesList>
                {workspaceUsers.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#888' }}>No other registered workspace users found.</p>
                ) : (
                  workspaceUsers.map(user => (
                    <TeammateItem key={user.id} onClick={() => handleToggleMember(user.id)}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={selectedMembers.includes(user.id)} 
                            onChange={() => handleToggleMember(user.id)}
                            size="small"
                          />
                        }
                        label={
                          <TeammateLabel>
                            <Avatar src={user.photoURL} alt={user.displayName} style={{ width: 28, height: 28, marginRight: 8 }} />
                            <div>
                              <strong>{user.displayName}</strong>
                              <span style={{ fontSize: 11, color: '#666', marginLeft: 6 }}>{user.email}</span>
                            </div>
                          </TeammateLabel>
                        }
                      />
                    </TeammateItem>
                  ))
                )}
              </TeammatesList>
            </InviteSection>
          </DialogContent>
          <DialogActions style={{ padding: '12px 24px' }}>
            <Button onClick={() => setCreateDialogOpen(false)} disabled={creating} color="inherit">
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={creating || !newChannelName.trim()}
              style={{ backgroundColor: '#3f0e40', color: 'white' }}
            >
              {creating ? 'Creating...' : 'Create & Access Channel'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default ChannelBrowser;

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
  margin-bottom: 16px;
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

const PrivacyNotice = styled.div`
  display: flex;
  align-items: center;
  background-color: #edf7ed;
  color: #1e4620;
  border: 1px solid #c8e6c9;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  margin-bottom: 16px;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #3f0e40;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
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

const GridList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

const ChannelCard = styled.div`
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
    border-color: #3f0e40;
  }
`;

const ChannelCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  > h3 {
    font-size: 16px;
    font-weight: 700;
    color: #1d1c1d;
  }
`;

const ChannelCardBody = styled.div`
  font-size: 13px;
  color: #616061;
  margin-bottom: 14px;
`;

const MembersCount = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #3f0e40;
  font-weight: 600;
  margin-top: 6px;
`;

const ChannelCardFooter = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #1264a3;

  > span {
    display: flex;
    align-items: center;
  }
`;

const LoadingContainer = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 40px;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  color: #888;
  padding: 40px;
`;

const InviteSection = styled.div`
  margin-top: 18px;
  > h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  > p {
    font-size: 12px;
    color: #666;
    margin-bottom: 10px;
  }
`;

const TeammatesList = styled.div`
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 4px 8px;
`;

const TeammateItem = styled.div`
  cursor: pointer;
  &:hover {
    background-color: #f9f9f9;
  }
`;

const TeammateLabel = styled.div`
  display: flex;
  align-items: center;
`;

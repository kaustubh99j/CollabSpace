import React, { useState } from "react";
import styled from "styled-components";
import Avatar from "@mui/material/Avatar";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { useHistory } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Tooltip
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

function Header() {
  const [user] = useAuthState(auth);
  const history = useHistory();
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleClockClick = () => {
    history.push("/tasks");
  };

  const handleHelpOpen = () => {
    setHelpOpen(true);
  };

  const handleHelpClose = () => {
    setHelpOpen(false);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      history.push(`/channel-browser?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <HeaderContainer>
        {/* Header Left */}
        <HeaderLeft>
          <Tooltip title="Sign Out">
            <HeaderAvatar
              onClick={() => auth.signOut()}
              alt={user?.displayName}
              src={user?.photoURL}
            />
          </Tooltip>
          <Tooltip title="Taskbar / Tasks">
            <IconButton size="small" onClick={handleClockClick} style={{ color: 'white' }}>
              <AccessTimeIcon />
            </IconButton>
          </Tooltip>
        </HeaderLeft>

        {/* Header Search */}
        <HeaderSearch>
          <SearchIcon />
          <input
            placeholder="Search CollabSpace (Press Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
          />
        </HeaderSearch>

        {/* Header Right */}
        <HeaderRight>
          <Tooltip title="Help & Info">
            <IconButton size="small" onClick={handleHelpOpen} style={{ color: 'white' }}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        </HeaderRight>
      </HeaderContainer>

      {/* Help Dialog */}
      <Dialog open={helpOpen} onClose={handleHelpClose} maxWidth="sm" fullWidth>
        <DialogTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>CollabSpace Help & Shortcuts</span>
          <IconButton onClick={handleHelpClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6" gutterBottom style={{ fontWeight: 600 }}>
            🚀 Welcome to CollabSpace!
          </Typography>
          <Typography variant="body2" paragraph>
            CollabSpace is your team collaboration hub. Here are some key features and tips to get around:
          </Typography>

          <HelpSection>
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: '#3f0f40' }}>
              🕒 Taskbar (Clock Icon)
            </Typography>
            <Typography variant="body2">
              Click the clock icon in the top left header to view and manage your <strong>Project Tasks</strong> board.
            </Typography>
          </HelpSection>

          <HelpSection>
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: '#3f0f40' }}>
              🔍 Search Bar
            </Typography>
            <Typography variant="body2">
              Type keywords in the search bar and press <strong>Enter</strong> to quickly search channels and browser content.
            </Typography>
          </HelpSection>

          <HelpSection>
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: '#3f0f40' }}>
              💬 Channels & Direct Messages
            </Typography>
            <Typography variant="body2">
              Browse channels from the sidebar or click <strong>Channel browser</strong> to explore and join public/private channels.
            </Typography>
          </HelpSection>

          <HelpSection>
            <Typography variant="subtitle2" style={{ fontWeight: 700, color: '#3f0f40' }}>
              🤖 MCP AI Summaries
            </Typography>
            <Typography variant="body2">
              Head over to <strong>Saved items</strong> to generate AI summaries for channel history.
            </Typography>
          </HelpSection>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHelpClose} variant="contained" style={{ backgroundColor: '#3f0f40', color: 'white' }}>
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Header;

const HelpSection = styled.div`
  margin-bottom: 12px;
  padding: 10px;
  background-color: #f8f9fa;
  border-left: 4px solid #3f0f40;
  border-radius: 4px;
`;

const HeaderSearch = styled.div`
  flex: 0.4;
  opacity: 1;
  border-radius: 6px;
  background-color: #421f44;
  text-align: center;
  display: flex;
  padding: 4px 12px;
  color: gray;
  border: 1px solid gray;
  align-items: center;

  > input {
    background-color: transparent;
    border: none;
    min-width: 30vw;
    outline: none;
    color: white;
    margin-left: 8px;
    font-size: 14px;
  }
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  position: relative;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  background-color: var(--slack-color);
  color: white;
  z-index: 100;
`;

const HeaderLeft = styled.div`
  flex: 0.3;
  display: flex;
  align-items: center;
  margin-left: 20px;
  gap: 15px;

  > .MuiIconButton-root {
    margin-left: auto;
    margin-right: 20px;
  }
`;

const HeaderAvatar = styled(Avatar)`
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const HeaderRight = styled.div`
  flex: 0.3;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
`;
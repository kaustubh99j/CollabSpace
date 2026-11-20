import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { db } from "../firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Tabs,
  Tab,
  Box,
  Alert
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PublicIcon from '@mui/icons-material/Public';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';

// Simple IndexedDB Helper
const DB_NAME = "CollabSpaceFiles";
const STORE_NAME = "local_files";

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storeFileLocal = async (fileData) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(fileData);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getFileLocal = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteFileLocal = async (id) => {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
};

function FileList() {
  const [filesSnapshot] = useCollection(db.collection("files").orderBy("timestamp", "desc"));
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Link form states
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const sharedFiles = filesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];
  const [localFiles, setLocalFiles] = useState([]);

  // Load local files from IndexedDB
  const refreshLocalFiles = async () => {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => setLocalFiles(request.result);
  };

  useEffect(() => {
    refreshLocalFiles();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setLinkName("");
    setLinkUrl("");
  };

  const addLinkFile = (e) => {
    e.preventDefault();
    if (!linkName || !linkUrl) return;

    db.collection("files").add({
      name: linkName,
      url: linkUrl,
      type: "link",
      timestamp: new Date()
    });

    handleClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const fileId = "local_" + Date.now();
      const fileData = {
        id: fileId,
        name: file.name,
        data: reader.result,
        size: file.size,
        type: file.type,
        timestamp: new Date().toISOString()
      };
      
      await storeFileLocal(fileData);
      refreshLocalFiles();
      handleClose();
    };
    reader.readAsDataURL(file);
  };

  const deleteSharedFile = (id) => {
    db.collection("files").doc(id).delete();
  };

  const deleteLocalFile = async (id) => {
    await deleteFileLocal(id);
    refreshLocalFiles();
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Container>
      <HeaderSection>
        <Typography variant="h4" style={{ fontWeight: 800, color: '#3f0f40' }}>
          File Browser
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<CloudUploadIcon />} 
          onClick={handleOpen}
          style={{ backgroundColor: '#3f0f40', color: 'white', borderRadius: 20 }}
        >
          Add Content
        </Button>
      </HeaderSection>

      <Alert severity="info" style={{ marginBottom: 20 }}>
        Shared Links are synced via Firestore. Physical files are stored <b>locally</b> in your browser to avoid storage costs.
      </Alert>

      <SectionTitle>
        <PublicIcon fontSize="small" style={{ marginRight: 8 }} /> Shared Links ({sharedFiles.length})
      </SectionTitle>
      <GridContainer>
        {sharedFiles.length === 0 && <EmptyStateSmall>No shared links yet.</EmptyStateSmall>}
        {sharedFiles.map((file) => (
          <FileCard key={file.id}>
            <CardContent>
              <FileIconWrapper type="link">
                <PublicIcon color="primary" />
              </FileIconWrapper>
              <FileName title={file.name}>{file.name}</FileName>
              <FileMeta>External Link</FileMeta>
              <FileActions>
                <ActionButton 
                  component="a" 
                  href={file.url} 
                  target="_blank" 
                  color="primary"
                  variant="outlined"
                  size="small"
                  startIcon={<LinkIcon />}
                >
                  Visit
                </ActionButton>
                <IconButton size="small" onClick={() => deleteSharedFile(file.id)}>
                  <DeleteIcon fontSize="small" style={{ color: '#d32f2f' }} />
                </IconButton>
              </FileActions>
            </CardContent>
          </FileCard>
        ))}
      </GridContainer>

      <SectionTitle style={{ marginTop: 40 }}>
        <DeviceHubIcon fontSize="small" style={{ marginRight: 8 }} /> Local Files ({localFiles.length})
      </SectionTitle>
      <GridContainer>
        {localFiles.length === 0 && <EmptyStateSmall>No local files uploaded.</EmptyStateSmall>}
        {localFiles.map((file) => (
          <FileCard key={file.id}>
            <CardContent>
              <FileIconWrapper type="file">
                <InsertDriveFileIcon color="action" />
              </FileIconWrapper>
              <FileName title={file.name}>{file.name}</FileName>
              <FileMeta>{formatSize(file.size)}</FileMeta>
              <FileActions>
                <ActionButton 
                  component="a" 
                  href={file.data} 
                  download={file.name}
                  color="primary"
                  variant="outlined"
                  size="small"
                  startIcon={<InsertDriveFileIcon />}
                >
                  Download
                </ActionButton>
                <IconButton size="small" onClick={() => deleteLocalFile(file.id)}>
                  <DeleteIcon fontSize="small" style={{ color: '#d32f2f' }} />
                </IconButton>
              </FileActions>
            </CardContent>
          </FileCard>
        ))}
      </GridContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Add to File Browser</DialogTitle>
        <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} centered>
          <Tab label="Shared Link" icon={<LinkIcon />} />
          <Tab label="Local File" icon={<InsertDriveFileIcon />} />
        </Tabs>
        
        <DialogContent>
          {tabValue === 0 ? (
            <Box py={2}>
              <TextField
                autoFocus
                margin="dense"
                label="Display Name"
                fullWidth
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                variant="outlined"
                style={{ marginBottom: 15 }}
              />
              <TextField
                margin="dense"
                label="URL"
                fullWidth
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                variant="outlined"
                placeholder="https://example.com"
              />
            </Box>
          ) : (
            <Box py={3} textAlign="center">
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="contained-button-file"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="contained-button-file">
                <Button 
                  variant="outlined" 
                  component="span" 
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  style={{ padding: '20px', borderStyle: 'dashed' }}
                >
                  Save Local File
                </Button>
              </label>
              <Typography variant="caption" color="textSecondary" style={{ marginTop: 15, display: 'block' }}>
                Files will be stored locally in your browser's IndexedDB. 
                They are <b>not</b> uploaded to any server.
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions style={{ padding: 20 }}>
          <Button onClick={handleClose}>Cancel</Button>
          {tabValue === 0 && (
            <Button 
              onClick={addLinkFile} 
              variant="contained" 
              color="primary"
              disabled={!linkName || !linkUrl}
            >
              Add Link
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default FileList;

// Styled Components
const Container = styled.div`
  box-sizing: border-box;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100%;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled(Typography)`
  display: flex;
  align-items: center;
  font-weight: 700 !important;
  color: #5e6c84;
  margin-bottom: 15px !important;
  text-transform: uppercase;
  font-size: 0.8rem !important;
  letter-spacing: 0.5px;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
`;

const FileCard = styled(Card)`
  border-radius: 12px !important;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
  }
`;

const FileIconWrapper = styled.div`
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.type === 'link' ? '#e3f2fd' : '#f5f5f5'};
  border-radius: 8px;
  margin-bottom: 12px;

  .MuiSvgIcon-root {
    font-size: 32px;
  }
`;

const FileName = styled(Typography)`
  font-weight: 700 !important;
  font-size: 0.9rem !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px !important;
  color: #172b4d;
`;

const FileMeta = styled(Typography)`
  font-size: 0.75rem !important;
  color: #5e6c84;
  margin-bottom: 12px !important;
`;

const FileActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ActionButton = styled(Button)`
  text-transform: none !important;
  font-size: 0.7rem !important;
  padding: 2px 8px !important;
`;

const EmptyStateSmall = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 30px;
  color: #7a869a;
  background: white;
  border-radius: 12px;
  border: 1px dashed #ddd;
  font-size: 0.85rem;
  font-style: italic;
`;
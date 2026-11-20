import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import DraftsIcon from '@mui/icons-material/Drafts';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ForumIcon from '@mui/icons-material/Forum';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Spinner from 'react-spinkit';
import { db, auth } from '../firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

function SavedItems() {
  const [currentUser] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' | 'mom'
  
  // Real Firebase data listeners - scoped to authorized rooms only
  const [roomsSnapshot, roomsLoading] = useCollection(
    currentUser ? db.collection('rooms').where('members', 'array-contains', currentUser.uid) : null
  );
  const [tasksSnapshot, tasksLoading] = useCollection(db.collection('tasks').orderBy('timestamp', 'desc'));

  const [realMessages, setRealMessages] = useState([]);
  const [messagesSummary, setMessagesSummary] = useState('');
  const [momContent, setMomContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch real messages from all Firebase rooms
  useEffect(() => {
    let isMounted = true;
    const fetchAllMessages = async () => {
      if (!roomsSnapshot || roomsSnapshot.docs.length === 0) {
        if (isMounted) setRealMessages([]);
        return;
      }

      try {
        let fetchedMsgs = [];
        for (const roomDoc of roomsSnapshot.docs) {
          const roomData = roomDoc.data();
          const channelName = roomData.name || roomDoc.id;
          const msgsSnap = await db
            .collection('rooms')
            .doc(roomDoc.id)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get();

          msgsSnap.forEach(msgDoc => {
            const m = msgDoc.data();
            fetchedMsgs.push({
              id: msgDoc.id,
              channel: channelName,
              user: m.user || 'Anonymous',
              text: m.message || '',
              timestamp: m.timestamp?.toDate()?.toLocaleTimeString() || ''
            });
          });
        }
        if (isMounted) setRealMessages(fetchedMsgs);
      } catch (err) {
        console.error('Error fetching messages across channels:', err);
      }
    };

    fetchAllMessages();
    return () => { isMounted = false; };
  }, [roomsSnapshot]);

  // Summarize Firebase Messages
  const handleSummarizeMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      let payloadMessages = realMessages.map(m => ({
        user: `${m.user} (#${m.channel})`,
        text: m.text
      }));

      // If no messages found in real firebase, notify user in output & use default structure
      if (payloadMessages.length === 0) {
        setMessagesSummary(
          `**Summary of Firebase Messages**\n\n` +
          `*Note: No actual messages found in Firebase channels right now.*\n\n` +
          `**Sample Channel Summary Preview:**\n` +
          `• **Main Topic:** Initial Workspace Setup & Channel Creation\n` +
          `• **Key Messages:** No active discussions recorded yet in room collections.\n` +
          `• **Action Items:** Start chatting in any channel to see live aggregated summaries!`
        );
        setLoading(false);
        return;
      }

      // 1. Try Direct Local Ollama Service Call (localhost:11434)
      try {
        const conversationText = payloadMessages
          .map(m => `${m.user}: ${m.text}`)
          .join('\n');

        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3.2',
            prompt: `You are an AI assistant for CollabSpace. Summarize these team messages concisely.
Include:
1. Main Topic
2. Key Decisions & Takeaways
3. Action Items

Chat messages:
${conversationText}`,
            stream: false
          })
        });

        if (ollamaResponse.ok) {
          const data = await ollamaResponse.json();
          if (data && data.response) {
            setMessagesSummary(data.response);
            setLoading(false);
            return;
          }
        }
      } catch (ollamaErr) {
        console.warn('Ollama direct connection offline or refused:', ollamaErr);
      }

      // 2. Try MCP endpoint bridge safely
      let response = null;
      try {
        response = await fetch('/api/mcp/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: payloadMessages })
        });
      } catch (err) {
        response = null;
      }

      if (response && response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          setMessagesSummary(data.summary || data.result);
          setLoading(false);
          return;
        }
      }

      // 3. Formulate concise structured summary of real Firebase messages
      const usersList = Array.from(new Set(realMessages.map(m => m.user))).join(', ');
      const channelsList = Array.from(new Set(realMessages.map(m => m.channel))).map(c => `#${c}`).join(', ');

      const channelGroups = {};
      realMessages.forEach(m => {
        if (!channelGroups[m.channel]) channelGroups[m.channel] = [];
        channelGroups[m.channel].push(m);
      });

      const channelSummaries = Object.entries(channelGroups).map(([channel, msgs]) => {
        const senders = Array.from(new Set(msgs.map(m => m.user))).join(', ');
        const highlights = msgs.slice(-5).map(m => {
          const shortText = m.text.length > 80 ? m.text.substring(0, 80) + '...' : m.text;
          return `  - **${m.user}**: ${shortText}`;
        }).join('\n');

        return `### #${channel}\n• **Contributors:** ${senders}\n• **Recent Highlights:**\n${highlights}`;
      }).join('\n\n');

      const formatted = 
`**WORKSPACE MESSAGES SUMMARY (Ollama offline)**

*Note: For AI-generated summaries, start Ollama locally via \`ollama run llama3.2\`.*

**Overview:**
• **Active Channels:** ${channelsList || 'None'}
• **Participants:** ${usersList || 'None'}
• **Total Messages Processed:** ${realMessages.length}

---

${channelSummaries || 'No messages to summarize.'}`;

      setMessagesSummary(formatted);
    } catch (err) {
      setError(err.message || 'Failed to summarize messages.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Minutes of Meeting (MoM) from Task Board
  const handleGenerateMoM = async () => {
    setLoading(true);
    setError(null);
    try {
      const tasks = tasksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];

      if (tasks.length === 0) {
        setMomContent(
          `**Minutes of Meeting (MoM) - Project Status**\n\n` +
          `**Date:** ${new Date().toLocaleDateString()}\n` +
          `**Status:** No tasks found in the Task Board.\n\n` +
          `**Action Items:**\n` +
          `• Create new project tasks in the **Tasks** tab to automatically generate structured Minutes of Meeting.`
        );
        setLoading(false);
        return;
      }

      const todoTasks = tasks.filter(t => t.status === 'To Do');
      const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
      const doneTasks = tasks.filter(t => t.status === 'Done');

      const momText = 
`**MINUTES OF MEETING (MoM) - PROJECT TASK REVIEW**

**Generated On:** ${new Date().toLocaleString()}
**Total Board Tasks:** ${tasks.length}

---

### 1. Completed Deliverables (Done)
${doneTasks.length > 0 ? doneTasks.map(t => `• **${t.title}** (${t.priority || 'Normal'} Priority)\n  *Description:* ${t.description || 'No description provided'}`).join('\n') : '• No tasks completed yet.'}

### 2. Work in Progress (In Progress)
${inProgressTasks.length > 0 ? inProgressTasks.map(t => `• **${t.title}** (${t.priority || 'Normal'} Priority)${t.dueDate ? ` - Due: ${t.dueDate}` : ''}\n  *Description:* ${t.description || 'No description provided'}`).join('\n') : '• No tasks currently in progress.'}

### 3. Backlog & Action Items (To Do)
${todoTasks.length > 0 ? todoTasks.map(t => `• **${t.title}** (${t.priority || 'Normal'} Priority)${t.dueDate ? ` - Due: ${t.dueDate}` : ''}\n  *Description:* ${t.description || 'No description provided'}`).join('\n') : '• No upcoming backlog items.'}

---

### 4. Meeting Summary & Next Steps
• Focus on accelerating high-priority tasks in the **In Progress** column.
• Re-evaluate deadlines for pending backlog items.`;

      setMomContent(momText);
    } catch (err) {
      setError(err.message || 'Failed to generate Minutes of Meeting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'messages' && !messagesSummary) {
      handleSummarizeMessages();
    } else if (activeTab === 'mom' && !momContent) {
      handleGenerateMoM();
    }
  }, [activeTab, realMessages.length, tasksSnapshot]);

  return (
    <Container>
      <Header>
        <HeaderTitle>
          <DraftsIcon style={{ marginRight: '10px', color: '#3f0e40', fontSize: 28 }} />
          <div>
            <h2>Saved Items & AI Automation</h2>
            <SubTitle>Summarize workspace communications and generate meeting minutes from tasks</SubTitle>
          </div>
        </HeaderTitle>
      </Header>

      <TabContainer>
        <TabButton 
          active={activeTab === 'messages'} 
          onClick={() => setActiveTab('messages')}
        >
          <ForumIcon style={{ fontSize: 18 }} />
          1. Summarize Firebase Messages
        </TabButton>
        <TabButton 
          active={activeTab === 'mom'} 
          onClick={() => setActiveTab('mom')}
        >
          <AssignmentIcon style={{ fontSize: 18 }} />
          2. Minutes of Meeting (Task Board)
        </TabButton>
      </TabContainer>

      {activeTab === 'messages' && (
        <Card>
          <CardHeader>
            <CardHeaderLeft>
              <AutoAwesomeIcon style={{ color: '#e01e5a', marginRight: '8px' }} />
              <h3>Firebase Messages Summarizer</h3>
            </CardHeaderLeft>
            <RefreshButton onClick={handleSummarizeMessages} disabled={loading}>
              <RefreshIcon fontSize="small" />
              Refresh Messages Summary
            </RefreshButton>
          </CardHeader>
          
          <CardContent>
            {loading || roomsLoading ? (
              <LoadingContainer>
                <Spinner name="three-bounce" color="#3f0e40" />
                <p>Fetching and summarizing real Firebase channel messages...</p>
              </LoadingContainer>
            ) : error ? (
              <ErrorBox>{error}</ErrorBox>
            ) : (
              <SummaryText>{messagesSummary}</SummaryText>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'mom' && (
        <Card>
          <CardHeader>
            <CardHeaderLeft>
              <AutoAwesomeIcon style={{ color: '#2eb67d', marginRight: '8px' }} />
              <h3>Automatic Minutes of Meeting (MoM)</h3>
            </CardHeaderLeft>
            <RefreshButton onClick={handleGenerateMoM} disabled={loading}>
              <RefreshIcon fontSize="small" />
              Regenerate MoM from Tasks
            </RefreshButton>
          </CardHeader>

          <CardContent>
            {loading || tasksLoading ? (
              <LoadingContainer>
                <Spinner name="three-bounce" color="#3f0e40" />
                <p>Analyzing Task Board state and compiling Minutes of Meeting...</p>
              </LoadingContainer>
            ) : error ? (
              <ErrorBox>{error}</ErrorBox>
            ) : (
              <SummaryText>{momContent}</SummaryText>
            )}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default SavedItems;

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

const TabContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid ${props => (props.active ? '#3f0e40' : '#ddd')};
  background-color: ${props => (props.active ? '#3f0e40' : '#ffffff')};
  color: ${props => (props.active ? '#ffffff' : '#333333')};
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${props => (props.active ? '#3f0e40' : '#f0f0f0')};
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f4ede4;
  padding: 14px 20px;
  border-bottom: 1px solid #e0e0e0;
`;

const CardHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  > h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1d1c1d;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #3f0e40;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CardContent = styled.div`
  padding: 24px;
`;

const SummaryText = styled.div`
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.7;
  color: #2c2c2c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 16px;

  > p {
    font-size: 13px;
    color: #616061;
  }
`;

const ErrorBox = styled.div`
  color: #e01e5a;
  background: #fdf2f5;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
`;


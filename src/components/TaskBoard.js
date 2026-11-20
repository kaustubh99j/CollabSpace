import React, { useState } from "react";
import styled from "styled-components";
import { db } from "../firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import { 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  IconButton,
  Chip
} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ScheduleIcon from '@mui/icons-material/Schedule';

function TaskBoard() {
  const [tasksSnapshot] = useCollection(db.collection("tasks").orderBy("timestamp", "desc"));
  const [open, setOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const tasks = tasksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("Medium");
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!title) return;

    db.collection("tasks").add({
      title,
      description,
      status: "To Do",
      dueDate: dueDate || null,
      priority,
      timestamp: new Date()
    });

    handleClose();
  };

  const updateStatus = (id, newStatus) => {
    db.collection("tasks").doc(id).update({ status: newStatus });
  };

  const deleteTask = (id) => {
    db.collection("tasks").doc(id).delete();
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date().setHours(0,0,0,0);
  };

  const renderColumn = (status) => (
    <Column>
      <ColumnTitle>
        {status} 
        <Chip label={tasks.filter(t => t.status === status).length} size="small" style={{ marginLeft: 10 }} />
      </ColumnTitle>
      <TaskList>
        {tasks.filter(t => t.status === status).map((task) => (
          <TaskCard key={task.id} priority={task.priority} overdue={isOverdue(task.dueDate)}>
            <CardContent>
              <TaskHeader>
                <Typography variant="h6" style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {task.title}
                </Typography>
                <IconButton size="small" onClick={() => deleteTask(task.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TaskHeader>
              
              <Typography variant="body2" color="textSecondary" style={{ marginBottom: 10 }}>
                {task.description}
              </Typography>

              <TaskFooter>
                <PriorityBadge priority={task.priority}>
                  {task.priority}
                </PriorityBadge>
                
                {task.dueDate && (
                  <DueDate overdue={isOverdue(task.dueDate)}>
                    <ScheduleIcon fontSize="inherit" style={{ marginRight: 4 }} />
                    {task.dueDate}
                  </DueDate>
                )}
              </TaskFooter>

              <StatusActions>
                {status !== "To Do" && (
                  <ActionButton onClick={() => updateStatus(task.id, "To Do")}>To Do</ActionButton>
                )}
                {status !== "In Progress" && (
                  <ActionButton onClick={() => updateStatus(task.id, "In Progress")}>Progress</ActionButton>
                )}
                {status !== "Done" && (
                  <ActionButton onClick={() => updateStatus(task.id, "Done")}>Done</ActionButton>
                )}
              </StatusActions>
            </CardContent>
          </TaskCard>
        ))}
        {tasks.filter(t => t.status === status).length === 0 && (
          <EmptyState>No tasks here</EmptyState>
        )}
      </TaskList>
    </Column>
  );

  return (
    <BoardContainer>
      <BoardHeader>
        <Typography variant="h4" style={{ fontWeight: 800, color: '#3f0f40' }}>
          Project Tasks
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpen}
          style={{ backgroundColor: '#3f0f40', color: 'white', borderRadius: 20 }}
        >
          New Task
        </Button>
      </BoardHeader>

      <ColumnsContainer>
        {renderColumn("To Do")}
        {renderColumn("In Progress")}
        {renderColumn("Done")}
      </ColumnsContainer>

      {/* Task Creation Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
            style={{ marginBottom: 15, marginTop: 10 }}
          />
          <TextField
            label="Description"
            multiline
            rows={3}
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="outlined"
            style={{ marginBottom: 15 }}
          />
          <div style={{ display: 'flex', gap: 15 }}>
            <TextField
              label="Due Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              variant="outlined"
            />
            <FormControl variant="outlined" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions style={{ padding: 20 }}>
          <Button onClick={handleClose} color="primary">Cancel</Button>
          <Button 
            onClick={addTask} 
            variant="contained" 
            style={{ backgroundColor: '#3f0f40', color: 'white' }}
            disabled={!title}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>
    </BoardContainer>
  );
}

export default TaskBoard;

// Styled Components
const BoardContainer = styled.div`
  box-sizing: border-box;
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100%;
`;

const BoardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const ColumnsContainer = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 20px;
`;

const Column = styled.div`
  flex: 1;
  min-width: 300px;
  background-color: #ebedf0;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  flex-direction: column;
`;

const ColumnTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 15px;
  color: #172b4d;
  display: flex;
  align-items: center;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaskCard = styled(Card)`
  border-radius: 8px !important;
  border-left: 5px solid ${props => 
    props.priority === 'High' ? '#e91e63' : 
    props.priority === 'Medium' ? '#ff9800' : '#4caf50'} !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
  }
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const TaskFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
`;

const PriorityBadge = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  background-color: ${props => 
    props.priority === 'High' ? '#ffebee' : 
    props.priority === 'Medium' ? '#fff3e0' : '#e8f5e9'};
  color: ${props => 
    props.priority === 'High' ? '#c62828' : 
    props.priority === 'Medium' ? '#ef6c00' : '#2e7d32'};
`;

const DueDate = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: ${props => props.overdue ? '#d32f2f' : '#5e6c84'};
  font-weight: ${props => props.overdue ? '700' : '400'};
`;

const StatusActions = styled.div`
  display: flex;
  gap: 5px;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
`;

const ActionButton = styled.button`
  flex: 1;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.7rem;
  padding: 4px;
  cursor: pointer;
  color: #5e6c84;
  
  &:hover {
    background-color: #f4f5f7;
    border-color: #ccc;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #7a869a;
  font-size: 0.85rem;
  padding: 20px;
  font-style: italic;
`;
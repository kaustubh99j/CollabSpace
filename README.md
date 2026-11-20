# CollabSpace 🚀

> A modern, Slack-inspired collaboration platform built with React and Firebase, featuring real-time team communication and an MCP-powered AI integration.

CollabSpace is a full-stack collaboration application inspired by tools like Slack. It provides a workspace where users can communicate, organize conversations, and interact with their team through a clean, responsive interface.

The project also includes an **MCP (Model Context Protocol) server**, allowing AI tools and agents to interact with CollabSpace data through structured tools.

---

## ✨ Features

* 🔐 **Authentication**

  * Secure user authentication with Firebase
  * User-specific workspaces and conversations

* 💬 **Real-Time Messaging**

  * Send and receive messages in real time
  * Persistent message storage using Firestore

* 🏢 **Workspace-Based Collaboration**

  * Organize communication around workspaces
  * Dedicated channels/conversations

* 👥 **User Management**

  * User profiles
  * Workspace members
  * User-specific data

* 🤖 **MCP Integration**

  * Dedicated MCP server for CollabSpace
  * Exposes CollabSpace functionality as AI-accessible tools
  * Designed to work with MCP-compatible clients and AI agents

* 📱 **Responsive UI**

  * Modern Slack-inspired interface
  * Responsive layout for different screen sizes

* 🔥 **Firebase Backend**

  * Firebase Authentication
  * Cloud Firestore
  * Firebase Hosting

---

## 🏗️ Architecture

```text
                         ┌─────────────────────┐
                         │      User           │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   CollabSpace UI    │
                         │       React         │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │      Firebase       │
                         │                     │
                         │ Authentication      │
                         │ Firestore           │
                         │ Hosting             │
                         └─────────────────────┘
                                    ▲
                                    │
                                    │
                         ┌──────────┴──────────┐
                         │     MCP Server      │
                         │                     │
                         │ Node.js             │
                         │ MCP SDK             │
                         │ CollabSpace Tools   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   MCP Client / AI   │
                         │   Agents & Tools    │
                         └─────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

* React
* JavaScript
* React Router
* Redux Toolkit
* Material UI
* Styled Components

### Backend / Database

* Firebase
* Cloud Firestore
* Firebase Authentication

### AI / MCP

* Model Context Protocol (MCP)
* Node.js
* MCP SDK
* Ollama / MCP-compatible AI clients

### Deployment

* Firebase Hosting
* GitHub

---

## 📁 Project Structure

```text
collabspace/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   └── ...
│
├── mcp-server/
│   ├── src/
│   ├── dist/
│   ├── package.json
│   └── ...
│
├── firebase.json
├── firestore.rules
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/kaustubh99j/collabspace.git

cd collabspace
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project and enable:

* Firebase Authentication
* Cloud Firestore
* Firebase Hosting

Configure your Firebase credentials according to your application's Firebase configuration.

### 4. Start the Frontend

```bash
npm start
```

The application should now be available at:

```text
http://localhost:3000
```

---

# 🤖 MCP Server

CollabSpace also contains a dedicated MCP server that exposes application functionality to MCP-compatible AI clients.

## MCP Server Setup

Navigate to the MCP server directory:

```bash
cd mcp-server
```

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

Start the server:

```bash
npm start
```

The MCP server can then be connected to an MCP-compatible client such as an AI coding assistant or agent.

### MCP Architecture

```text
AI Client
    │
    │ MCP
    ▼
┌──────────────────┐
│  CollabSpace     │
│   MCP Server     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ CollabSpace Data │
│   & Services     │
└──────────────────┘
```

This allows AI agents to interact with CollabSpace through structured MCP tools rather than relying solely on unstructured prompts.

---

## 🔥 Firebase

CollabSpace uses Firebase for its backend infrastructure.

### Firebase Services

| Service                 | Purpose                            |
| ----------------------- | ---------------------------------- |
| Firebase Authentication | User authentication                |
| Cloud Firestore         | Messages, users and workspace data |
| Firebase Hosting        | Frontend deployment                |

Firestore provides the application's real-time data synchronization, allowing changes to be reflected across connected clients.

---

## 🚀 Deployment

The frontend can be deployed using Firebase Hosting.

Build the application:

```bash
npm run build
```

Login to Firebase:

```bash
firebase login
```

Initialize Firebase Hosting if required:

```bash
firebase init hosting
```

Deploy:

```bash
firebase deploy
```

---

## 🔐 Environment Variables

If environment variables are required by your local configuration, create a `.env` file:

```env
# Firebase configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> **Never commit secrets, private keys, service-account files, or sensitive credentials to GitHub.**

---

## 🧪 Development

Run the frontend locally:

```bash
npm start
```

Run the MCP server:

```bash
cd mcp-server
npm start
```

For MCP development, the server can also be tested using an MCP-compatible client or inspector.

---

## 📌 Roadmap

* [x] Firebase authentication
* [x] Firestore integration
* [x] Workspace/chat interface
* [x] Real-time messaging
* [x] Firebase deployment
* [x] MCP server
* [x] File sharing
* [ ] More MCP tools
* [ ] AI-powered workspace assistant
* [ ] Improved search
* [ ] Notifications
* [ ] Advanced workspace administration

---

## 🎯 What I Learned

Building CollabSpace helped me gain practical experience with:

* Building a full-stack React application
* Firebase Authentication and Firestore
* Real-time application architecture
* State management with Redux Toolkit
* Component-based UI development
* Designing a Slack-style collaboration interface
* Building and debugging an MCP server
* Connecting AI tooling with existing application functionality
* Deploying a production web application

---

## 🧠 Key Engineering Concepts

The project demonstrates several concepts that are useful in production applications:

**Real-Time Data**

Firestore listeners allow the client to react to changes in application data without requiring traditional WebSocket infrastructure.

**Separation of Concerns**

The frontend, Firebase services, and MCP server are maintained as separate components, making the system easier to develop and extend.

**AI Tool Integration**

The MCP layer provides a standardized interface between AI clients and CollabSpace functionality.

---

## 📸 Screenshots

Add screenshots of the application here:

```text
screenshots/
├── login.png
├── workspace.png
├── chat.png
└── mcp.png
```

Example:

![CollabSpace Workspace](screenshots/workspace.png)

---

## 👨‍💻 Author

**Kaustubh Jangam**

Full Stack Developer | MCA Student

Interested in building scalable web applications, AI-powered systems, and developer-focused tools.

---

## ⭐ Acknowledgements

Inspired by modern team collaboration platforms such as Slack and built as a full-stack learning and portfolio project.

If you found this project interesting, consider giving the repository a ⭐.

import React from "react";
import "./App.css";
import { BrowserRouter as Router, Switch, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";
import Home from "./components/Home";
import Threads from "./components/Threads";
import styled from "styled-components";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "./firebase";
import Login from "./components/Login";
import Spinner from "react-spinkit";
import TaskBoard from "./components/TaskBoard";
import FileList from "./components/FileList";
import SavedItems from "./components/SavedItems";
import MentionsReactions from "./components/MentionsReactions";
import ChannelBrowser from "./components/ChannelBrowser";
import PeopleUserGroups from "./components/PeopleUserGroups";

function ScrollToTop() {
  const { pathname, key } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.scrollTop = 0;
      mainContent.scrollLeft = 0;
    }
  }, [pathname, key]);

  return null;
}

function App() {

  const [user, loading] = useAuthState(auth);

  React.useEffect(() => {
    if (user) {
      db.collection("users").doc(user.uid).set({
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || "User",
        email: user.email,
        photoURL: user.photoURL || "",
        lastSeen: new Date()
      }, { merge: true });
    }
  }, [user]);

  if (loading) {
    return (
      <AppLoading>
        <AppLoadingContents>
          <img src="CollabSpacelogo.png" alt="Logo of CollabSpae" />
          <Spinner
            name="ball-spin-fade-loader"
            color="purple"
            fadeIn="none"
          />
        </AppLoadingContents>
      </AppLoading>
    )
  }



  return (
    <div className="app">
      <Router>
        <ScrollToTop />
        {!user ? (
          <Login />
        ) : (

          <>

            <Header />
            <AppBody>
              <Sidebar />
              <MainContent id="main-content">
                     <Switch>
                {/* Home route */}
                <Route path="/" exact>
                  <Home />
                </Route>

                {/* Threads route */}
                <Route path="/threads">
                  <Threads />
                </Route>

                {/* Channel route */}
                <Route path="/room/:id">
                  <Chat />
                </Route>

                {/* Saved Items / MCP Summary route */}
                <Route path="/saved-items">
                  <SavedItems />
                </Route>

                {/* Tasks route */}
                <Route path="/tasks">
                  <TaskBoard />
                </Route>

                {/* Files route */}
                <Route path="/files">
                  <FileList />
                </Route>

                {/* Mentions & Reactions route */}
                <Route path="/mentions">
                  <MentionsReactions />
                </Route>

                {/* Channel Browser route */}
                <Route path="/channel-browser">
                  <ChannelBrowser />
                </Route>

                {/* People & User Groups route */}
                <Route path="/people-groups">
                  <PeopleUserGroups />
                </Route>
              </Switch>
              </MainContent>
            </AppBody>
          </>
        )}
      </Router>
    </div>
  );
}

            

export default App;

const AppLoading = styled.div`
  display: grid;
  place-items: center;
  height: 100vh;
  width: 100%;
`;

const AppLoadingContents = styled.div`
 text-align: center; 
 padding-bottom: 100px;
 display: flex;
 flex-direction: column;
 justify-content: center;
 align-items: center;

  > img {
  height: 250px;
  padding: 20px;
  margin-bottom: 40px;
  }
`;

const AppBody = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const MainContent = styled.div`
  flex: 1;              /* take up remaining space next to sidebar */
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-y: auto;     /* scroll if content grows */
  background-color: #fdfdfd;
`;




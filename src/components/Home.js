import React from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import TagIcon from "@mui/icons-material/Tag";
import ForumIcon from "@mui/icons-material/Forum";
import ChannelActivityList from "./ChannelActivityList";

function Home() {
  const history = useHistory();

  return (
    <Page>
      <Hero>
        <HeroIcon>
          <ForumIcon style={{ fontSize: 30 }} />
        </HeroIcon>
        <h1>Welcome to CollabSpace</h1>
        <p>
          Your team's conversations, all in one place. Jump back into a channel
          or start a new one.
        </p>
        <PrimaryAction onClick={() => history.push("/channel-browser")}>
          <TagIcon fontSize="small" />
          Browse channels
        </PrimaryAction>
      </Hero>

      <SectionHeading>
        <div>
          <h2>Your channels</h2>
          <p>Pick up where you left off</p>
        </div>
        <ViewAllButton onClick={() => history.push("/threads")}>
          View all threads
        </ViewAllButton>
      </SectionHeading>

      <ChannelActivityList limit={8} />
    </Page>
  );
}

export default Home;

const Page = styled.div`
  box-sizing: border-box;
  min-height: 100%;
  padding: 32px 36px 48px;
  background-color: #f8f9fa;
`;

const Hero = styled.div`
  padding: 28px 30px;
  margin-bottom: 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3f0e40 0%, #611f69 100%);
  color: #ffffff;

  > h1 {
    margin-top: 16px;
    font-size: 26px;
    font-weight: 800;
  }

  > p {
    max-width: 580px;
    margin: 8px 0 20px;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.82);
  }
`;

const HeroIcon = styled.div`
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background-color: rgba(255, 255, 255, 0.14);
  color: #ffffff;
`;

const PrimaryAction = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border: none;
  border-radius: 6px;
  background-color: #ffffff;
  color: #3f0e40;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background-color: #f4ede4;
  }
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 12px;

  > div > h2 {
    font-size: 18px;
    font-weight: 700;
    color: #1d1c1d;
  }

  > div > p {
    margin-top: 3px;
    font-size: 13px;
    color: #616061;
  }
`;

const ViewAllButton = styled.button`
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background-color: #ffffff;
  color: #3f0e40;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: #3f0e40;
    background-color: #f4ede4;
  }
`;

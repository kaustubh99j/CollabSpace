import React from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import InsertCommentIcon from "@mui/icons-material/InsertComment";
import TagIcon from "@mui/icons-material/Tag";
import ChannelActivityList from "./ChannelActivityList";

function Threads() {
  const history = useHistory();

  return (
    <Page>
      <PageHeader>
        <HeaderTitle>
          <HeaderIcon>
            <InsertCommentIcon style={{ fontSize: 26 }} />
          </HeaderIcon>
          <div>
            <h2>Threads</h2>
            <p>
              All your channels and their latest conversations in one place.
            </p>
          </div>
        </HeaderTitle>
        <BrowseButton onClick={() => history.push("/channel-browser")}>
          <TagIcon fontSize="small" />
          Browse channels
        </BrowseButton>
      </PageHeader>

      <ChannelActivityList emptyMessage="Threads from your channels will appear here once conversations start." />
    </Page>
  );
}

export default Threads;

const Page = styled.div`
  box-sizing: border-box;
  min-height: 100%;
  padding: 32px 36px 48px;
  background-color: #f8f9fa;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  > div > h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1d1c1d;
  }

  > div > p {
    margin-top: 4px;
    font-size: 13px;
    color: #616061;
  }
`;

const HeaderIcon = styled.div`
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background-color: #f4ede4;
  color: #3f0e40;
`;

const BrowseButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 14px;
  border: none;
  border-radius: 6px;
  background-color: #3f0e40;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

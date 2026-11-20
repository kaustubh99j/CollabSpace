describe("CollabSpace User-Specific Access Control Logic", () => {
  const userA = { uid: "user_a_123", displayName: "Alice", email: "alice@example.com" };
  const userB = { uid: "user_b_456", displayName: "Bob", email: "bob@example.com" };
  const userC = { uid: "user_c_789", displayName: "Charlie", email: "charlie@example.com" };

  test("channels are restricted to explicit members", () => {
    const channel1 = {
      id: "room_1",
      name: "alice-private",
      createdBy: userA.uid,
      members: [userA.uid]
    };

    const channel2 = {
      id: "room_2",
      name: "shared-team",
      createdBy: userA.uid,
      members: [userA.uid, userB.uid]
    };

    const allChannels = [channel1, channel2];

    // Security rule simulation: request.auth.uid in resource.data.members
    const isAuthorized = (channel, userId) => {
      return Boolean(channel.members && channel.members.includes(userId));
    };

    // User A can access both
    expect(isAuthorized(channel1, userA.uid)).toBe(true);
    expect(isAuthorized(channel2, userA.uid)).toBe(true);

    // User B can only access channel 2
    expect(isAuthorized(channel1, userB.uid)).toBe(false);
    expect(isAuthorized(channel2, userB.uid)).toBe(true);

    // User C cannot access either channel
    expect(isAuthorized(channel1, userC.uid)).toBe(false);
    expect(isAuthorized(channel2, userC.uid)).toBe(false);

    // Filtered list for User B (Sidebar / ChannelBrowser query simulation)
    const userBChannels = allChannels.filter(c => isAuthorized(c, userB.uid));
    expect(userBChannels).toHaveLength(1);
    expect(userBChannels[0].id).toBe("room_2");
  });

  test("channel creation automatically includes creator in members", () => {
    const createChannelPayload = (name, currentUser, initialInvited = []) => {
      if (!currentUser || !currentUser.uid) {
        throw new Error("Unauthenticated");
      }
      return {
        name,
        createdBy: currentUser.uid,
        members: Array.from(new Set([currentUser.uid, ...initialInvited])),
        createdAt: new Date()
      };
    };

    const newChannel = createChannelPayload("alpha-project", userA, [userB.uid]);
    expect(newChannel.createdBy).toBe(userA.uid);
    expect(newChannel.members).toContain(userA.uid);
    expect(newChannel.members).toContain(userB.uid);
    expect(newChannel.members).not.toContain(userC.uid);
  });

  test("explicitly inviting a user grants them access", () => {
    let channel = {
      id: "room_1",
      name: "alice-notes",
      createdBy: userA.uid,
      members: [userA.uid]
    };

    const inviteMember = (chan, inviterId, newMemberId) => {
      // Security rule: Only existing members can update/invite
      if (!chan.members.includes(inviterId)) {
        throw new Error("Permission denied: only existing members can invite");
      }
      return {
        ...chan,
        members: [...chan.members, newMemberId]
      };
    };

    // User C cannot invite User B
    expect(() => inviteMember(channel, userC.uid, userB.uid)).toThrow();

    // User A (member/creator) invites User B
    channel = inviteMember(channel, userA.uid, userB.uid);
    expect(channel.members).toContain(userB.uid);
    expect(channel.members).toHaveLength(2);
  });

  test("removing a member revokes their access, but creator cannot be removed", () => {
    let channel = {
      id: "room_1",
      name: "sprint-collab",
      createdBy: userA.uid,
      members: [userA.uid, userB.uid]
    };

    const removeMember = (chan, requesterId, targetId) => {
      if (!chan.members.includes(requesterId)) {
        throw new Error("Permission denied");
      }
      if (targetId === chan.createdBy) {
        throw new Error("Cannot remove channel creator");
      }
      return {
        ...chan,
        members: chan.members.filter(id => id !== targetId)
      };
    };

    expect(() => removeMember(channel, userB.uid, userA.uid)).toThrow("Cannot remove channel creator");

    // Remove User B
    channel = removeMember(channel, userA.uid, userB.uid);
    expect(channel.members).not.toContain(userB.uid);
    expect(channel.members).toContain(userA.uid);
  });

  test("message posting requires room membership and stores author userId", () => {
    const channel = {
      id: "room_1",
      members: [userA.uid, userB.uid],
      createdBy: userA.uid
    };

    const createMessage = (chan, sender, text) => {
      if (!chan.members.includes(sender.uid)) {
        throw new Error("Permission denied: You are not a member of this room");
      }
      return {
        message: text,
        userId: sender.uid,
        user: sender.displayName,
        timestamp: new Date()
      };
    };

    // Authorized user can send
    const msg = createMessage(channel, userA, "Hello Bob!");
    expect(msg.userId).toBe(userA.uid);
    expect(msg.message).toBe("Hello Bob!");

    // Non-member cannot send
    expect(() => createMessage(channel, userC, "Hacking in...")).toThrow("Permission denied");
  });
});

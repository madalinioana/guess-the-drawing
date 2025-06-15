import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import socket from "../socket"; // your configured socket.io client

export default function AutoJoin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const roomId = searchParams.get("room");
    const username = searchParams.get("username");

    // If either param is missing, show a message or redirect back to Lobby
    if (!roomId || !username) {
      setError("Missing room or username. Please provide both.");
      return;
    }

    // Emit joinRoom to the server
    socket.emit("joinRoom", { roomId, username });

    // Listen for success or error feedback
    socket.once("roomJoined", ({ roomId: joinedRoomId, users }) => {
      navigate(`/room/${joinedRoomId}`);
    });

    socket.once("error", (msg) => {
      setError(msg);
    });

    // Cleanup on unmount
    return () => {
      socket.off("roomJoined");
      socket.off("error");
    };
  }, [searchParams, navigate]);

  if (error) {
    return <div style={{ padding: 20, color: "red" }}>{error}</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <p>Joining room… please wait.</p>
    </div>
  );
}

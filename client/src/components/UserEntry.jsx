import React from "react";
import HorizontalStack from "./util/HorizontalStack";
import UserAvatar from "./UserAvatar";
import { Typography } from "@mui/material";
import { Link } from "react-router-dom";

const UserEntry = ({ username, id }) => {
  return (
    <HorizontalStack justifyContent="space-between" key={id}>
      <HorizontalStack>
        <UserAvatar width={30} height={30} username={username} />
        <Typography>{username}</Typography>
      </HorizontalStack>
      <Link to={"/users/" + id}>View</Link>
    </HorizontalStack>
  );
};

export default UserEntry;

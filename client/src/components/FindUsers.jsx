import {
  Avatar,
  Card,
  Divider,
  IconButton,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { AiOutlineUser } from "react-icons/ai";
import { MdRefresh } from "react-icons/md";
import Loading from "./Loading";
import UserAvatar from "./UserAvatar";
import HorizontalStack from "./util/HorizontalStack";
import UserEntry from "./UserEntry";
import { getRandomUser } from "../api-axios/user";

const FindUsers = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getRandomUser();

    console.log(data)
    setLoading(false);
    setUsers(data.result);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClick = () => {
    fetchUsers();
  };

  return (
    <Card sx={{ overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          <HorizontalStack justifyContent="space-between">
            <HorizontalStack>
              <AiOutlineUser />
              <Typography>Find Others</Typography>
            </HorizontalStack>
            <IconButton
              sx={{ padding: 0 }}
              disabled={loading}
              onClick={handleClick}
            >
              <MdRefresh />
            </IconButton>
          </HorizontalStack>

          <Divider />
          {loading ? (
            <Loading />
          ) : (
            users &&
            users.map((user) => (
              <UserEntry username={user.name} id={user._id} key={user._id} />
            ))
          )}
        </Stack>
      </Box>
    </Card>
  );
};

export default FindUsers;

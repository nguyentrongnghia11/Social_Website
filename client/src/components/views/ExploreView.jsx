import { Button, Card, Container, Stack, Typography, Box, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";

import { isLoggedIn } from "../../helpers/authHelper";
import CreatePost from "../CreatePost";
import GridLayout from "../GridLayout";
import Loading from "../Loading";
import Navbar from "../Navbar";
import SortBySelect from "../SortBySelect";
import PostCard from "../PostCard";
import Sidebar from "../Sidebar";
import HorizontalStack from "../util/HorizontalStack";
import PostBrowser from "../PostBrowser";
import BannerDisplay from "../BannerDisplay";

const ExploreView = () => {
  return (
    <Box>
      <Container maxWidth="xl">
        <Grid container spacing={2} wrap="nowrap" alignItems="flex-start">
          <Grid item sx={{ display: { xs: "none", lg: "block" }, width: 250, mt: 10, flexShrink: 0 }}>
            <BannerDisplay position="left" />
          </Grid>

          <Grid item xs={12} lg sx={{ flexGrow: 1, minWidth: 0 }}>
            <Navbar />
            <Grid container spacing={2} sx={{ mt: 0 }}>
              <Grid item xs={12} md={8}>
                <PostBrowser createPost contentType="posts" />
              </Grid>
              <Grid item xs={12} md={4}>
                <Sidebar />
              </Grid>
            </Grid>
          </Grid>
          {/* 
          <Grid item sx={{ display: { xs: "none", lg: "block" }, width: 250, mt: 10, flexShrink: 0 }}>
            <BannerDisplay position="right" />
          </Grid> */}
        </Grid>
      </Container>
    </Box>
  );
};

export default ExploreView;

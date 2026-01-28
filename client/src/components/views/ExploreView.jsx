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
        <Grid container spacing={2}>
          <Grid item sx={{ display: { xs: "none", lg: "block" }, width: 250, mt: 10 }}>
            <BannerDisplay position="left" />
          </Grid>

          <Grid item xs={12} lg sx={{ flexGrow: 1 }}>
            <Navbar />
            <GridLayout
              left={<PostBrowser createPost contentType="posts" />}
              right={<Sidebar />}
            />
          </Grid>

          <Grid item sx={{ display: { xs: "none", lg: "block" }, width: 250, mt: 10 }}>
            <BannerDisplay position="right" />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ExploreView;

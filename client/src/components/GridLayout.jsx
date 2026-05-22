import { Grid } from "@mui/material";
import React from "react";

const GridLayout = ({ left, right }) => {
  return (
    <Grid container spacing={2} sx={{ mt: 0 }}>
      <Grid item xs={12} md={8}>
        {left}
      </Grid>

      <Grid item xs={12} md={4}>
        {right}
      </Grid>
    </Grid>
  );
};

export default GridLayout;
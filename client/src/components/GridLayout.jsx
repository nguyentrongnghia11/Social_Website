import { Grid } from "@mui/material";
import React from "react";

const GridLayout = (props) => {
  const { left, right } = props;

  return (
    <Grid container maxWidth="xl" spacing={2}>
      <Grid size={{ xs: 12, md: 8 }}>
        {left}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: "none", md: "block" } }}>
        {right}
      </Grid>
    </Grid>
  );
};

export default GridLayout;

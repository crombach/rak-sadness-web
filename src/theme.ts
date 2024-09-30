import { extendTheme } from "@mui/joy/styles";

declare module "@mui/joy/styles" {
  // No custom tokens found, you can skip the theme augmentation.
}

const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          "50": "#cddae4",
          "100": "#acc2d2",
          "200": "#8ba9c1",
          "300": "#6a91af",
          "400": "#507795",
          "500": "#375267", // base
          "600": "#2d4253", // button hover
          "700": "#243542", // active button
          "800": "#1b2832",
          "900": "#121b21",
        },
      },
    },
    dark: {
      palette: {
        primary: {
          "50": "#cddae4",
          "100": "#acc2d2",
          "200": "#8ba9c1",
          "300": "#6a91af",
          "400": "#507795",
          "500": "#375267", // base
          "600": "#2d4253", // button hover
          "700": "#243542", // active button
          "800": "#1b2832",
          "900": "#121b21",
        },
      },
    },
  },
});

export default theme;

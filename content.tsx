// ContentPage.js

import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import cssText from "data-text:~plasmo-overlay.css"
import type { PlasmoCSConfig, PlasmoCSUIProps } from "plasmo"
import React from "react"

import ContentPage from "~content-page/ContentPage"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*", "http://*/*"],
  exclude_matches: ["https://mui.com/*", "http://mui.com/*"],
  all_frames: true
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function ContentIndex({ anchor }: PlasmoCSUIProps) {
  const shadowContainer = anchor.element.firstElementChild.shadowRoot
  // console.log('container', container);
  // const shadowContainer = container.attachShadow({ mode: "open" })
  const emotionRoot = document.createElement("style")
  shadowContainer.appendChild(emotionRoot)

  const cache = createCache({
    key: "css",
    prepend: true,
    container: emotionRoot
  })

  const shadowTheme = createTheme({
    components: {
      MuiList: {
        defaultProps: {}
      },
      MuiListItem: {
        defaultProps: {}
      },
      MuiListItemButton: {
        defaultProps: {}
      },
      MuiSnackbar: {},
      MuiAlert: {},
      MuiDrawer: {},
      MuiPaper: {},
      MuiIconButton: {}
    }
  })

  return (
    <React.StrictMode>
      <CacheProvider value={cache}>
        <ThemeProvider theme={shadowTheme}>
          <ContentPage anchor={anchor} />
        </ThemeProvider>
      </CacheProvider>
    </React.StrictMode>
  )
}

export default ContentIndex

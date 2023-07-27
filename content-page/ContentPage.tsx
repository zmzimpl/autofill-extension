import CloseIcon from "@mui/icons-material/Close"
import CopyIcon from "@mui/icons-material/FileCopy"
import {
  Alert,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  Typography,
  styled
} from "@mui/material"
import type { PlasmoCSUIProps } from "plasmo"
import React, { useCallback, useEffect, useState } from "react"

import type { DefaultOptions } from "~default-options"
import storage from "~utils/storage"
import OpenAIAutofill from "./components/openai-autofill"

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  paddingLeft: theme.spacing(2),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "space-between"
}))

function ContentPage({ anchor }: PlasmoCSUIProps) {
  const [items, setItems] = useState([])
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [visible, setVisible] = React.useState(false)
  const [focusedElement, setFocusedElement] = React.useState(null)
  const [options, setOptions] = useState({});
  const container = anchor.element.querySelector('#plasmo-autofill').shadowRoot.querySelector(
    "#plasmo-shadow-container"
  )

  const [formInfoArray, setFormInfoArray] = useState([]);

  const handleFocus = (event) => {
    if (
      event.target.tagName === "INPUT" ||
      event.target.tagName === "TEXTAREA"
    ) {
      setFocusedElement(event.target)
    }
  }
  const handleActiveElement = () => {
    if (
      document?.activeElement?.tagName === "INPUT" ||
      document?.activeElement?.tagName === "TEXTAREA"
    ) {
      setFocusedElement(document.activeElement)
    }
  }

  useEffect(() => {
    const checkIfHasForms = async () => {
      const forms = document.getElementsByTagName("form")
      const options = (await storage.get("options")) as DefaultOptions;
      if (forms.length > 0 && options?.defaultVisible) {
        setVisible(true)
      }
      options && setOptions(options);
    }

    document.addEventListener("DOMContentLoaded", checkIfHasForms)

    return () => {
      document.removeEventListener("DOMContentLoaded", checkIfHasForms)
    }
  })

  useEffect(() => {
    if (visible) {
      container.classList.toggle("plasmo-sidebar-show", true)
      container.classList.remove("plasmo-sidebar-hide")
    } else {
      container.classList.toggle("plasmo-sidebar-hide", true)
      container.classList.remove("plasmo-sidebar-show")
    }
  }, [visible])

  useEffect(() => {
    const port = chrome.runtime.connect({ name: "contentScriptLoaded" })
    port.postMessage({ status: "loaded" })
  }, [])

  useEffect(() => {
    const handleEvent = (event) => {
      if (event.action === "toggleSidebar") {
        toggleVisible(!visible)
      } else if (event.action === 'formInfo') {
        setFormInfoArray(event.formInfoArray || []);
      }
    }

    const channel = chrome.runtime.onMessage

    channel.addListener(handleEvent)

    // 👇️ run function when component unmounts 👇️
    return () => {
      channel.removeListener(handleEvent)
    }
  }, [visible])

  useEffect(() => {
    handleActiveElement()

    document.addEventListener("focus", handleFocus, true)
    // 👇️ run function when component unmounts 👇️
    return () => {
      document.removeEventListener("focus", handleFocus)
    }
  }, [])

  useEffect(() => {
    // Load items from storage when the component mounts.
    storage.get("items").then((items: unknown) => {
      if (items) {
        setItems(items as any[])
      }
    })
  }, [])

  const handleClickItem = useCallback(
    (content) => {
      if (focusedElement) {
        focusedElement.value = content
        const inputEvent = new Event('input', { bubbles: true });
        const changeEvent  = new Event('change', { bubbles: true });
        focusedElement.dispatchEvent(inputEvent);
        focusedElement.dispatchEvent(changeEvent);
      }
    },
    [focusedElement]
  )

  const handleCopyItem = useCallback(async (content, event) => {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      setSnackbarOpen(true) // Open the snackbar to notify the user.
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }, [])

  const handleCloseSnackbar = useCallback(
    (event?: React.SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") {
        return
      }

      setSnackbarOpen(false)
    },
    []
  )

  const toggleVisible = useCallback((isVisible: boolean) => {
    setVisible(isVisible)
  }, [])

  return (
    <div id="autofill-content-page" style={{ zIndex: 2147483647 }}>
      {formInfoArray.map((form, index) => {
        return (<OpenAIAutofill key={index} options={options} list={items} form={form}></OpenAIAutofill>)
      })}
      <Drawer
        sx={{
          position: "fixed",
          right: 0,
          width: "300px",
          height: "100vh",
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: "300px"
          }
        }}
        variant="persistent"
        anchor="right"
        open={visible}>
        <DrawerHeader>
          <Typography variant="h5" component="div">
            Your Text List:
          </Typography>
          <IconButton onClick={() => toggleVisible(false)}>
            <CloseIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {items.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton onClick={() => handleClickItem(item.content)}>
                <ListItemText primary={item.name} />
                <IconButton
                  edge="end"
                  aria-label="copy"
                  sx={{ mr: 1 }}
                  onClick={(event) => handleCopyItem(item.content, event)}>
                  <CopyIcon />
                </IconButton>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          onClose={handleCloseSnackbar}>
          <Alert
            onClose={handleCloseSnackbar}
            severity="success"
            sx={{ width: "100%" }}>
            Copied!
          </Alert>
        </Snackbar>
      </Drawer>
    </div>
  )
}

export default ContentPage

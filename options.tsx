// SettingsPage.js

import DeleteIcon from "@mui/icons-material/Delete"
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  FormGroup,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography
} from "@mui/material"
import React, { useEffect, useState } from "react"

import type { DefaultOptions } from "~default-options"

import storage from "./utils/storage"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`
  }
}

function OptionsPage() {
  const [name, setName] = useState("")
  const [content, setContent] = useState("")
  const [items, setItems] = useState([])
  const [curTab, setCurTab] = React.useState(0)
  const [options, setOptions] = useState({ defaultVisible: false })

  useEffect(() => {}, [])

  const changeOptions = (ops) => {
    const newOptions = { ...options, ...ops }
    setOptions(newOptions)

    storage.set("options", newOptions)
  }

  useEffect(() => {
    // Load items from storage when the component mounts.
    // storage.set("items", []);
    storage.get("items").then((items: unknown) => {
      if (items) {
        console.log(items)
        setItems(items as any[])
      }
    })
    storage.get("options").then((options: unknown) => {
      if (options) {
        setOptions(options as DefaultOptions)
      }
    })
  }, [])

  const handleAddItem = () => {
    const newItems = [...items, { name, content }]
    setItems(newItems)
    setName("")
    setContent("")

    // Save the new items to storage.
    storage.set("items", newItems)
  }

  const handleDeleteItem = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)

    // Save the new items to storage.
    storage.set("items", newItems)
  }

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurTab(newValue)
  }

  return (
    
    <Box>
      <Box sx={{ width: "100%", bgcolor: "background.paper" }}>
        <Tabs value={curTab} onChange={handleChange} centered>
          <Tab label="Text List" {...a11yProps(0)} />
          <Tab label="Settings" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={curTab} index={0}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: "1rem",
            backgroundColor: "#f3f4f6",
            padding: "1rem"
          }}>
          <Card>
            <CardContent>
              <Stack spacing={2} direction="column">
                <Typography variant="h5" component="div">
                  Preset Your Text:
                </Typography>
                <TextField
                  fullWidth
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <Button
                  color="primary"
                  fullWidth={true}
                  variant="contained"
                  onClick={handleAddItem}>
                  Add Item
                </Button>
              </Stack>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ maxHeight: "900px", overflow: "auto" }}>
              <Typography variant="h5" component="div">
                Your Text List:
              </Typography>
              <List>
                {items.map((item, index) => (
                  <ListItem divider={true} key={index}>
                    <ListItemText
                      primary={item.name}
                      secondary={item.content}
                    />
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteItem(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </div>
      </CustomTabPanel>
      <CustomTabPanel value={curTab} index={1}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={options.defaultVisible}
                onChange={(event, checked) =>
                  changeOptions({ defaultVisible: checked })
                }
              />
            }
            labelPlacement="top"
            label="Open Sidebar If Has Form"
          />
        </FormGroup>
      </CustomTabPanel>
    </Box>
  )
}

export default OptionsPage

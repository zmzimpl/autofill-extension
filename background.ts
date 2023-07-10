chrome?.action?.onClicked?.addListener((extension) => {
  console.log(`action clicked: 666`, extension, chrome)
  try {
      chrome?.tabs?.sendMessage(extension.id, { action: "toggleSidebar" })
    } catch (error) {
    console.log('error', error);
  }
})

chrome?.runtime?.onConnect?.addListener((port) => {
  if (port.name === "contentScriptLoaded") {
    port.onMessage.addListener((msg) => {
      if (msg.status === "loaded") {
        console.log(`disconnect`, msg)
        port.disconnect()
      }
    })
  }
})

// chrome.commands.onCommand.addListener((command) => {
//   console.log(command);
// })

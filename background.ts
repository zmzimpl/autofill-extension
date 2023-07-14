chrome?.action?.onClicked?.addListener((extension) => {
  try {
    chrome?.tabs?.sendMessage(extension.id, { action: "toggleSidebar" })
  } catch (error) {
    console.log("error", error)
  }
})

chrome?.runtime?.onConnect?.addListener((port) => {
  if (port.name === "contentScriptLoaded") {
    port.onMessage.addListener((msg) => {
      if (msg.status === "loaded") {
        port.disconnect()
      }
    })
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        function: formInfoScript
      } as any)
      .then((results) => {
        // results 是一个结果对象数组，每个结果对象包含了注入的脚本的返回值
        // 由于我们只在一个标签页中注入了脚本，所以我们只需要获取第一个结果对象的结果
        const formInfoArray = results[0].result

        // 在这里，你可以将 formInfoArray 发送给你的 content script
        // 例如，你可以使用 chrome.tabs.sendMessage 方法
        chrome.tabs.sendMessage(tabId, { action: 'formInfo', formInfoArray })
      })
  }
})

function formInfoScript() {
  let formInfoArray = []

  const forms = document.getElementsByTagName("form")
  for (let i = 0; i < forms.length; i++) {
    const form = forms[i]
    let formInfo = { fields: [] }

    const inputs = form.getElementsByTagName("input")

    for (let j = 0; j < inputs.length; j++) {
      const input = inputs[j]
      const inputId = input.id

      // 常规的表单元素
      if (inputId) {
        const label = document.querySelector(`label[for="${inputId}"]`)

        if (label) {
          formInfo.fields.push({ field: inputId, label: label.textContent })
        }
      } else {
        // // 没有 id 的表单元素
        // const label = input.parentElement.querySelector("label")

        // if (label) {
        //   formInfo.fields.push({ field: input, label: label.textContent })
        // }
      }
    }

    formInfoArray.push(formInfo)
  }

  return formInfoArray
}

// chrome.commands.onCommand.addListener((command) => {
//   console.log(command);
// })

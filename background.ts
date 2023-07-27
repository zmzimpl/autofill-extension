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

  function isGoogleForm(url) {
    var regex = new RegExp("^https:\/\/docs\.google\.com\/forms\/d\/e\/.*\/viewform$");
    return regex.test(url);
  }

  const forms = document.getElementsByTagName("form")
  for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    let formSelector = `form[id="${form.id}"]`;
    if (!form.id) {
      // TODO: 如果没有 ID，则需要通过其他方式去捕获 form 的 dom，这里先置为空
      formSelector = '';
    }
    let formInfo = { fields: [], selector: formSelector }
    // foreach HTMLCollectionOf<HTMLInputElement> 
    const inputs = form.getElementsByTagName("input")
    const textreas = form.getElementsByTagName("textrea")

    for (let j = 0; j < inputs.length; j++) {
      const input = inputs[j]
      const inputId = input.id

      // 常规的 input 元素, 带 ID
      if (inputId) {
        const label = form.querySelector(`label[for="${inputId}"]`)

        if (label) {
          formInfo.fields.push({ selector: `input[id="${inputId}"]`, question: label.textContent })
        }
      } else {
        // 如果是谷歌表单
        if (isGoogleForm(location.href)) {
          if (input.className && input.getAttribute("type") !== 'hidden') {
            const labelId = input.getAttribute('aria-labelledby');
            const label = form.querySelector(`div[id="${labelId}"]`)
            formInfo.fields.push({ selector: `input[aria-labelledby="${labelId}"]`, question: label.textContent })
          }
        }
      }
    }
  
    for (let j = 0; j < textreas.length; j++) {
      const input = textreas[j]
      const inputId = input.id

      // 常规的 textrea 元素, 带 ID
      if (inputId) {
        const label = form.querySelector(`label[for="${inputId}"]`)

        if (label) {
          formInfo.fields.push({ selector: `input[id="${inputId}"]`, question: label.textContent })
        }
      } else {
        // 如果是谷歌表单
        if (isGoogleForm(location.href)) {
          if (input.className && input.getAttribute("type") !== 'hidden') {
            console.log(input)
            const labelId = input.getAttribute('aria-labelledby');
            const label = form.querySelector(`div[id="${labelId}"]`)
            formInfo.fields.push({ selector: `input[aria-labelledby="${labelId}"]`, question: label.textContent })
          }
        }
      }
    }

    formInfoArray.push(formInfo)
  }

  return formInfoArray
}


// chrome.commands.onCommand.addListener((command) => {
//   console.log(command);
// })

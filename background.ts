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
    document.addEventListener
  }
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("changeInfo", changeInfo)
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
        chrome.tabs.sendMessage(tabId, { action: "formInfo", formInfoArray })
      })
  }
})

function formInfoScript() {
  let formInfoArray = []

  function isGoogleForm(url: string) {
    const regex = new RegExp("^https://docs.google.com/forms/d/e/.*/viewform$")
    return regex.test(url)
  }

  function isTypoform(url: string) {
    const regex = new RegExp(
      "https?://[a-zA-Z0-9_-]+\\.typeform\\.com/to/[a-zA-Z0-9_]+"
    )
    return regex.test(url)
  }

  function isSurveyMonkeyForm(url) {
    const regex = new RegExp("^https://www.surveymonkey.com/r/.*$")
    return regex.test(url)
  }

  function attributesToSelector(dom) {
    let selector = dom.tagName.toLowerCase() // 获取元素的标签名

    for (let i = 0; i < dom.attributes.length; i++) {
      let attr = dom.attributes[i]

      // 检查属性是否应包含在选择器中，例如，不包括 'class', 'id' 这些，因为他们需要特殊处理
      if (attr.name !== "class" && attr.name !== "id") {
        selector += `[${attr.name}="${attr.value}"]` // 将属性添加到选择器
      }
    }

    // 处理类和ID
    if (dom.id) {
      selector += `#${dom.id}`
    }

    if (dom.classList.length > 0) {
      for (let i = 0; i < dom.classList.length; i++) {
        selector += `.${dom.classList[i]}`
      }
    }

    return selector
  }

  // typeform 表单没有 form 元素，所以需要单独处理
  if (isTypoform(location.href)) {
    // TODO: 这里需要处理 typeform 的表单
  } else {
    const forms = document.getElementsByTagName("form")
    for (let i = 0; i < forms.length; i++) {
      const form = forms[i]
      let formSelector = `form[id="${form.id}"]`
      if (!form.id) {
        // TODO: 如果没有 ID，则需要通过其他方式去捕获 form 的 dom，这里先置为空
        formSelector = attributesToSelector(form)
      }
      let formInfo = { fields: [], selector: formSelector }
      // foreach HTMLCollectionOf<HTMLInputElement>
      const inputs = form.getElementsByTagName("input")
      const textareas = form.getElementsByTagName("textarea")

      for (let j = 0; j < inputs.length; j++) {
        const input = inputs[j]
        const inputId = input.id

        // 常规的 input 元素, 带 ID
        if (inputId) {
          let label = form.querySelector(`label[for="${inputId}"]`)

          // survey monkey 的表单的 label 不是 for 属性
          if (isSurveyMonkeyForm(location.href)) {
            label = form
              .querySelector(`h4[id*="${inputId}"]`)
              ?.querySelector(`span[class*="user-generated notranslate"]`)
          }

          if (label) {
            formInfo.fields.push({
              selector: `input[id="${inputId}"]`,
              question: label.textContent
            })
          }
        } else {
          // 如果是谷歌表单
          if (isGoogleForm(location.href)) {
            if (input.className && input.getAttribute("type") !== "hidden") {
              const labelId = input.getAttribute("aria-labelledby")
              const label = form.querySelector(`div[id="${labelId}"]`)
              formInfo.fields.push({
                selector: `input[aria-labelledby="${labelId}"]`,
                question: label.textContent
              })
            }
          }
        }
      }

      for (let j = 0; j < textareas.length; j++) {
        const textarea = textareas[j]
        const textareaId = textarea.id

        // 常规的 textarea 元素, 带 ID
        if (textareaId) {
          const label = form.querySelector(`label[for="${textareaId}"]`)

          if (label) {
            formInfo.fields.push({
              selector: `textarea[id="${textareaId}"]`,
              question: label.textContent
            })
          }
        } else {
          // 如果是谷歌表单
          if (isGoogleForm(location.href)) {
            if (
              textarea.className &&
              textarea.getAttribute("type") !== "hidden"
            ) {
              console.log(textarea)
              const labelId = textarea.getAttribute("aria-labelledby")
              const label = form.querySelector(`div[id="${labelId}"]`)
              formInfo.fields.push({
                selector: `textarea[aria-labelledby="${labelId}"]`,
                question: label.textContent
              })
            }
          }
        }
      }

      formInfoArray.push(formInfo)
    }
  }

  return formInfoArray
}

// chrome.commands.onCommand.addListener((command) => {
//   console.log(command);
// })

import { BorderColor, Brush } from "@mui/icons-material"
import { CircularProgress, IconButton, Stack, Tooltip } from "@mui/material"
import { useChatCompletion } from "openai-streaming-hooks-fix"
import React, { useCallback, useEffect } from "react"

function OpenAIAutofill({ options, list, form }) {
  const ref = React.useRef(null)
  const { messages, submitPrompt, loading } = useChatCompletion({
    model: "gpt-3.5-turbo",
    apiKey: options.OPENAI_KEY,
    temperature: 0.5
  })

  const withdrawJson = (str: string) => {
    const regex = /\[\s*({[^}]*}\s*,\s*)*({[^}]*})?\s*\]/
    const jsonStr = str.match(regex)[0]
    return jsonStr || "[]"
  }

  const onSend = (preset: string) => {
    console.log("form", form)
    let promptText =
      preset +
      `${form?.fields?.map(
        (item, index) => `${index + 1}.${item?.question}?\n`
      )}`

    submitPrompt([{ content: promptText, role: "user" }])
  }

  const fillRandom = () => {
    const preset = `你是一个 mock 工具，正在填写一个表单，为以下问题mock对应的回答，请注意，你最终返回给我的只有一个数组对象，并且回答请简短，针对问题mock出对应答案即可，不要说一些你是AI之类的话，格式参考  [{ "question": "Your Wallet", "answer": "0x0000000000000000000000000000000000000000" }]，它是所有问题的集合，请注意，每个问题都需要你站在一个真实的人的角度去模拟答案，问题列表：`
    onSend(preset)
  }

  useEffect(() => {
    if (messages.length > 0) {
      const answer = messages[messages.length - 1].content
      if (!loading) {
        console.log("answer", answer)
        const jsonStr = withdrawJson(answer)
        console.log("jsonStr", jsonStr)
        const json = JSON.parse(jsonStr)
        const newForm = { ...form }
        newForm.fields = newForm.fields.map((item, index) => {
          item.answer = json[index].answer
          return item
        })
        const formRef = document.querySelector(form.selector)
        // fill answer to form
        newForm.fields.forEach((field) => {
          const inputRef = field.dom || formRef.querySelector(field.selector)
          if (inputRef && (!inputRef.value || (field.answer && list.find((item) => item.content === field.answer)))) {
            inputRef.value = field.answer
            const inputEvent = new Event("input", { bubbles: true })
            const changeEvent = new Event("change", { bubbles: true })
            inputRef.dispatchEvent(inputEvent)
            inputRef.dispatchEvent(changeEvent)
          } else {
            console.warn("😢Failed to fetch element, dom id may have changed dynamically", field.selector)
          }
        })
      }
    }
  }, [messages])

  useEffect(() => {
    // 先获取 dom, 避免 ID 变化导致无法获取
    if (form.fields) {
      const formRef = document.querySelector(form.selector)
      form.fields.forEach((field) => {
        const inputRef = formRef.querySelector(field.selector)
        field.dom = inputRef;
      })
    }
  }, [form])

  const position = useCallback(() => {
    let pos = {
      left: 0,
      top: 0,
      zIndex: -1,
      position: "absolute",
      display: "none"
    }
    if (form?.selector) {
      const formRef = document.querySelector(form.selector)
      const rect = formRef?.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const top = rect.top + scrollTop;
      pos = {
        left: rect?.x + rect?.width - 100,
        top: top + 12,
        position: "absolute",
        zIndex: 2147483647,
        display: "flex"
      }
      return pos
    } else {
      return pos
    }
  }, [form])

  const fillBaseList = () => {
    console.log("----fillBaseList----")
    const preset = `基于这个 json 的数据 ${JSON.stringify(
      list || []
    )}为以下问题生成对应的回答，回答为 json 中的 content，请注意，你最终返回给我的只有一个数组对象，格式为 [{ "question": "", "answer": "" }]，它是所有问题的集合。若存在 json 数据无法对应的问题，则该问题的回答为空字符串。问题列表：`
    onSend(preset)
  }

  const renderLoading = () => {
    return (
      <CircularProgress
        sx={{
          "--CircularProgress-size": "32px",
          "--CircularProgress-trackThickness": "5px",
          "--CircularProgress-progressThickness": "5px"
        }}
      />
    )
  }

  const renderButton = () => {
    return (
      <Stack direction="row" spacing={1}>
        <Tooltip title="Autofill Random">
          <IconButton
            color="primary"
            onClick={() => fillRandom()}
            aria-label="Autofill Random">
            <Brush />
          </IconButton>
        </Tooltip>
        <Tooltip title="Autofill base List">
          <IconButton
            color="primary"
            onClick={() => fillBaseList()}
            aria-label="Autofill base List">
            <BorderColor />
          </IconButton>
        </Tooltip>
      </Stack>
    )
  }
  return (
    <Stack direction="row" spacing={1} sx={position()}>
      {loading ? renderLoading() : renderButton()}
    </Stack>
  )
}

export default OpenAIAutofill

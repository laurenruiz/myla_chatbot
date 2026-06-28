'use client'

import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip } from '@mui/material'
import { useState, useRef, useEffect } from 'react'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import ReactMarkdown from 'react-markdown'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://your-portfolio-domain.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Woof woof! 🐾 I'm Myla, Lauren's dog! Ask me anything about my mom — her projects, experience, skills, or anything else you're curious about!",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState('English')
  const [feedback, setFeedback] = useState({})

  const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Italian',
    'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Russian',
    'Arabic', 'Hindi',
  ]

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);

    // Create an updated conversation history including the new user message and a placeholder for the AI's response.
    const updatedMessages = [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' }
    ];
    // Immediately update state so the UI shows the new user message.
    setMessages(updatedMessages);
    setMessage('');

    try {
      // Trim the conversation history to include only the last 6 messages (adjust as needed)
      const trimmedMessages = updatedMessages.slice(-6);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: trimmedMessages, language }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Read and stream the AI's response chunk-by-chunk
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { done: isDone, value } = await reader.read();
        done = isDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          // Update the last message (assistant's placeholder) by appending the new chunk
          setMessages(prevMessages => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            return [
              ...prevMessages.slice(0, -1),
              { ...lastMessage, content: lastMessage.content + chunk }
            ];
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." }
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const submitFeedback = async (index, rating, content) => {
    setFeedback(prev => ({ ...prev, [index]: rating }))
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageContent: content, rating, timestamp: new Date().toISOString() }),
      })
    } catch (err) {
      console.error('Failed to submit feedback:', err)
    }
  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="column"
        sx={{
          width: '500px',
          maxWidth: '500px',
          minWidth: 0,
          height: '700px',
          border: '1px solid black',
          p: 2,
          spacing: 3,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Stack
          direction="column"
          spacing={2}
          sx={{
            flexGrow: 1,
            width: '100%',
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'assistant' ? 'flex-start' : 'flex-end',
                width: '100%',
                minWidth: 0,
              }}
            >
              <Box
                sx={{
                  bgcolor: message.role === 'assistant' ? 'primary.main' : 'secondary.main',
                  color: 'white',
                  borderRadius: 2,
                  p: 3,
                  maxWidth: '80%',
                  minWidth: 0,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </Box>
              {message.role === 'assistant' && message.content && !isLoading && (
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, ml: 0.5 }}>
                  <Tooltip title="Helpful">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => submitFeedback(index, 'up', message.content)}
                        disabled={feedback[index] != null}
                        sx={{
                          fontSize: '0.9rem',
                          opacity: feedback[index] === 'up' ? 1 : feedback[index] === 'down' ? 0.3 : 1,
                          '&:hover': { opacity: 1 },
                        }}
                      >
                        <ThumbUpIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Not helpful">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => submitFeedback(index, 'down', message.content)}
                        disabled={feedback[index] != null}
                        sx={{
                          fontSize: '0.9rem',
                          opacity: feedback[index] === 'down' ? 1 : feedback[index] === 'up' ? 0.3 : 1,
                          '&:hover': { opacity: 1 },
                        }}
                      >
                        <ThumbDownIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              )}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <FormControl size="small" sx={{ minWidth: 130, alignSelf: 'flex-end' }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={language}
            label="Language"
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang} value={lang}>{lang}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Stack direction="row" spacing={2} sx={{ width: '100%', minWidth: 0 }}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
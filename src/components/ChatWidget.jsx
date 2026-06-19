import {useState, useRef, useEffect} from 'react'
import {useChatBot, QUICK_REPLIES} from '../hooks/useChatBot'
import { useNavigate } from 'react-router-dom'

const ChatWidget = () => {
    const {messages, isTyping, sendMessage} = useChatBot()
    const [open, setOpen] = useState(false)
    const [input, setInput] = useState('')
    const scrollRef = useRef(null)
    const navigate = useNavigate()


    useEffect( () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
   }, [messages, isTyping, open])
const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  return (
    <>
      {/* Floating bubble button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: '150px', right: '18px', zIndex: 100,
            width: '56px', height: '56px', borderRadius: '50%',
            background: '#C96E8A', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(201,110,138,0.45)',
            fontSize: '24px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Open chat assistant"
        >
          💬
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '18px', zIndex: 100,
          width: '340px', maxWidth: 'calc(100vw - 36px)',
          height: '460px', maxHeight: 'calc(100vh - 180px)',
          background: '#FAF7F4', borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(42,31,45,0.25)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          border: '1px solid #F0E8E4',
        }}>
          {/* Header */}
          <div style={{
            background: '#F9ECF1', padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #F0E0E8', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: '#C96E8A', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '16px', color: '#fff',
              }}>✨</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#2A1F2D' }}>HobbyFind Assistant</div>
                <div style={{ fontSize: '11px', color: '#7A6880' }}>Ask me to find something</div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A6880', fontSize: '20px', lineHeight: 1 }}
              aria-label="Close chat"
            >×</button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(m => (
              <div key={m.id} style={{
                alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.from === 'user' ? '#C96E8A' : '#fff',
                color: m.from === 'user' ? '#fff' : '#2A1F2D',
                border: m.from === 'user' ? 'none' : '1px solid #F0E8E4',
                borderRadius: '14px',
                padding: '10px 14px',
                fontSize: '13px',
                lineHeight: 1.4,
              }}>
                {m.text}
              </div>
            ))}
            {isTyping && (
              <div style={{
                alignSelf: 'flex-start', background: '#fff', border: '1px solid #F0E8E4',
                borderRadius: '14px', padding: '10px 14px', fontSize: '13px', color: '#7A6880',
              }}>
                Typing...
              </div>
            )}

            {/* Quick replies — only show after the welcome message, before user has chatted */}
            {messages.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q.label}
                    onClick={() => sendMessage(q.text)}
                    style={{
                      background: '#F9ECF1', color: '#C96E8A', border: '1px solid #F0C8D8',
                      borderRadius: '20px', padding: '7px 12px', fontSize: '12px',
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, system-ui, sans-serif',
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '8px', padding: '12px', borderTop: '1px solid #F0E8E4', background: '#fff', flexShrink: 0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              style={{
                flex: 1, background: '#FAF7F4', border: '1.5px solid #EDE5DC',
                borderRadius: '20px', padding: '9px 14px', fontSize: '13px',
                color: '#2A1F2D', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                background: input.trim() ? '#C96E8A' : '#EDE5DC',
                color: '#fff', border: 'none', borderRadius: '50%',
                width: '36px', height: '36px', cursor: input.trim() ? 'pointer' : 'default',
                fontSize: '15px', flexShrink: 0,
              }}
              aria-label="Send message"
            >→</button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatWidget

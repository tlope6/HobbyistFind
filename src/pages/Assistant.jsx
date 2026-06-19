import { useRef, useEffect, useState } from 'react'
import { useChatBot, QUICK_REPLIES } from '../hooks/useChatBot'

const Assistant = () => {
  const { messages, isTyping, sendMessage } = useChatBot()
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  return (
    <div style={{
      background: '#FAF7F4', minHeight: 'calc(100vh - 120px)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{ background: '#F9ECF1', padding: '20px 20px 16px', borderBottom: '1px solid #F0E0E8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: '#C96E8A', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', color: '#fff',
          }}>✨</div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#2A1F2D', fontFamily: 'Playfair Display, serif' }}>
              HobbyFind Assistant
            </div>
            <div style={{ fontSize: '12px', color: '#7A6880' }}>Find events, check your hobbies, get help</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            background: m.from === 'user' ? '#C96E8A' : '#fff',
            color: m.from === 'user' ? '#fff' : '#2A1F2D',
            border: m.from === 'user' ? 'none' : '1px solid #F0E8E4',
            borderRadius: '16px',
            padding: '12px 16px',
            fontSize: '14px',
            lineHeight: 1.5,
          }}>
            {m.text}
          </div>
        ))}
        {isTyping && (
          <div style={{
            alignSelf: 'flex-start', background: '#fff', border: '1px solid #F0E8E4',
            borderRadius: '16px', padding: '12px 16px', fontSize: '14px', color: '#7A6880',
          }}>
            Typing...
          </div>
        )}

        {messages.length === 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            {QUICK_REPLIES.map(q => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.text)}
                style={{
                  background: '#F9ECF1', color: '#C96E8A', border: '1px solid #F0C8D8',
                  borderRadius: '20px', padding: '9px 16px', fontSize: '13px',
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
      <div style={{ display: 'flex', gap: '10px', padding: '16px', borderTop: '1px solid #F0E8E4', background: '#fff' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask me to find events, check your hobbies..."
          style={{
            flex: 1, background: '#FAF7F4', border: '1.5px solid #EDE5DC',
            borderRadius: '24px', padding: '12px 18px', fontSize: '14px',
            color: '#2A1F2D', outline: 'none', fontFamily: 'DM Sans, system-ui, sans-serif',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            background: input.trim() ? '#C96E8A' : '#EDE5DC',
            color: '#fff', border: 'none', borderRadius: '50%',
            width: '44px', height: '44px', cursor: input.trim() ? 'pointer' : 'default',
            fontSize: '17px', flexShrink: 0,
          }}
        >→</button>
      </div>
    </div>
  )
}

export default Assistant

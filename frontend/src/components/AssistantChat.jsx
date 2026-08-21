import { useState } from 'react'

function AssistantChat({ token }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const handleAsk = async () => {
    if (!question.trim()) return

    const userQuestion = question
    setMessages((prev) => [...prev, { role: 'user', text: userQuestion }])
    setQuestion('')
    setLoading(true)

    try {
      const res = await fetch('http://localhost:8080/api/assistant/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: userQuestion }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', text: data.answer }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface border border-border-soft rounded-2xl p-6 shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-full bg-accent-secondary/10 border border-accent-secondary/30 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" className="text-accent-secondary">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4l3 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-display font-medium text-sm text-text-primary">
          Ask about your payments
        </p>
      </div>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-text-muted italic">
            Try asking: "Why did my last payment fail?"
          </p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm p-3 rounded-lg leading-relaxed ${
              msg.role === 'user'
                ? 'bg-accent-secondary/10 text-text-primary ml-8'
                : 'bg-ink border border-border-soft text-text-primary mr-8'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1.5 text-sm p-3 rounded-lg bg-ink border border-border-soft text-text-muted mr-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-secondary animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          className="flex-1 bg-ink border border-border-soft focus:border-accent-secondary rounded-lg px-3 py-2 text-sm text-text-primary outline-none transition-colors"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-accent-secondary hover:brightness-110 transition-all text-ink font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Ask
        </button>
      </div>
    </div>
  )
}

export default AssistantChat

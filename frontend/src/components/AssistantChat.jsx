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
    <div className="max-w-md mx-auto mt-10 bg-surface border border-border-soft rounded-2xl p-6">
      <p className="font-mono text-[11px] text-text-muted uppercase tracking-widest mb-4">
        Ask about your payments
      </p>

      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-text-muted italic">
            Try asking: "Why did my last payment fail?"
          </p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-brass/10 text-text-primary ml-6'
                : 'bg-ink text-text-muted mr-6'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="text-sm p-3 rounded-lg bg-ink text-text-muted mr-6 italic">
            Thinking...
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
          className="flex-1 bg-ink border border-border-soft rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="bg-brass hover:bg-brass-dim transition-colors text-ink font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Ask
        </button>
      </div>
    </div>
  )
}

export default AssistantChat

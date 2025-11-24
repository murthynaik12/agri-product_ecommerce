"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Support() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setFormData({ name: "", email: "", subject: "", message: "" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Support</h1>
        <p className="text-gray-600 mt-1">We're here to help! Get in touch with our support team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white border border-gray-200 text-center">
          <div className="text-3xl mb-2">📞</div>
          <h3 className="font-semibold text-gray-900">Phone</h3>
          <p className="text-gray-600 text-sm mt-2">+91 9876543210</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-200 text-center">
          <div className="text-3xl mb-2">📧</div>
          <h3 className="font-semibold text-gray-900">Email</h3>
          <p className="text-gray-600 text-sm mt-2">support@agritrade.com</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-200 text-center">
          <div className="text-3xl mb-2">⏰</div>
          <h3 className="font-semibold text-gray-900">Hours</h3>
          <p className="text-gray-600 text-sm mt-2">Mon-Fri, 9AM-6PM</p>
        </Card>
      </div>

      <Card className="p-6 bg-white border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Send us a Message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              required
              rows="5"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Send Message
          </Button>
          {submitted && <p className="text-green-600 text-center font-medium">Message sent successfully!</p>}
        </form>
      </Card>
    </div>
  )
}

"use client"
import { useState } from "react"
import type React from "react"

export default function AuthorizationLetterForm() {
  const [formData, setFormData] = useState({
    date: "",
    applicantName: "",
    representativeName: "",
    applicantId: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleClear = () => {
    setFormData({
      date: "",
      applicantName: "",
      representativeName: "",
      applicantId: "",
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">AUTHORIZATION LETTER</h1>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        {/* Date */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Salutation */}
        <div className="text-gray-700 space-y-4">
          <p className="font-semibold">To Whom It May Concern,</p>

          {/* Main Body */}
          <div className="space-y-4">
            <p>
              I,{" "}
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                placeholder="NAME OF APPLICANT"
                className="inline-block px-2 py-1 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none min-w-64"
              />{" "}
              authorize{" "}
              <input
                type="text"
                name="representativeName"
                value={formData.representativeName}
                onChange={handleChange}
                placeholder="NAME OF REPRESENTATIVE"
                className="inline-block px-2 py-1 border-b-2 border-gray-400 focus:border-blue-500 focus:outline-none min-w-64"
              />{" "}
              to act on my behalf relating to my application, including the signing of all documents required to obtain
              such clearance.
            </p>

            <p>Attached to this letter is a copy of my and my representative's government-issued ID.</p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-12 space-y-8">
          <div>
            <div className="border-b-2 border-gray-400 h-16 mb-2"></div>
            <p className="text-sm font-semibold text-gray-700">Signature of Applicant Over Printed Name</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ID No:</label>
            <input
              type="text"
              name="applicantId"
              value={formData.applicantId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 pt-6 border-t border-gray-300 no-print">
        <button
          onClick={handlePrint}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Print
        </button>
        <button
          onClick={handleClear}
          className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Clear Form
        </button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  )
}

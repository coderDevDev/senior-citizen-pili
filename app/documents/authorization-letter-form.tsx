"use client"
import { useState } from "react"
import type React from "react"

export default function AuthorizationLetterForm() {
  const [formData, setFormData] = useState({
    date: "",
    applicantName: "",
    representativeName: "",
    applicantSignature: "",
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
      applicantSignature: "",
      applicantId: "",
    })
  }

  return (
    <div className="bg-white min-h-screen p-8 md:p-12 font-serif">
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold tracking-widest">AUTHORIZATION LETTER</h1>
        </div>

        {/* Date - Right aligned */}
        <div className="flex justify-end mb-20">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-lg">Date:</span>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-48 border-b-2 border-black bg-transparent focus:outline-none px-2 py-2 text-base"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-10 text-justify leading-8">
          {/* Salutation */}
          <p className="text-base">To Whom It May Concern,</p>

          {/* Body Paragraph */}
          <div className="space-y-2">
            {/* First line: I, [applicant name] authorize */}
            <div className="flex items-baseline gap-2">
              <span className="text-base">I,</span>
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                className="flex-1 border-b-2 border-black bg-transparent focus:outline-none px-1 py-1 text-center text-base"
              />
              <span className="text-base">authorize</span>
            </div>
            <p className="text-xs font-bold text-center">NAME OF APPLICANT</p>

            {/* Second line: [representative name] to act on my */}
            <div className="flex items-baseline gap-2 mt-4">
              <input
                type="text"
                name="representativeName"
                value={formData.representativeName}
                onChange={handleChange}
                className="flex-1 border-b-2 border-black bg-transparent focus:outline-none px-1 py-1 text-center text-base"
              />
              <span className="text-base">to act on my</span>
            </div>
            <p className="text-xs font-bold text-center">NAME OF REPRESENTATIVE</p>

            {/* Continuation paragraph */}
            <p className="text-base indent-12 mt-6">
              behalf relating to my application, including the signing of all documents required to obtain such
              clearance.
            </p>
          </div>

          {/* Closing Paragraph */}
          <p className="text-base indent-12">
            Attached to this letter is a copy of my and my representative's government-issued ID.
          </p>
        </div>

        {/* Signature Section */}
        <div className="mt-24 space-y-12">
          {/* Signature Line */}
          <div className="flex justify-end">
            <div className="w-80 space-y-3">
              <input
                type="text"
                name="applicantSignature"
                value={formData.applicantSignature}
                onChange={handleChange}
                className="w-full border-b-2 border-black bg-transparent focus:outline-none px-2 py-2 text-base"
              />
              <p className="text-sm font-semibold text-right">Signature of Applicant Over Printed Name</p>
            </div>
          </div>

          {/* ID Number */}
          <div className="flex justify-end">
            <div className="w-80 flex items-center gap-6">
              <span className="font-semibold text-base">ID No:</span>
              <input
                type="text"
                name="applicantId"
                value={formData.applicantId}
                onChange={handleChange}
                className="flex-1 border-b-2 border-black bg-transparent focus:outline-none px-2 py-1 text-base"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-16 pt-8 border-t border-gray-300 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors text-base"
          >
            Print
          </button>
          <button
            onClick={handleClear}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-md transition-colors text-base"
          >
            Clear Form
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SocialPensionForm() {
  const [formData, setFormData] = useState({
    name: "",
    citizenship: "",
    address: "",
    age: "",
    sex: "",
    civilStatus: "",
    birthdate: "",
    birthplace: "",
    livingArrangement: "",
    educationalAttainment: "",
    oscaId: "",
    tin: "",
    gsis: "",
    sss: "",
    philhealth: "",
    others: "",
    isPensioner: "",
    pensionAmount: "",
    pensionSource: "",
    permanentIncome: "",
    familySupport: "",
    supportType: "",
    familyMembers: [
      { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
      { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
      { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
      { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
      { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
    ],
    hasIllness: "",
    illnessDetails: "",
    hospitalized: "",
    dateSubmitted: "",
    applicantSignature: "",
    receivedBySignature: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFamilyMemberChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const newMembers = [...prev.familyMembers]
      newMembers[index] = { ...newMembers[index], [field]: value }
      return { ...prev, familyMembers: newMembers }
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleReset = () => {
    setFormData({
      name: "",
      citizenship: "",
      address: "",
      age: "",
      sex: "",
      civilStatus: "",
      birthdate: "",
      birthplace: "",
      livingArrangement: "",
      educationalAttainment: "",
      oscaId: "",
      tin: "",
      gsis: "",
      sss: "",
      philhealth: "",
      others: "",
      isPensioner: "",
      pensionAmount: "",
      pensionSource: "",
      permanentIncome: "",
      familySupport: "",
      supportType: "",
      familyMembers: [
        { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
        { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
        { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
        { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
        { name: "", relationship: "", age: "", civilStatus: "", occupation: "", income: "" },
      ],
      hasIllness: "",
      illnessDetails: "",
      hospitalized: "",
      dateSubmitted: "",
      applicantSignature: "",
      receivedBySignature: "",
    })
  }

  return (
    <Card className="p-8 shadow-lg max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 text-center">
            <div className="mb-2">
              <p className="text-xs font-bold text-gray-900">DSWD</p>
              <p className="text-xs text-gray-700">Department of Social Welfare and Development</p>
            </div>
            <h1 className="text-sm font-bold text-gray-900 mb-1">SOCIAL PENSION FOR INDIGENT SENIOR CITIZENS</h1>
            <h2 className="text-base font-bold text-gray-900">APPLICATION FORM</h2>
          </div>
          <div className="ml-6 flex-shrink-0">
            <div className="w-24 h-24 border-2 border-gray-400 flex items-center justify-center bg-gray-50">
              <span className="text-xs text-gray-500 text-center px-2">1x1 picture</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form className="space-y-6 font-serif text-sm">
        {/* Section I: Basic Information */}
        <div>
          <div className="flex items-start gap-4 mb-4">
            <span className="font-bold text-gray-900 min-w-fit">I.</span>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-4">BASIC INFORMATION</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900 min-w-fit">Name:</span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900 min-w-fit">Citizenship:</span>
                    <input
                      type="text"
                      name="citizenship"
                      value={formData.citizenship}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 ml-0">(Last Name, First Name, Middle Name)</p>

                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">Address:</span>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                  />
                </div>
                <p className="text-xs text-gray-600">(House No. Street Barangay City/Municipality Province)</p>

                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900 min-w-fit">Age:</span>
                    <input
                      type="text"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900 min-w-fit">Sex:</span>
                    <input
                      type="text"
                      name="sex"
                      value={formData.sex}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900 min-w-fit">Civil Status:</span>
                    <input
                      type="text"
                      name="civilStatus"
                      value={formData.civilStatus}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900 min-w-fit">Birthdate:</span>
                    <input
                      type="date"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900 min-w-fit">Birthplace:</span>
                    <input
                      type="text"
                      name="birthplace"
                      value={formData.birthplace}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600">(Month, Date, Year)</p>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">Living Arrangement:</span>
                  <div className="flex gap-6 flex-1">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Owned</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Living Alone</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Living with relatives</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Rent</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mt-3">
                  <span className="font-medium text-gray-900 min-w-fit">Educational Attainment:</span>
                  <input
                    type="text"
                    name="educationalAttainment"
                    value={formData.educationalAttainment}
                    onChange={handleInputChange}
                    className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">ID Number:</span>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm">OSCA</span>
                        <input
                          type="text"
                          name="oscaId"
                          value={formData.oscaId}
                          onChange={handleInputChange}
                          className="w-24 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm">TIN</span>
                        <input
                          type="text"
                          name="tin"
                          value={formData.tin}
                          onChange={handleInputChange}
                          className="w-24 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm">GSIS</span>
                        <input
                          type="text"
                          name="gsis"
                          value={formData.gsis}
                          onChange={handleInputChange}
                          className="w-24 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm">SSS</span>
                        <input
                          type="text"
                          name="sss"
                          value={formData.sss}
                          onChange={handleInputChange}
                          className="w-24 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm">PhilHealth</span>
                        <input
                          type="text"
                          name="philhealth"
                          value={formData.philhealth}
                          onChange={handleInputChange}
                          className="w-24 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm">Others</span>
                        <input
                          type="text"
                          name="others"
                          value={formData.others}
                          onChange={handleInputChange}
                          className="w-24 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section II: Economic Status */}
        <div>
          <div className="flex items-start gap-4">
            <span className="font-bold text-gray-900 min-w-fit">II.</span>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-4">ECONOMIC STATUS</h3>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">Pensioner?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                  <span className="text-sm ml-4">If yes, how much?</span>
                  <input
                    type="text"
                    name="pensionAmount"
                    value={formData.pensionAmount}
                    onChange={handleInputChange}
                    className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">Source:</span>
                  <div className="flex gap-6 flex-1">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">GSIS</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">SSS</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">AFPSLAI</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Others</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">Permanent Source of Income?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">None</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">Regular Support from Family?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">Type of Support?</span>
                  <input
                    type="text"
                    name="supportType"
                    value={formData.supportType}
                    onChange={handleInputChange}
                    placeholder="Cash (How much and how often) / In kind(specify)"
                    className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section III: Family Composition */}
        <div>
          <div className="flex items-start gap-4">
            <span className="font-bold text-gray-900 min-w-fit">III.</span>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-4">Family Composition</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <thead>
                    <tr>
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Name</th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Relationship</th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Age</th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Civil Status</th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Occupation</th>
                      <th className="border border-gray-400 px-2 py-2 text-left font-semibold">Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.familyMembers.map((member, index) => (
                      <tr key={index}>
                        <td className="border border-gray-400 px-2 py-2">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleFamilyMemberChange(index, "name", e.target.value)}
                            className="w-full px-1 py-0 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-600 text-xs"
                          />
                        </td>
                        <td className="border border-gray-400 px-2 py-2">
                          <input
                            type="text"
                            value={member.relationship}
                            onChange={(e) => handleFamilyMemberChange(index, "relationship", e.target.value)}
                            className="w-full px-1 py-0 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-600 text-xs"
                          />
                        </td>
                        <td className="border border-gray-400 px-2 py-2">
                          <input
                            type="text"
                            value={member.age}
                            onChange={(e) => handleFamilyMemberChange(index, "age", e.target.value)}
                            className="w-full px-1 py-0 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-600 text-xs"
                          />
                        </td>
                        <td className="border border-gray-400 px-2 py-2">
                          <input
                            type="text"
                            value={member.civilStatus}
                            onChange={(e) => handleFamilyMemberChange(index, "civilStatus", e.target.value)}
                            className="w-full px-1 py-0 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-600 text-xs"
                          />
                        </td>
                        <td className="border border-gray-400 px-2 py-2">
                          <input
                            type="text"
                            value={member.occupation}
                            onChange={(e) => handleFamilyMemberChange(index, "occupation", e.target.value)}
                            className="w-full px-1 py-0 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-600 text-xs"
                          />
                        </td>
                        <td className="border border-gray-400 px-2 py-2">
                          <input
                            type="text"
                            value={member.income}
                            onChange={(e) => handleFamilyMemberChange(index, "income", e.target.value)}
                            className="w-full px-1 py-0 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-600 text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Section IV: Health Condition */}
        <div>
          <div className="flex items-start gap-4">
            <span className="font-bold text-gray-900 min-w-fit">IV.</span>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-4">HEALTH CONDITION</h3>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">Has existing illness?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                  <span className="text-sm ml-4">If yes, please specify:</span>
                  <input
                    type="text"
                    name="illnessDetails"
                    value={formData.illnessDetails}
                    onChange={handleInputChange}
                    className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900 min-w-fit">Hospitalized within the last six months?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certification Section */}
        <div className="border-t border-gray-400 pt-6 mt-8">
          <p className="text-sm text-gray-900 mb-6">
            I hereby certify that the above-mentioned information are true and correct to the best of my knowlwdge.
          </p>

          <div className="grid grid-cols-2 gap-12">
            <div>
              <div className="mb-12 border-b border-gray-400 h-12"></div>
              <p className="text-xs text-gray-900 font-medium">(Applicant's Signature over Printed Name)</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-sm font-medium">Date Submitted:</span>
                <input
                  type="date"
                  name="dateSubmitted"
                  value={formData.dateSubmitted}
                  onChange={handleInputChange}
                  className="flex-1 px-2 py-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <div className="mb-12 border-b border-gray-400 h-12"></div>
              <p className="text-xs text-gray-900 font-medium">(Signature over Printed Name and Designation)</p>
              <p className="text-xs text-gray-900 mt-2">Received by:</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200 print:hidden">
          <Button type="button" onClick={handleReset} variant="outline" className="px-6 py-2 bg-transparent">
            Clear Form
          </Button>
          {/* <Button type="button" onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white">
            Print Form
          </Button> */}
        </div>
      </form>
    </Card>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function NCSSApplicationForm() {
  const [formData, setFormData] = useState({
    rrnNumber: "",
    oscaIdNumber: "",
    lastName: "",
    givenName: "",
    middleName: "",
    dateOfBirth: "",
    age: "",
    residentialAddress: "",
    permanentAddress: "",
    sex: "",
    civilStatus: "",
    citizenship: "",
    dualCitizenDetails: "",
    spouseName: "",
    spouseCitizenship: "",
    children: Array(10).fill(""),
    authorizedReps: Array(3).fill({ name: "", relationship: "" }),
    contactNumbers: "",
    emailAddress: "",
    primaryBeneficiary: "",
    primaryRelationship: "",
    contingentBeneficiary: "",
    contingentRelationship: "",
    cashGiftUtilization: [],
    otherUtilization: "",
    applicantSignature: "",
    applicationDate: "",
    governmentId: "",
    idNumber: "",
    dateIssued: "",
    validUntil: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleChildChange = (index: number, value: string) => {
    const newChildren = [...formData.children]
    newChildren[index] = value
    setFormData((prev) => ({
      ...prev,
      children: newChildren,
    }))
  }

  const handleRepChange = (index: number, field: string, value: string) => {
    const newReps = [...formData.authorizedReps]
    newReps[index] = { ...newReps[index], [field]: value }
    setFormData((prev) => ({
      ...prev,
      authorizedReps: newReps,
    }))
  }

  const handleCheckboxChange = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      cashGiftUtilization: prev.cashGiftUtilization.includes(option)
        ? prev.cashGiftUtilization.filter((o) => o !== option)
        : [...prev.cashGiftUtilization, option],
    }))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleReset = () => {
    setFormData({
      rrnNumber: "",
      oscaIdNumber: "",
      lastName: "",
      givenName: "",
      middleName: "",
      dateOfBirth: "",
      age: "",
      residentialAddress: "",
      permanentAddress: "",
      sex: "",
      civilStatus: "",
      citizenship: "",
      dualCitizenDetails: "",
      spouseName: "",
      spouseCitizenship: "",
      children: Array(10).fill(""),
      authorizedReps: Array(3).fill({ name: "", relationship: "" }),
      contactNumbers: "",
      emailAddress: "",
      primaryBeneficiary: "",
      primaryRelationship: "",
      contingentBeneficiary: "",
      contingentRelationship: "",
      cashGiftUtilization: [],
      otherUtilization: "",
      applicantSignature: "",
      applicationDate: "",
      governmentId: "",
      idNumber: "",
      dateIssued: "",
      validUntil: "",
    })
  }

  return (
    <div className="w-full bg-white">
      {/* Header Section */}
      <div className="border-b-2 border-gray-400 pb-6 mb-6 px-8 pt-6">
        <div className="flex justify-between items-start gap-8">
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-700 mb-1">Annex "A"</p>
            <p className="text-xs text-gray-700 mb-1">Republic of the Philippines</p>
            <p className="text-xs text-gray-700 font-semibold mb-2">Office of the President</p>
            <h1 className="text-sm font-bold text-blue-700 mb-1">NATIONAL COMMISSION OF SENIOR CITIZENS</h1>
            <p className="text-xs text-gray-700 mb-1">
              4th Floor, AAP Tower, 683 Aurora Blvd, Mariana, 1117 Quezon City, Philippines
            </p>
            <p className="text-xs text-gray-700 mb-3">
              Official website: <span className="text-blue-600 underline">www.ncsc.gov.ph</span>
            </p>
            <h2 className="text-lg font-bold text-gray-900 mb-1">APPLICATION FORM</h2>
            <p className="text-xs font-semibold text-gray-900">
              OCTOGENARIAN, NONAGENARIAN AND CENTENARIAN BENEFIT PROGRAM
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form className="px-8 pb-8 space-y-4">
        {/* Purpose and Instructions */}
        <div className="flex gap-6 mb-4">
          {/* Left Column - Text Content */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-900 mb-1">
              PURPOSE: <span className="font-normal">To claim the benefits under Republic Act (R.A.) No. 11982.</span>
            </p>
            <p className="text-xs font-semibold text-gray-900 mb-1">INSTRUCTIONS:</p>
            <ol className="text-xs text-gray-700 space-y-0.5 ml-4 mb-2">
              <li>1. Fill out this form completely and correctly.</li>
              <li>2. Do not leave any blank space. If not applicable, kindly indicate "N/A".</li>
              <li>3. Write in CAPITAL letters.</li>
            </ol>
            <p className="text-xs font-semibold text-gray-900 mb-2">
              Applicant for milestone age: (Kindly check whichever applies)
            </p>
            <div className="flex gap-4 ml-4 mb-2">
              {["80", "85", "90", "95", "100"].map((age) => (
                <div key={age} className="flex items-center">
                  <input type="radio" id={`age-${age}`} name="milestoneAge" value={age} className="w-3 h-3" />
                  <label htmlFor={`age-${age}`} className="ml-1 text-xs text-gray-700">
                    ☐ {age}
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-700 font-semibold">This application form is not for sale.</p>
          </div>

          {/* Right Column - Picture Box */}
          <div className="w-32 h-40 border-2 border-gray-400 flex items-center justify-center bg-gray-50 flex-shrink-0">
            <span className="text-xs text-gray-600 text-center px-2">2X2 ID Picture</span>
          </div>
        </div>

        {/* Section A: Personal Information */}
        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">A. PERSONAL INFORMATION</h3>
          </div>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  NCSC REGISTRATION REFERENCE NUMBER (RRN) (Optional)
                </td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="rrnNumber"
                    value={formData.rrnNumber}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">OSCA ID NUMBER</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="oscaIdNumber"
                    value={formData.oscaIdNumber}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">A.1 LAST NAME</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">A.2 GIVEN NAME</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="givenName"
                    value={formData.givenName}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  A.3 MIDDLE NAME
                </td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  A.4 DATE OF BIRTH (Month/Day/Year)
                </td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">A.5 AGE</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  A.6 RESIDENTIAL ADDRESS/ADDRESS ABROAD
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="residentialAddress"
                    value={formData.residentialAddress}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                    placeholder="House Number    Street    Barangay    City/Municipality    Province    Zip Code"
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-gray-400 p-2 font-semibold bg-yellow-100">
                  A.7 PERMANENT ADDRESS IN THE PHILIPPINES
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                    placeholder="House Number    Street    Barangay    City/Municipality    Province    Zip Code"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">A.8 SEX</td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-3">
                    <label className="flex items-center text-xs">
                      <input type="radio" name="sex" value="Male" onChange={handleInputChange} className="w-3 h-3" />
                      <span className="ml-1">☐ Male</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="radio" name="sex" value="Female" onChange={handleInputChange} className="w-3 h-3" />
                      <span className="ml-1">☐ Female</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">A.9 CIVIL STATUS</td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2 flex-wrap">
                    <label className="flex items-center text-xs">
                      <input
                        type="radio"
                        name="civilStatus"
                        value="Single"
                        onChange={handleInputChange}
                        className="w-3 h-3"
                      />
                      <span className="ml-1">☐ Single</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input
                        type="radio"
                        name="civilStatus"
                        value="Married"
                        onChange={handleInputChange}
                        className="w-3 h-3"
                      />
                      <span className="ml-1">☐ Married</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input
                        type="radio"
                        name="civilStatus"
                        value="Widowed"
                        onChange={handleInputChange}
                        className="w-3 h-3"
                      />
                      <span className="ml-1">☐ Widowed</span>
                    </label>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">A.10 CITIZENSHIP</td>
                <td colSpan={3} className="border border-gray-400 p-2">
                  <div className="flex gap-3">
                    <label className="flex items-center text-xs">
                      <input
                        type="radio"
                        name="citizenship"
                        value="Filipino"
                        onChange={handleInputChange}
                        className="w-3 h-3"
                      />
                      <span className="ml-1">☐ Filipino</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input
                        type="radio"
                        name="citizenship"
                        value="Dual citizen"
                        onChange={handleInputChange}
                        className="w-3 h-3"
                      />
                      <span className="ml-1">☐ Dual citizen</span>
                    </label>
                  </div>
                  {formData.citizenship === "Dual citizen" && (
                    <input
                      type="text"
                      name="dualCitizenDetails"
                      value={formData.dualCitizenDetails}
                      onChange={handleInputChange}
                      placeholder="If dual citizen, kindly indicate details:"
                      className="w-full border-0 focus:outline-none text-xs mt-1"
                    />
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section B: Family Information */}
        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">B. FAMILY INFORMATION</h3>
          </div>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  B.1 NAME OF SPOUSE (LAST NAME, GIVEN NAME, MIDDLE NAME, EXT.)
                </td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="spouseName"
                    value={formData.spouseName}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">B.2 CITIZENSHIP</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="spouseCitizenship"
                    value={formData.spouseCitizenship}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  B.3 NAME OF CHILDREN (LAST NAME, GIVEN NAME, MIDDLE NAME, EXT.)
                </td>
              </tr>
              {formData.children.map((child, index) => (
                <tr key={index}>
                  <td className="border border-gray-400 p-2 text-xs font-semibold">{index + 1}</td>
                  <td colSpan={3} className="border border-gray-400 p-2">
                    <input
                      type="text"
                      value={child}
                      onChange={(e) => handleChildChange(index, e.target.value)}
                      className="w-full border-0 focus:outline-none text-xs"
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  B.4 AUTHORIZED REPRESENTATIVES (LAST NAME, GIVEN NAME, MIDDLE NAME, EXT.)
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">Name of Representatives</td>
                <td colSpan={3} className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  Relationship
                </td>
              </tr>
              {formData.authorizedReps.map((rep, index) => (
                <tr key={index}>
                  <td className="border border-gray-400 p-2">
                    <input
                      type="text"
                      value={rep.name}
                      onChange={(e) => handleRepChange(index, "name", e.target.value)}
                      className="w-full border-0 focus:outline-none text-xs"
                    />
                  </td>
                  <td colSpan={3} className="border border-gray-400 p-2">
                    <input
                      type="text"
                      value={rep.relationship}
                      onChange={(e) => handleRepChange(index, "relationship", e.target.value)}
                      className="w-full border-0 focus:outline-none text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section C: Contact Information */}
        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">C. CONTACT INFORMATION</h3>
          </div>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  C.1. CONTACT NUMBERS (TELEPHONE AND MOBILE NUMBERS)
                </td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="contactNumbers"
                    value={formData.contactNumbers}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">C.2 EMAIL ADDRESS</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section D: Designated Beneficiary */}
        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">D. DESIGNATED BENEFICIARY</h3>
          </div>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">D.1 PRIMARY</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="primaryBeneficiary"
                    value={formData.primaryBeneficiary}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">D.1.1 RELATIONSHIP</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="primaryRelationship"
                    value={formData.primaryRelationship}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">D.2 CONTINGENT</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="contingentBeneficiary"
                    value={formData.contingentBeneficiary}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">D.2.2 RELATIONSHIP</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="contingentRelationship"
                    value={formData.contingentRelationship}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section E: Utilization of Cash Gifts */}
        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">E. UTILIZATION OF CASH GIFTS</h3>
          </div>
          <div className="border border-gray-400 p-3">
            <div className="flex flex-wrap gap-4 text-xs">
              {["Food", "Medical check-up", "Medicines/Vitamins", "Livelihood", "Entrepreneurial Activities"].map(
                (option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.cashGiftUtilization.includes(option)}
                      onChange={() => handleCheckboxChange(option)}
                      className="w-3 h-3"
                    />
                    <span className="ml-1">☐ {option}</span>
                  </label>
                ),
              )}
            </div>
            <div className="mt-2">
              <label className="text-xs font-semibold">Others: (Kindly specify)</label>
              <input
                type="text"
                name="otherUtilization"
                value={formData.otherUtilization}
                onChange={handleInputChange}
                className="w-full border border-gray-300 px-2 py-1 text-xs mt-1"
              />
            </div>
          </div>
        </div>

        {/* Section F: Certification */}
        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">F. CERTIFICATION</h3>
          </div>
          <div className="border border-gray-400 p-3 text-xs leading-relaxed mb-3">
            <p>
              I hereby certify under oath that all the information in this application form are true and correct. I
              authorize the verification of the information provided in this form as well as the usage and processing of
              the information by the National Commission of Senior Citizens in accordance with the R.A. No. 10173,
              otherwise known as the "Data Privacy Act of 2012", its Implementing Rules and Regulations, and issuances
              of the National Privacy Commission. I further warrant that I have complied with all the requirements and I
              have presented all pertinent documentary requirements.
            </p>
          </div>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  NAME AND SIGNATURE/THUMBMARK OF APPLICANT
                </td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="text"
                    name="applicantSignature"
                    value={formData.applicantSignature}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs h-12"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">DATE OF APPLICATION</td>
                <td className="border border-gray-400 p-2">
                  <input
                    type="date"
                    name="applicationDate"
                    value={formData.applicationDate}
                    onChange={handleInputChange}
                    className="w-full border-0 focus:outline-none text-xs"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">G. DOCUMENTARY REQUIREMENTS (to be filled-up by NCSC personnel only)</h3>
          </div>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 font-semibold">Applicants</th>
                <th className="border border-gray-400 p-2 font-semibold">Requirements</th>
                <th className="border border-gray-400 p-2 font-semibold">Complied</th>
                <th className="border border-gray-400 p-2 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan={5} className="border border-gray-400 p-2 font-semibold bg-yellow-100">
                  Local Applicants
                </td>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold mb-1">a.) Duly accomplished "Annex A" application form</p>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold mb-1">b.) Any one (1) of the following primary documents:</p>
                  <ol className="list-decimal ml-4 text-xs space-y-1">
                    <li>
                      Certificate of Live Birth duly issued or authenticated by the Philippine Statistics Authority
                      (PSA)
                    </li>
                    <li>
                      Photocopy of Philippine Identification System ID card / Philippine ID card / National ID card
                      provided that the original copy must be presented
                    </li>
                  </ol>
                  <p className="text-xs mt-1 italic">
                    ***In the absence of primary ID/documents, any two (2) of the following secondary ID cards/documents
                    shall be submitted
                  </p>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold">c.) Recent 5.08 cm x 5.08 cm (2"x 2") ID picture</p>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold">
                    d.) Full body picture of the applicant printed on an A4 size bond/photo paper
                  </p>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold">
                    e.) Applicant's inclusion to the endorsed list for validation issued by the Local Chief Executive
                  </p>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td rowSpan={5} className="border border-gray-400 p-2 font-semibold bg-yellow-100">
                  Applicants Living Abroad
                </td>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold mb-1">a.) Duly accomplished "Annex A" application form</p>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold mb-1">b.) Any one (1) of the following primary documents:</p>
                  <ol className="list-decimal ml-4 text-xs space-y-1">
                    <li>Valid Philippine Passport</li>
                    <li>
                      Citizen Retention and Re-acquisition Certificate and Identification Certificate, or Order of
                      Approval, or Oath of Allegiance, or Certificate of Attestation duly issued by the Philippine
                      Embassy (PE) or Philippine Consulate General (PCG)
                    </li>
                  </ol>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold">c.) Recent 5.08 cm x 5.08 cm (2"x 2") ID picture</p>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold">
                    d.) Full body picture of the applicant printed on an A4 size bond/photo paper
                  </p>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2">
                  <p className="font-semibold">
                    e.) Applicant's inclusion to the endorsed list issued by the PE/Consulate or the DFA or the
                    Department of Migrant Workers (DMW) or the Commission on Filipinos Overseas (CFO)
                  </p>
                </td>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-2">
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">Yes</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      <span className="ml-1">No</span>
                    </label>
                  </div>
                </td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">
              H. VALIDATION ASSESSMENT REPORT (to be filled-up by NCSC personnel only)
            </h3>
          </div>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  H.1 FINDINGS/CONCERNS/RECOMMENDATIONS
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 h-24">
                  <textarea className="w-full h-full border-0 focus:outline-none text-xs resize-none" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">H.2 INITIAL ASSESSMENT</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2">
                  <div className="flex gap-4">
                    <label className="flex items-center text-xs">
                      <input type="radio" name="assessment" value="Eligible" className="w-3 h-3" />
                      <span className="ml-1">☐ Eligible</span>
                    </label>
                    <label className="flex items-center text-xs">
                      <input type="radio" name="assessment" value="Ineligible" className="w-3 h-3" />
                      <span className="ml-1">☐ Ineligible</span>
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">VALIDATED BY (to be filled-up by NCSC personnel only)</h3>
          </div>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">Name</td>
                <td className="border border-gray-400 p-2">
                  <input type="text" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">(Signature over printed name)</td>
                <td className="border border-gray-400 p-2 h-12">
                  <input type="text" className="w-full h-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">Date Validated</td>
                <td className="border border-gray-400 p-2">
                  <input type="date" className="w-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">APPLICANT NAME AND SIGNATURE</h3>
          </div>
          <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-2 font-semibold bg-gray-100">
                  NAME AND SIGNATURE/THUMBMARK OF APPLICANT
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-2 h-16">
                  <input type="text" className="w-full h-full border-0 focus:outline-none text-xs" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <div className="bg-blue-900 text-white px-3 py-2 mb-2">
            <h3 className="text-xs font-bold">DATA PRIVACY</h3>
          </div>
          <div className="border border-gray-400 p-3 text-xs leading-relaxed">
            <p>
              In compliance with the provisions of R.A. No. 10173, otherwise known as the "Data Privacy Act of 2012",
              its Implementing Rules and Regulations, and issuances of the National Privacy Commission, the National
              Commission of Senior Citizens ensures that the personal information provided is collected, used, and
              processed by its authorized personnel and shall only be used for the implementation of R.A. No. 11982.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end pt-4 print:hidden">
          <Button type="button" onClick={handleReset} variant="outline" className="px-6 py-2 bg-transparent">
            Clear Form
          </Button>
          {/* <Button type="button" onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white">
            Print Form
          </Button> */}
        </div>
      </form>
    </div>
  )
}

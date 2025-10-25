'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NCSSApplicationForm() {
  const [formData, setFormData] = useState({
    rrnNumber: '',
    oscaIdNumber: '',
    lastName: '',
    givenName: '',
    middleName: '',
    dateOfBirth: '',
    age: '',
    residentialAddress: '',
    permanentAddress: '',
    sex: '',
    civilStatus: '',
    citizenship: '',
    dualCitizenDetails: '',
    spouseName: '',
    spouseCitizenship: '',
    children: Array(10).fill(''),
    authorizedReps: Array(3).fill({ name: '', relationship: '' }),
    contactNumbers: '',
    emailAddress: '',
    primaryBeneficiary: '',
    primaryRelationship: '',
    contingentBeneficiary: '',
    contingentRelationship: '',
    cashGiftUtilization: [],
    otherUtilization: '',
    applicantSignature: '',
    applicationDate: '',
    governmentId: '',
    idNumber: '',
    dateIssued: '',
    validUntil: ''
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChildChange = (index: number, value: string) => {
    const newChildren = [...formData.children];
    newChildren[index] = value;
    setFormData(prev => ({
      ...prev,
      children: newChildren
    }));
  };

  const handleRepChange = (index: number, field: string, value: string) => {
    const newReps = [...formData.authorizedReps];
    newReps[index] = { ...newReps[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      authorizedReps: newReps
    }));
  };

  const handleCheckboxChange = (option: string) => {
    setFormData(prev => ({
      ...prev,
      cashGiftUtilization: prev.cashGiftUtilization.includes(option)
        ? prev.cashGiftUtilization.filter(o => o !== option)
        : [...prev.cashGiftUtilization, option]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setFormData({
      rrnNumber: '',
      oscaIdNumber: '',
      lastName: '',
      givenName: '',
      middleName: '',
      dateOfBirth: '',
      age: '',
      residentialAddress: '',
      permanentAddress: '',
      sex: '',
      civilStatus: '',
      citizenship: '',
      dualCitizenDetails: '',
      spouseName: '',
      spouseCitizenship: '',
      children: Array(10).fill(''),
      authorizedReps: Array(3).fill({ name: '', relationship: '' }),
      contactNumbers: '',
      emailAddress: '',
      primaryBeneficiary: '',
      primaryRelationship: '',
      contingentBeneficiary: '',
      contingentRelationship: '',
      cashGiftUtilization: [],
      otherUtilization: '',
      applicantSignature: '',
      applicationDate: '',
      governmentId: '',
      idNumber: '',
      dateIssued: '',
      validUntil: ''
    });
  };

  return (
    <Card className="p-8 shadow-lg">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
        <p className="text-xs text-gray-600 mb-2">Annex "A"</p>
        <p className="text-xs text-gray-600">Republic of the Philippines</p>
        <p className="text-xs text-gray-600">Office of the President</p>
        <h1 className="text-lg font-bold text-gray-900 mt-2">
          NATIONAL COMMISSION OF SENIOR CITIZENS
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          4th Floor, AAP Tower, 683 Aurora Blvd, Mariana, 1117 Quezon City,
          Philippines
        </p>
        <p className="text-xs text-gray-600">
          Official website: www.ncsc.gov.ph
        </p>
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          APPLICATION FORM
        </h2>
        <p className="text-sm text-gray-700 mt-2">
          OCTOGENARIAN, NONAGENARIAN AND CENTENARIAN BENEFIT PROGRAM
        </p>
      </div>

      {/* Form Content */}
      <form className="space-y-6">
        {/* Purpose and Instructions */}
        <div className="bg-gray-100 p-4 rounded-md">
          <p className="text-sm font-semibold text-gray-900 mb-2">PURPOSE:</p>
          <p className="text-sm text-gray-700 mb-4">
            To claim the benefits under Republic Act (R.A.) No. 11982.
          </p>
          <p className="text-sm font-semibold text-gray-900 mb-2">
            INSTRUCTIONS:
          </p>
          <ul className="text-sm text-gray-700 space-y-1 ml-4">
            <li>1. Fill out this form completely and correctly.</li>
            <li>
              2. Do not leave any blank space. If not applicable, kindly
              indicate "N/A".
            </li>
            <li>3. Write in CAPITAL letters.</li>
          </ul>
        </div>

        {/* Milestone Age Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Applicant for milestone age: (Kindly check whichever applies)
          </label>
          <div className="flex gap-6 flex-wrap">
            {['80', '85', '90', '95', '100'].map(age => (
              <div key={age} className="flex items-center">
                <input
                  type="radio"
                  id={`age-${age}`}
                  name="milestoneAge"
                  value={age}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor={`age-${age}`}
                  className="ml-2 text-sm text-gray-700">
                  {age}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Section A: Personal Information */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            A. PERSONAL INFORMATION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NCSC REGISTRATION REFERENCE NUMBER (RRN) (Optional)
              </label>
              <input
                type="text"
                name="rrnNumber"
                value={formData.rrnNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OSCA ID NUMBER
              </label>
              <input
                type="text"
                name="oscaIdNumber"
                value={formData.oscaIdNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                A.1 LAST NAME
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                A.2 GIVEN NAME
              </label>
              <input
                type="text"
                name="givenName"
                value={formData.givenName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                A.3 MIDDLE NAME
              </label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                A.4 DATE OF BIRTH (Month/Day/Year)
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                A.5 AGE
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              A.6 RESIDENTIAL ADDRESS/ADDRESS ABROAD
            </label>
            <input
              type="text"
              name="residentialAddress"
              value={formData.residentialAddress}
              onChange={handleInputChange}
              placeholder="House Number, Street, Barangay, City/Municipality, Province, Zip Code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              A.7 PERMANENT ADDRESS IN THE PHILIPPINES
            </label>
            <input
              type="text"
              name="permanentAddress"
              value={formData.permanentAddress}
              onChange={handleInputChange}
              placeholder="House Number, Street, Barangay, City/Municipality, Province, Zip Code"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                A.8 SEX
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="male"
                    name="sex"
                    value="Male"
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="male" className="ml-2 text-sm text-gray-700">
                    Male
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="female"
                    name="sex"
                    value="Female"
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="female"
                    className="ml-2 text-sm text-gray-700">
                    Female
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                A.9 CIVIL STATUS
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="single"
                    name="civilStatus"
                    value="Single"
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="single"
                    className="ml-2 text-sm text-gray-700">
                    Single
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="married"
                    name="civilStatus"
                    value="Married"
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="married"
                    className="ml-2 text-sm text-gray-700">
                    Married
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="widowed"
                    name="civilStatus"
                    value="Widowed"
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="widowed"
                    className="ml-2 text-sm text-gray-700">
                    Widowed
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              A.10 CITIZENSHIP
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="filipino"
                  name="citizenship"
                  value="Filipino"
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="filipino"
                  className="ml-2 text-sm text-gray-700">
                  Filipino
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="dualcitizen"
                  name="citizenship"
                  value="Dual Citizen"
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="dualcitizen"
                  className="ml-2 text-sm text-gray-700">
                  Dual Citizen
                </label>
              </div>
              {formData.citizenship === 'Dual Citizen' && (
                <input
                  type="text"
                  name="dualCitizenDetails"
                  value={formData.dualCitizenDetails}
                  onChange={handleInputChange}
                  placeholder="If dual citizen, kindly indicate details"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
              )}
            </div>
          </div>
        </div>

        {/* Section B: Family Information */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            B. FAMILY INFORMATION
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                B.1 NAME OF SPOUSE
              </label>
              <input
                type="text"
                name="spouseName"
                value={formData.spouseName}
                onChange={handleInputChange}
                placeholder="LAST NAME, GIVEN NAME, MIDDLE NAME, EXT."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                B.2 CITIZENSHIP
              </label>
              <input
                type="text"
                name="spouseCitizenship"
                value={formData.spouseCitizenship}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              B.3 NAME OF CHILDREN (LAST NAME, GIVEN NAME, MIDDLE NAME, EXT.)
            </label>
            <div className="space-y-2">
              {formData.children.map((child, index) => (
                <input
                  key={index}
                  type="text"
                  value={child}
                  onChange={e => handleChildChange(index, e.target.value)}
                  placeholder={`Child ${index + 1}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              B.4 AUTHORIZED REPRESENTATIVES
            </label>
            <div className="space-y-3">
              {formData.authorizedReps.map((rep, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={rep.name}
                    onChange={e =>
                      handleRepChange(index, 'name', e.target.value)
                    }
                    placeholder={`Representative ${index + 1} Name`}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={rep.relationship}
                    onChange={e =>
                      handleRepChange(index, 'relationship', e.target.value)
                    }
                    placeholder="Relationship"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section C: Contact Information */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            C. CONTACT INFORMATION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                C.1 CONTACT NUMBERS (TELEPHONE AND MOBILE NUMBERS)
              </label>
              <input
                type="text"
                name="contactNumbers"
                value={formData.contactNumbers}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                C.2 EMAIL ADDRESS
              </label>
              <input
                type="email"
                name="emailAddress"
                value={formData.emailAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section D: Designated Beneficiary */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            D. DESIGNATED BENEFICIARY
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                D.1 PRIMARY
              </label>
              <input
                type="text"
                name="primaryBeneficiary"
                value={formData.primaryBeneficiary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                D.1.1 RELATIONSHIP
              </label>
              <input
                type="text"
                name="primaryRelationship"
                value={formData.primaryRelationship}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                D.2 CONTINGENT
              </label>
              <input
                type="text"
                name="contingentBeneficiary"
                value={formData.contingentBeneficiary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                D.2.2 RELATIONSHIP
              </label>
              <input
                type="text"
                name="contingentRelationship"
                value={formData.contingentRelationship}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section E: Utilization of Cash Gifts */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            E. UTILIZATION OF CASH GIFTS
          </h3>
          <div className="space-y-2">
            {[
              'Food',
              'Medical check-up',
              'Medicines/Vitamins',
              'Livelihood',
              'Entrepreneurial Activities'
            ].map(option => (
              <div key={option} className="flex items-center">
                <input
                  type="checkbox"
                  id={option}
                  checked={formData.cashGiftUtilization.includes(option)}
                  onChange={() => handleCheckboxChange(option)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor={option} className="ml-2 text-sm text-gray-700">
                  {option}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Others: (Kindly specify)
            </label>
            <input
              type="text"
              name="otherUtilization"
              value={formData.otherUtilization}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section F: Certification */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            F. CERTIFICATION
          </h3>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            I hereby certify under oath that all the information in this
            application form are true and correct. I authorize the verification
            of the information provided in this form as well as the usage and
            processing of the information by the National Commission of Senior
            Citizens in accordance with the R.A. No. 10173, otherwise known as
            the "Data Privacy Act of 2012", its Implementing Rules and
            Regulations, and issuances of the National Privacy Commission. I
            further warrant that I have complied with all the requirements and I
            have presented all pertinent documentary requirements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NAME AND SIGNATURE/THUMBMARK OF APPLICANT
              </label>
              <input
                type="text"
                name="applicantSignature"
                value={formData.applicantSignature}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DATE OF APPLICATION
              </label>
              <input
                type="date"
                name="applicationDate"
                value={formData.applicationDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Government ID Section */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            GOVERNMENT ID INFORMATION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Government ID:
              </label>
              <input
                type="text"
                name="governmentId"
                value={formData.governmentId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Number:
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Issued:
              </label>
              <input
                type="date"
                name="dateIssued"
                value={formData.dateIssued}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until:
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end pt-6 border-t border-gray-200 print:hidden">
          <Button
            type="button"
            onClick={handleReset}
            variant="outline"
            className="px-6 py-2 bg-transparent">
            Clear Form
          </Button>
          {/* <Button type="button" onClick={handlePrint} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white">
            Print Form
          </Button> */}
        </div>
      </form>
    </Card>
  );
}

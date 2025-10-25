'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SocialPensionForm() {
  const [formData, setFormData] = useState({
    name: '',
    citizenship: '',
    address: '',
    age: '',
    sex: '',
    civilStatus: '',
    birthdate: '',
    birthplace: '',
    livingArrangement: '',
    educationalAttainment: '',
    oscaId: '',
    tin: '',
    gsis: '',
    sss: '',
    philhealth: '',
    others: '',
    isPensioner: '',
    pensionAmount: '',
    pensionSource: '',
    permanentIncome: '',
    familySupport: '',
    supportType: '',
    familyMembers: [
      {
        name: '',
        relationship: '',
        age: '',
        civilStatus: '',
        occupation: '',
        income: ''
      },
      {
        name: '',
        relationship: '',
        age: '',
        civilStatus: '',
        occupation: '',
        income: ''
      },
      {
        name: '',
        relationship: '',
        age: '',
        civilStatus: '',
        occupation: '',
        income: ''
      }
    ],
    hasIllness: '',
    illnessDetails: '',
    hospitalized: '',
    dateSubmitted: '',
    applicantSignature: '',
    receivedBySignature: ''
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFamilyMemberChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData(prev => {
      const newMembers = [...prev.familyMembers];
      newMembers[index] = { ...newMembers[index], [field]: value };
      return { ...prev, familyMembers: newMembers };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setFormData({
      name: '',
      citizenship: '',
      address: '',
      age: '',
      sex: '',
      civilStatus: '',
      birthdate: '',
      birthplace: '',
      livingArrangement: '',
      educationalAttainment: '',
      oscaId: '',
      tin: '',
      gsis: '',
      sss: '',
      philhealth: '',
      others: '',
      isPensioner: '',
      pensionAmount: '',
      pensionSource: '',
      permanentIncome: '',
      familySupport: '',
      supportType: '',
      familyMembers: [
        {
          name: '',
          relationship: '',
          age: '',
          civilStatus: '',
          occupation: '',
          income: ''
        },
        {
          name: '',
          relationship: '',
          age: '',
          civilStatus: '',
          occupation: '',
          income: ''
        },
        {
          name: '',
          relationship: '',
          age: '',
          civilStatus: '',
          occupation: '',
          income: ''
        }
      ],
      hasIllness: '',
      illnessDetails: '',
      hospitalized: '',
      dateSubmitted: '',
      applicantSignature: '',
      receivedBySignature: ''
    });
  };

  return (
    <Card className="p-8 shadow-lg">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
        <h1 className="text-lg font-bold text-gray-900">
          SOCIAL PENSION FOR INDIGENT SENIOR CITIZENS
        </h1>
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          APPLICATION FORM
        </h2>
      </div>

      {/* Form Content */}
      <form className="space-y-8">
        {/* Section I: Basic Information */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
            I. BASIC INFORMATION
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name:
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Last Name, First Name, Middle Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Citizenship:
                </label>
                <input
                  type="text"
                  name="citizenship"
                  value={formData.citizenship}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address:
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="House No. Street Barangay City/Municipality Province"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age:
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sex:
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Civil Status:
                </label>
                <select
                  name="civilStatus"
                  value={formData.civilStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birthdate:
                </label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birthplace:
                </label>
                <input
                  type="text"
                  name="birthplace"
                  value={formData.birthplace}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Living Arrangement:
                </label>
                <select
                  name="livingArrangement"
                  value={formData.livingArrangement}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="Owned">Owned</option>
                  <option value="Rent">Rent</option>
                  <option value="Living Alone">Living Alone</option>
                  <option value="Living with relatives">
                    Living with relatives
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Educational Attainment:
                </label>
                <input
                  type="text"
                  name="educationalAttainment"
                  value={formData.educationalAttainment}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                ID Numbers:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="oscaId"
                  value={formData.oscaId}
                  onChange={handleInputChange}
                  placeholder="OSCA ID"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="tin"
                  value={formData.tin}
                  onChange={handleInputChange}
                  placeholder="TIN"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="gsis"
                  value={formData.gsis}
                  onChange={handleInputChange}
                  placeholder="GSIS"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="sss"
                  value={formData.sss}
                  onChange={handleInputChange}
                  placeholder="SSS"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="philhealth"
                  value={formData.philhealth}
                  onChange={handleInputChange}
                  placeholder="PhilHealth"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="others"
                  value={formData.others}
                  onChange={handleInputChange}
                  placeholder="Others"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section II: Economic Status */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
            II. ECONOMIC STATUS
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pensioner?
                </label>
                <select
                  name="isPensioner"
                  value={formData.isPensioner}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  If yes, how much?
                </label>
                <input
                  type="text"
                  name="pensionAmount"
                  value={formData.pensionAmount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pension Source:
              </label>
              <div className="space-y-2">
                {['GSIS', 'SSS', 'AFPSLAI', 'Others'].map(source => (
                  <div key={source} className="flex items-center">
                    <input
                      type="radio"
                      id={source}
                      name="pensionSource"
                      value={source}
                      checked={formData.pensionSource === source}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <label
                      htmlFor={source}
                      className="ml-2 text-sm text-gray-700">
                      {source}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permanent Source of Income?
                </label>
                <select
                  name="permanentIncome"
                  value={formData.permanentIncome}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Regular Support from Family?
                </label>
                <select
                  name="familySupport"
                  value={formData.familySupport}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type of Support:
              </label>
              <textarea
                name="supportType"
                value={formData.supportType}
                onChange={handleInputChange}
                placeholder="Cash (How much and how often) / In kind (specify)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section III: Family Composition */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
            III. FAMILY COMPOSITION
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-sm font-semibold text-left">
                    Name
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-sm font-semibold text-left">
                    Relationship
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-sm font-semibold text-left">
                    Age
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-sm font-semibold text-left">
                    Civil Status
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-sm font-semibold text-left">
                    Occupation
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-sm font-semibold text-left">
                    Income
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.familyMembers.map((member, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="text"
                        value={member.name}
                        onChange={e =>
                          handleFamilyMemberChange(
                            index,
                            'name',
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="text"
                        value={member.relationship}
                        onChange={e =>
                          handleFamilyMemberChange(
                            index,
                            'relationship',
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="text"
                        value={member.age}
                        onChange={e =>
                          handleFamilyMemberChange(index, 'age', e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="text"
                        value={member.civilStatus}
                        onChange={e =>
                          handleFamilyMemberChange(
                            index,
                            'civilStatus',
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="text"
                        value={member.occupation}
                        onChange={e =>
                          handleFamilyMemberChange(
                            index,
                            'occupation',
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="text"
                        value={member.income}
                        onChange={e =>
                          handleFamilyMemberChange(
                            index,
                            'income',
                            e.target.value
                          )
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section IV: Health Condition */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
            IV. HEALTH CONDITION
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Has existing illness?
                </label>
                <select
                  name="hasIllness"
                  value={formData.hasIllness}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  If yes, please specify:
                </label>
                <input
                  type="text"
                  name="illnessDetails"
                  value={formData.illnessDetails}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospitalized within the last six months?
              </label>
              <select
                name="hospitalized"
                value={formData.hospitalized}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Certification Section */}
        <div className="border-t-2 border-gray-300 pt-6">
          <p className="text-sm text-gray-700 mb-4">
            I hereby certify that the above-mentioned information are true and
            correct to the best of my knowledge.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Submitted:
              </label>
              <input
                type="date"
                name="dateSubmitted"
                value={formData.dateSubmitted}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-12 border-t border-gray-400 pt-2">
                <p className="text-xs text-gray-600">
                  Applicant's Signature over Printed Name
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Received by:
              </label>
              <input
                type="text"
                name="receivedBySignature"
                value={formData.receivedBySignature}
                onChange={handleInputChange}
                placeholder="Signature over Printed Name and Designation"
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

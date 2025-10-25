'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OSCAEndorsementForm() {
  const [formData, setFormData] = useState({
    date: '',
    fromName: '',
    fromPosition: '',
    toName: '',
    toPosition: '',
    subject: '',
    purpose: '',
    recommendedAction: [],
    remarks: '',
    endorsedByName: '',
    endorsedByPosition: '',
    receivedByName: '',
    receivedByPosition: ''
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

  const handleCheckboxChange = (action: string) => {
    setFormData(prev => ({
      ...prev,
      recommendedAction: prev.recommendedAction.includes(action)
        ? prev.recommendedAction.filter(a => a !== action)
        : [action]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setFormData({
      date: '',
      fromName: '',
      fromPosition: '',
      toName: '',
      toPosition: '',
      subject: '',
      purpose: '',
      recommendedAction: [],
      remarks: '',
      endorsedByName: '',
      endorsedByPosition: '',
      receivedByName: '',
      receivedByPosition: ''
    });
  };

  return (
    <Card className="p-8 shadow-lg">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
        <h1 className="text-lg font-bold text-gray-900">
          Office for the Senior Citizens Affairs (OSCA)
        </h1>
        <p className="text-sm text-gray-700 mt-1">
          Municipality of Pili, Camarines Sur
        </p>
        <h2 className="text-xl font-bold text-gray-900 mt-4">
          ENDORSEMENT FORM
        </h2>
      </div>

      {/* Form Content */}
      <form className="space-y-6">
        {/* Date */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Date:
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* From Section */}
        <div className="border-l-4 border-blue-500 pl-4 py-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">From:</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name:
              </label>
              <input
                type="text"
                name="fromName"
                value={formData.fromName}
                onChange={handleInputChange}
                placeholder="Enter name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position/Office:
              </label>
              <input
                type="text"
                name="fromPosition"
                value={formData.fromPosition}
                onChange={handleInputChange}
                placeholder="Enter position/office"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* To Section */}
        <div className="border-l-4 border-green-500 pl-4 py-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">To:</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name:
              </label>
              <input
                type="text"
                name="toName"
                value={formData.toName}
                onChange={handleInputChange}
                placeholder="Enter name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position/Office:
              </label>
              <input
                type="text"
                name="toPosition"
                value={formData.toPosition}
                onChange={handleInputChange}
                placeholder="Enter position/office"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Subject:
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            placeholder="Endorsement of..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Purpose / Reason for Endorsement */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Purpose / Reason for Endorsement:
          </label>
          <textarea
            name="purpose"
            value={formData.purpose}
            onChange={handleInputChange}
            placeholder="Enter purpose or reason"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Recommended Action */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Recommended Action:
          </label>
          <div className="space-y-2">
            {['Approve', 'For Review', 'For Information'].map(action => (
              <div key={action} className="flex items-center">
                <input
                  type="checkbox"
                  id={action}
                  checked={formData.recommendedAction.includes(action)}
                  onChange={() => handleCheckboxChange(action)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor={action} className="ml-2 text-sm text-gray-700">
                  {action}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks / Comments */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Remarks / Comments:
          </label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            placeholder="Enter remarks or comments"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Endorsed by Section */}
        <div className="border-t-2 border-gray-300 pt-6 mt-8">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Endorsed by:</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name & Signature:
              </label>
              <input
                type="text"
                name="endorsedByName"
                value={formData.endorsedByName}
                onChange={handleInputChange}
                placeholder="Enter name and signature"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position:
              </label>
              <input
                type="text"
                name="endorsedByPosition"
                value={formData.endorsedByPosition}
                onChange={handleInputChange}
                placeholder="Enter position"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Received by Section */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-4">Received by:</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name & Signature:
              </label>
              <input
                type="text"
                name="receivedByName"
                value={formData.receivedByName}
                onChange={handleInputChange}
                placeholder="Enter name and signature"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position:
              </label>
              <input
                type="text"
                name="receivedByPosition"
                value={formData.receivedByPosition}
                onChange={handleInputChange}
                placeholder="Enter position"
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

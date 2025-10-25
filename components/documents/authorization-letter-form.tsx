'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Form schema for authorization letter
const authorizationLetterSchema = z.object({
  // Authorizer (Person giving authorization)
  authorizer_name: z.string().min(2, 'Authorizer name is required'),
  authorizer_address: z.string().min(5, 'Authorizer address is required'),
  authorizer_contact: z.string().min(10, 'Valid contact number is required'),
  authorizer_id_type: z.string().min(1, 'ID type is required'),
  authorizer_id_number: z.string().min(1, 'ID number is required'),

  // Authorized Person (Person receiving authorization)
  authorized_name: z.string().min(2, 'Authorized person name is required'),
  authorized_address: z.string().min(5, 'Authorized person address is required'),
  authorized_contact: z.string().min(10, 'Valid contact number is required'),
  authorized_id_type: z.string().min(1, 'ID type is required'),
  authorized_id_number: z.string().min(1, 'ID number is required'),

  // Authorization Details
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  specific_actions: z.string().min(10, 'Please specify the actions authorized'),
  effective_date: z.string().min(1, 'Effective date is required'),
  expiry_date: z.string().optional(),
  
  // Additional Information
  witness_name: z.string().optional(),
  witness_address: z.string().optional(),
  special_conditions: z.string().optional(),
  notes: z.string().optional(),
});

type AuthorizationLetterFormData = z.infer<typeof authorizationLetterSchema>;

interface AuthorizationLetterFormProps {
  onSubmit?: (data: AuthorizationLetterFormData) => void;
  initialData?: Partial<AuthorizationLetterFormData>;
}

export default function AuthorizationLetterForm({
  onSubmit: onSubmitProp,
  initialData
}: AuthorizationLetterFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<AuthorizationLetterFormData>({
    resolver: zodResolver(authorizationLetterSchema),
    defaultValues: initialData || {
      effective_date: new Date().toISOString().split('T')[0]
    }
  });

  const onSubmit = async (data: AuthorizationLetterFormData) => {
    setIsGenerating(true);
    const loadingToast = toast.loading('Generating authorization letter...', {
      description: 'Please wait while we create your document'
    });

    try {
      // Generate the document HTML
      const documentHtml = generateAuthorizationLetterHTML(data);
      setGeneratedDocument(documentHtml);

      toast.dismiss(loadingToast);
      toast.success('✅ Authorization letter generated successfully!', {
        description: 'You can now preview or download the document',
        duration: 5000
      });

      // Call parent onSubmit if provided
      if (onSubmitProp) {
        onSubmitProp(data);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to generate authorization letter', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedDocument) return;

    // Create a new window with the document for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatedDocument);
      printWindow.document.close();
      printWindow.focus();
      
      // Trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handlePreview = () => {
    if (!generatedDocument) return;

    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(generatedDocument);
      previewWindow.document.close();
    }
  };

  const handleReset = () => {
    reset();
    setGeneratedDocument(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Authorization Letter Generator
          </CardTitle>
          <CardDescription>
            Fill in the details below to generate an authorization letter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Authorizer Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Authorizer Information (Person Giving Authorization)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorizer_name">Full Name *</Label>
                  <Input
                    id="authorizer_name"
                    placeholder="Juan Dela Cruz"
                    {...register('authorizer_name')}
                  />
                  {errors.authorizer_name && (
                    <p className="text-sm text-red-500">{errors.authorizer_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorizer_contact">Contact Number *</Label>
                  <Input
                    id="authorizer_contact"
                    placeholder="09123456789"
                    {...register('authorizer_contact')}
                  />
                  {errors.authorizer_contact && (
                    <p className="text-sm text-red-500">{errors.authorizer_contact.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="authorizer_address">Complete Address *</Label>
                  <Input
                    id="authorizer_address"
                    placeholder="123 Main St, Barangay Sample, Pili, Camarines Sur"
                    {...register('authorizer_address')}
                  />
                  {errors.authorizer_address && (
                    <p className="text-sm text-red-500">{errors.authorizer_address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorizer_id_type">Valid ID Type *</Label>
                  <Input
                    id="authorizer_id_type"
                    placeholder="e.g., OSCA ID, Driver's License, Passport"
                    {...register('authorizer_id_type')}
                  />
                  {errors.authorizer_id_type && (
                    <p className="text-sm text-red-500">{errors.authorizer_id_type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorizer_id_number">ID Number *</Label>
                  <Input
                    id="authorizer_id_number"
                    placeholder="ID-123456789"
                    {...register('authorizer_id_number')}
                  />
                  {errors.authorizer_id_number && (
                    <p className="text-sm text-red-500">{errors.authorizer_id_number.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Authorized Person Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Authorized Person Information (Person Receiving Authorization)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorized_name">Full Name *</Label>
                  <Input
                    id="authorized_name"
                    placeholder="Maria Santos"
                    {...register('authorized_name')}
                  />
                  {errors.authorized_name && (
                    <p className="text-sm text-red-500">{errors.authorized_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorized_contact">Contact Number *</Label>
                  <Input
                    id="authorized_contact"
                    placeholder="09987654321"
                    {...register('authorized_contact')}
                  />
                  {errors.authorized_contact && (
                    <p className="text-sm text-red-500">{errors.authorized_contact.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="authorized_address">Complete Address *</Label>
                  <Input
                    id="authorized_address"
                    placeholder="456 Secondary St, Barangay Example, Pili, Camarines Sur"
                    {...register('authorized_address')}
                  />
                  {errors.authorized_address && (
                    <p className="text-sm text-red-500">{errors.authorized_address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorized_id_type">Valid ID Type *</Label>
                  <Input
                    id="authorized_id_type"
                    placeholder="e.g., National ID, Driver's License"
                    {...register('authorized_id_type')}
                  />
                  {errors.authorized_id_type && (
                    <p className="text-sm text-red-500">{errors.authorized_id_type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authorized_id_number">ID Number *</Label>
                  <Input
                    id="authorized_id_number"
                    placeholder="ID-987654321"
                    {...register('authorized_id_number')}
                  />
                  {errors.authorized_id_number && (
                    <p className="text-sm text-red-500">{errors.authorized_id_number.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Authorization Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Authorization Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="purpose">Purpose of Authorization *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="e.g., To claim my pension, To process documents on my behalf, To represent me in meetings"
                    rows={3}
                    {...register('purpose')}
                  />
                  {errors.purpose && (
                    <p className="text-sm text-red-500">{errors.purpose.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="specific_actions">Specific Actions Authorized *</Label>
                  <Textarea
                    id="specific_actions"
                    placeholder="e.g., Sign documents, Receive payments, Submit applications, Attend meetings"
                    rows={3}
                    {...register('specific_actions')}
                  />
                  {errors.specific_actions && (
                    <p className="text-sm text-red-500">{errors.specific_actions.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="effective_date">Effective Date *</Label>
                  <Input
                    id="effective_date"
                    type="date"
                    {...register('effective_date')}
                  />
                  {errors.effective_date && (
                    <p className="text-sm text-red-500">{errors.effective_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    {...register('expiry_date')}
                  />
                </div>
              </div>
            </div>

            {/* Optional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Additional Information (Optional)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="witness_name">Witness Name</Label>
                  <Input
                    id="witness_name"
                    placeholder="Pedro Reyes"
                    {...register('witness_name')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="witness_address">Witness Address</Label>
                  <Input
                    id="witness_address"
                    placeholder="789 Witness St, Pili, Camarines Sur"
                    {...register('witness_address')}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="special_conditions">Special Conditions or Limitations</Label>
                  <Textarea
                    id="special_conditions"
                    placeholder="Any specific limitations or conditions for this authorization"
                    rows={2}
                    {...register('special_conditions')}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any other relevant information"
                    rows={2}
                    {...register('notes')}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-[#00af8f] hover:bg-[#00af8f]/90"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Letter
                  </>
                )}
              </Button>

              {generatedDocument && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download/Print
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant="ghost"
                onClick={handleReset}
              >
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Message */}
      {generatedDocument && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">Document Generated Successfully!</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your authorization letter has been generated. You can preview it or download/print it using the buttons above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Function to generate the authorization letter HTML
function generateAuthorizationLetterHTML(data: AuthorizationLetterFormData): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const effectiveDate = new Date(data.effective_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const expiryDate = data.expiry_date
    ? new Date(data.expiry_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorization Letter</title>
  <style>
    @media print {
      @page {
        margin: 1in;
        size: letter;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      line-height: 1.6;
      color: #000;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0 0 10px 0;
      letter-spacing: 2px;
    }
    
    .date {
      text-align: right;
      margin-bottom: 30px;
    }
    
    .content {
      text-align: justify;
      margin-bottom: 20px;
    }
    
    .content p {
      margin-bottom: 15px;
    }
    
    .section-title {
      font-weight: bold;
      text-decoration: underline;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .signature-section {
      margin-top: 50px;
    }
    
    .signature-block {
      margin-top: 60px;
      margin-bottom: 30px;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      width: 250px;
      margin: 5px 0;
    }
    
    .signature-label {
      font-size: 12px;
      margin-top: 5px;
    }
    
    .info-box {
      border: 1px solid #000;
      padding: 15px;
      margin: 20px 0;
    }
    
    .info-row {
      margin-bottom: 8px;
    }
    
    .info-label {
      font-weight: bold;
      display: inline-block;
      width: 150px;
    }
    
    .witness-section {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
    }
    
    .witness-block {
      width: 45%;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Authorization Letter</h1>
  </div>
  
  <div class="date">
    ${currentDate}
  </div>
  
  <div class="content">
    <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
    
    <p>
      I, <strong>${data.authorizer_name}</strong>, of legal age, Filipino citizen, and currently residing at 
      <strong>${data.authorizer_address}</strong>, hereby authorize <strong>${data.authorized_name}</strong>, 
      of legal age, Filipino citizen, and currently residing at <strong>${data.authorized_address}</strong>, 
      to act on my behalf for the following purpose:
    </p>
    
    <div class="section-title">PURPOSE:</div>
    <p>${data.purpose}</p>
    
    <div class="section-title">SPECIFIC ACTIONS AUTHORIZED:</div>
    <p>${data.specific_actions}</p>
    
    <div class="section-title">VALIDITY:</div>
    <p>
      This authorization is effective from <strong>${effectiveDate}</strong>
      ${expiryDate ? ` until <strong>${expiryDate}</strong>` : ' and shall remain in effect until revoked in writing'}.
    </p>
    
    ${data.special_conditions ? `
    <div class="section-title">SPECIAL CONDITIONS:</div>
    <p>${data.special_conditions}</p>
    ` : ''}
    
    <p>
      I hereby affirm that any and all acts performed by my authorized representative in connection with 
      the above-stated purpose shall be binding upon me as if I had personally performed such acts.
    </p>
  </div>
  
  <div class="info-box">
    <div class="section-title" style="margin-top: 0;">AUTHORIZER'S INFORMATION:</div>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span>${data.authorizer_name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Address:</span>
      <span>${data.authorizer_address}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Contact Number:</span>
      <span>${data.authorizer_contact}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Valid ID:</span>
      <span>${data.authorizer_id_type} - ${data.authorizer_id_number}</span>
    </div>
  </div>
  
  <div class="info-box">
    <div class="section-title" style="margin-top: 0;">AUTHORIZED PERSON'S INFORMATION:</div>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span>${data.authorized_name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Address:</span>
      <span>${data.authorized_address}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Contact Number:</span>
      <span>${data.authorized_contact}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Valid ID:</span>
      <span>${data.authorized_id_type} - ${data.authorized_id_number}</span>
    </div>
  </div>
  
  <div class="signature-section">
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">
        <strong>${data.authorizer_name}</strong><br>
        Signature over Printed Name<br>
        (Authorizer)
      </div>
    </div>
    
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">
        <strong>${data.authorized_name}</strong><br>
        Signature over Printed Name<br>
        (Authorized Person)
      </div>
    </div>
  </div>
  
  ${data.witness_name ? `
  <div class="witness-section">
    <div class="witness-block">
      <div style="margin-bottom: 10px;"><strong>WITNESSED BY:</strong></div>
      <div class="signature-line"></div>
      <div class="signature-label">
        <strong>${data.witness_name}</strong><br>
        Signature over Printed Name<br>
        ${data.witness_address ? `Address: ${data.witness_address}` : ''}
      </div>
    </div>
  </div>
  ` : ''}
  
  ${data.notes ? `
  <div style="margin-top: 30px; font-size: 12px; font-style: italic;">
    <strong>Note:</strong> ${data.notes}
  </div>
  ` : ''}
  
  <div style="margin-top: 40px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
    This is a computer-generated authorization letter. Generated on ${currentDate}
  </div>
</body>
</html>
  `.trim();
}

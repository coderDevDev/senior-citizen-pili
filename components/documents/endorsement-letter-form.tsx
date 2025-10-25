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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Form schema for endorsement letter
const endorsementLetterSchema = z.object({
  // Senior Citizen Information
  senior_name: z.string().min(2, 'Senior citizen name is required'),
  senior_age: z.string().min(1, 'Age is required'),
  senior_address: z.string().min(5, 'Complete address is required'),
  senior_contact: z.string().min(10, 'Valid contact number is required'),
  osca_id: z.string().optional(),

  // Endorsement Details
  endorsement_type: z.enum([
    'medical_assistance',
    'financial_assistance',
    'housing_assistance',
    'social_services',
    'employment',
    'education',
    'legal_aid',
    'other'
  ], {
    required_error: 'Please select endorsement type'
  }),
  endorsing_office: z.string().min(2, 'Endorsing office/organization is required'),
  endorsing_official: z.string().min(2, 'Endorsing official name is required'),
  endorsing_position: z.string().min(2, 'Official position is required'),

  // Recipient Information
  recipient_office: z.string().min(2, 'Recipient office/organization is required'),
  recipient_address: z.string().min(5, 'Recipient address is required'),
  attention_to: z.string().optional(),

  // Purpose and Details
  purpose: z.string().min(20, 'Purpose must be at least 20 characters'),
  background_info: z.string().min(20, 'Background information is required'),
  specific_request: z.string().min(10, 'Please specify what is being requested'),
  
  // Supporting Information
  health_condition: z.string().optional(),
  financial_status: z.string().optional(),
  family_situation: z.string().optional(),
  urgency_level: z.enum(['routine', 'urgent', 'emergency']).optional(),
  
  // Additional Information
  supporting_documents: z.string().optional(),
  special_notes: z.string().optional(),
  follow_up_required: z.boolean().optional(),
});

type EndorsementLetterFormData = z.infer<typeof endorsementLetterSchema>;

interface EndorsementLetterFormProps {
  onSubmit?: (data: EndorsementLetterFormData) => void;
  initialData?: Partial<EndorsementLetterFormData>;
}

export default function EndorsementLetterForm({
  onSubmit: onSubmitProp,
  initialData
}: EndorsementLetterFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<EndorsementLetterFormData>({
    resolver: zodResolver(endorsementLetterSchema),
    defaultValues: initialData || {
      urgency_level: 'routine',
      follow_up_required: false
    }
  });

  const endorsementType = watch('endorsement_type');

  const onSubmit = async (data: EndorsementLetterFormData) => {
    setIsGenerating(true);
    const loadingToast = toast.loading('Generating endorsement letter...', {
      description: 'Please wait while we create your document'
    });

    try {
      // Generate the document HTML
      const documentHtml = generateEndorsementLetterHTML(data);
      setGeneratedDocument(documentHtml);

      toast.dismiss(loadingToast);
      toast.success('✅ Endorsement letter generated successfully!', {
        description: 'You can now preview or download the document',
        duration: 5000
      });

      // Call parent onSubmit if provided
      if (onSubmitProp) {
        onSubmitProp(data);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('❌ Failed to generate endorsement letter', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedDocument) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatedDocument);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  const handlePreview = () => {
    if (!generatedDocument) return;

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
            Endorsement Letter Generator
          </CardTitle>
          <CardDescription>
            Create an official endorsement letter for senior citizen assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Senior Citizen Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Senior Citizen Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senior_name">Full Name *</Label>
                  <Input
                    id="senior_name"
                    placeholder="Juan Dela Cruz"
                    {...register('senior_name')}
                  />
                  {errors.senior_name && (
                    <p className="text-sm text-red-500">{errors.senior_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senior_age">Age *</Label>
                  <Input
                    id="senior_age"
                    type="number"
                    placeholder="65"
                    {...register('senior_age')}
                  />
                  {errors.senior_age && (
                    <p className="text-sm text-red-500">{errors.senior_age.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="senior_address">Complete Address *</Label>
                  <Input
                    id="senior_address"
                    placeholder="123 Main St, Barangay Sample, Pili, Camarines Sur"
                    {...register('senior_address')}
                  />
                  {errors.senior_address && (
                    <p className="text-sm text-red-500">{errors.senior_address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senior_contact">Contact Number *</Label>
                  <Input
                    id="senior_contact"
                    placeholder="09123456789"
                    {...register('senior_contact')}
                  />
                  {errors.senior_contact && (
                    <p className="text-sm text-red-500">{errors.senior_contact.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="osca_id">OSCA ID Number (Optional)</Label>
                  <Input
                    id="osca_id"
                    placeholder="OSCA-2024-001234"
                    {...register('osca_id')}
                  />
                </div>
              </div>
            </div>

            {/* Endorsement Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Endorsement Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endorsement_type">Type of Endorsement *</Label>
                  <Select
                    onValueChange={(value) => setValue('endorsement_type', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical_assistance">Medical Assistance</SelectItem>
                      <SelectItem value="financial_assistance">Financial Assistance</SelectItem>
                      <SelectItem value="housing_assistance">Housing Assistance</SelectItem>
                      <SelectItem value="social_services">Social Services</SelectItem>
                      <SelectItem value="employment">Employment</SelectItem>
                      <SelectItem value="education">Education/Training</SelectItem>
                      <SelectItem value="legal_aid">Legal Aid</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.endorsement_type && (
                    <p className="text-sm text-red-500">{errors.endorsement_type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency_level">Urgency Level</Label>
                  <Select
                    onValueChange={(value) => setValue('urgency_level', value as any)}
                    defaultValue="routine"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endorsing_office">Endorsing Office/Organization *</Label>
                  <Input
                    id="endorsing_office"
                    placeholder="OSCA - Pili, Camarines Sur"
                    {...register('endorsing_office')}
                  />
                  {errors.endorsing_office && (
                    <p className="text-sm text-red-500">{errors.endorsing_office.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endorsing_official">Endorsing Official *</Label>
                  <Input
                    id="endorsing_official"
                    placeholder="Maria Santos"
                    {...register('endorsing_official')}
                  />
                  {errors.endorsing_official && (
                    <p className="text-sm text-red-500">{errors.endorsing_official.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endorsing_position">Position/Title *</Label>
                  <Input
                    id="endorsing_position"
                    placeholder="OSCA Coordinator / Social Welfare Officer"
                    {...register('endorsing_position')}
                  />
                  {errors.endorsing_position && (
                    <p className="text-sm text-red-500">{errors.endorsing_position.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recipient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Recipient Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="recipient_office">Recipient Office/Organization *</Label>
                  <Input
                    id="recipient_office"
                    placeholder="Department of Social Welfare and Development"
                    {...register('recipient_office')}
                  />
                  {errors.recipient_office && (
                    <p className="text-sm text-red-500">{errors.recipient_office.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="recipient_address">Recipient Address *</Label>
                  <Input
                    id="recipient_address"
                    placeholder="DSWD Regional Office, Naga City, Camarines Sur"
                    {...register('recipient_address')}
                  />
                  {errors.recipient_address && (
                    <p className="text-sm text-red-500">{errors.recipient_address.message}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="attention_to">Attention To (Optional)</Label>
                  <Input
                    id="attention_to"
                    placeholder="Director / Program Manager"
                    {...register('attention_to')}
                  />
                </div>
              </div>
            </div>

            {/* Purpose and Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Purpose and Details
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Endorsement *</Label>
                  <Textarea
                    id="purpose"
                    placeholder="Describe the main purpose of this endorsement..."
                    rows={3}
                    {...register('purpose')}
                  />
                  {errors.purpose && (
                    <p className="text-sm text-red-500">{errors.purpose.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background_info">Background Information *</Label>
                  <Textarea
                    id="background_info"
                    placeholder="Provide relevant background about the senior citizen's situation..."
                    rows={4}
                    {...register('background_info')}
                  />
                  {errors.background_info && (
                    <p className="text-sm text-red-500">{errors.background_info.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specific_request">Specific Request/Assistance Needed *</Label>
                  <Textarea
                    id="specific_request"
                    placeholder="Specify what assistance or action is being requested..."
                    rows={3}
                    {...register('specific_request')}
                  />
                  {errors.specific_request && (
                    <p className="text-sm text-red-500">{errors.specific_request.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Supporting Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Supporting Information (Optional)
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="health_condition">Health Condition</Label>
                  <Textarea
                    id="health_condition"
                    placeholder="Describe any relevant health conditions..."
                    rows={2}
                    {...register('health_condition')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="financial_status">Financial Status</Label>
                  <Textarea
                    id="financial_status"
                    placeholder="Describe the financial situation..."
                    rows={2}
                    {...register('financial_status')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="family_situation">Family Situation</Label>
                  <Textarea
                    id="family_situation"
                    placeholder="Describe family circumstances..."
                    rows={2}
                    {...register('family_situation')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supporting_documents">Supporting Documents Attached</Label>
                  <Textarea
                    id="supporting_documents"
                    placeholder="List any documents attached (e.g., Medical certificates, ID copies, etc.)"
                    rows={2}
                    {...register('supporting_documents')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="special_notes">Special Notes/Remarks</Label>
                  <Textarea
                    id="special_notes"
                    placeholder="Any additional information..."
                    rows={2}
                    {...register('special_notes')}
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
                  Your endorsement letter has been generated. You can preview it or download/print it using the buttons above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Function to generate the endorsement letter HTML
function generateEndorsementLetterHTML(data: EndorsementLetterFormData): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const endorsementTypeLabels: Record<string, string> = {
    medical_assistance: 'Medical Assistance',
    financial_assistance: 'Financial Assistance',
    housing_assistance: 'Housing Assistance',
    social_services: 'Social Services',
    employment: 'Employment',
    education: 'Education/Training',
    legal_aid: 'Legal Aid',
    other: 'General Assistance'
  };

  const urgencyBadge = data.urgency_level === 'emergency' 
    ? '<div style="display: inline-block; background: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 10px;">EMERGENCY</div>'
    : data.urgency_level === 'urgent'
    ? '<div style="display: inline-block; background: #f59e0b; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-left: 10px;">URGENT</div>'
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Endorsement Letter</title>
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
      border-bottom: 3px solid #00af8f;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0 0 10px 0;
      letter-spacing: 2px;
      color: #00af8f;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: #666;
      font-style: italic;
    }
    
    .date-ref {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      font-size: 14px;
    }
    
    .recipient-info {
      margin-bottom: 30px;
    }
    
    .recipient-info p {
      margin: 5px 0;
      font-weight: bold;
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
      color: #00af8f;
    }
    
    .info-box {
      border: 2px solid #00af8f;
      padding: 15px;
      margin: 20px 0;
      background: #f0fdf4;
    }
    
    .info-row {
      margin-bottom: 8px;
    }
    
    .info-label {
      font-weight: bold;
      display: inline-block;
      width: 180px;
    }
    
    .signature-section {
      margin-top: 60px;
    }
    
    .signature-block {
      margin-top: 40px;
    }
    
    .signature-line {
      border-top: 2px solid #000;
      width: 300px;
      margin: 5px 0;
    }
    
    .signature-label {
      font-size: 12px;
      margin-top: 5px;
    }
    
    .footer {
      margin-top: 40px;
      font-size: 11px;
      color: #666;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
    
    .urgency-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      margin-left: 10px;
    }
    
    .emergency {
      background: #dc2626;
      color: white;
    }
    
    .urgent {
      background: #f59e0b;
      color: white;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Letter of Endorsement</h1>
    <div class="subtitle">Office of Senior Citizens Affairs (OSCA)</div>
    ${urgencyBadge}
  </div>
  
  <div class="date-ref">
    <div><strong>Date:</strong> ${currentDate}</div>
    <div><strong>Reference:</strong> ${data.endorsement_type.toUpperCase()}-${Date.now().toString().slice(-6)}</div>
  </div>
  
  <div class="recipient-info">
    <p>${data.recipient_office}</p>
    <p>${data.recipient_address}</p>
    ${data.attention_to ? `<p>Attention: ${data.attention_to}</p>` : ''}
  </div>
  
  <div class="content">
    <p><strong>Dear Sir/Madam:</strong></p>
    
    <p><strong>RE: ENDORSEMENT FOR ${endorsementTypeLabels[data.endorsement_type].toUpperCase()}</strong></p>
    
    <p>
      Greetings from the <strong>${data.endorsing_office}</strong>!
    </p>
    
    <p>
      This is to formally endorse <strong>${data.senior_name}</strong>, ${data.senior_age} years old, 
      residing at <strong>${data.senior_address}</strong>${data.osca_id ? `, with OSCA ID Number <strong>${data.osca_id}</strong>` : ''}, 
      for your kind consideration and assistance.
    </p>
    
    <div class="section-title">PURPOSE:</div>
    <p>${data.purpose}</p>
    
    <div class="section-title">BACKGROUND INFORMATION:</div>
    <p>${data.background_info}</p>
    
    <div class="section-title">SPECIFIC REQUEST:</div>
    <p>${data.specific_request}</p>
    
    ${data.health_condition ? `
    <div class="section-title">HEALTH CONDITION:</div>
    <p>${data.health_condition}</p>
    ` : ''}
    
    ${data.financial_status ? `
    <div class="section-title">FINANCIAL STATUS:</div>
    <p>${data.financial_status}</p>
    ` : ''}
    
    ${data.family_situation ? `
    <div class="section-title">FAMILY SITUATION:</div>
    <p>${data.family_situation}</p>
    ` : ''}
    
    ${data.supporting_documents ? `
    <div class="section-title">SUPPORTING DOCUMENTS:</div>
    <p>${data.supporting_documents}</p>
    ` : ''}
    
    <p>
      We humbly request your office to provide the necessary assistance to the above-named senior citizen. 
      This endorsement is issued upon the request of the concerned party and after due verification of the 
      information provided.
    </p>
    
    ${data.special_notes ? `
    <p><strong>Special Notes:</strong> ${data.special_notes}</p>
    ` : ''}
    
    <p>
      Your favorable consideration and prompt action on this matter will be highly appreciated. 
      Should you need any additional information or clarification, please do not hesitate to contact our office.
    </p>
    
    <p>Thank you for your kind attention and assistance.</p>
  </div>
  
  <div class="info-box">
    <div class="section-title" style="margin-top: 0;">SENIOR CITIZEN CONTACT INFORMATION:</div>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span>${data.senior_name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Age:</span>
      <span>${data.senior_age} years old</span>
    </div>
    <div class="info-row">
      <span class="info-label">Address:</span>
      <span>${data.senior_address}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Contact Number:</span>
      <span>${data.senior_contact}</span>
    </div>
    ${data.osca_id ? `
    <div class="info-row">
      <span class="info-label">OSCA ID:</span>
      <span>${data.osca_id}</span>
    </div>
    ` : ''}
  </div>
  
  <div class="signature-section">
    <p>Respectfully yours,</p>
    
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">
        <strong>${data.endorsing_official}</strong><br>
        ${data.endorsing_position}<br>
        ${data.endorsing_office}
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p>This is an official endorsement letter generated by the Office of Senior Citizens Affairs (OSCA)</p>
    <p>Generated on ${currentDate} | Document Type: ${endorsementTypeLabels[data.endorsement_type]}</p>
    ${data.follow_up_required ? '<p><strong>Note: Follow-up action required</strong></p>' : ''}
  </div>
</body>
</html>
  `.trim();
}

'use client';

import { useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function ViewOriginalDocumentsPage() {
  const router = useRouter();
  const [selectedDoc, setSelectedDoc] = useState<'authorization' | 'endorsement' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => selectedDoc ? setSelectedDoc(null) : router.back()}
            className="hover:bg-white/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">View Original Documents</h1>
            <p className="text-slate-600 mt-1">
              View the original PDF-converted HTML documents
            </p>
          </div>
        </div>

        {!selectedDoc ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedDoc('authorization')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#00af8f]" />
                  Authorization Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  View the original authorization letter template design
                </p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedDoc('endorsement')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#00af8f]" />
                  Endorsement Letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  View the original endorsement letter template design
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <iframe
                src={selectedDoc === 'authorization' 
                  ? '/data/Authorization Letter.html' 
                  : '/data/Endorsement.html'}
                className="w-full h-[800px] border-0"
                title={`${selectedDoc} letter`}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

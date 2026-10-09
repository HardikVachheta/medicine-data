import { NextRequest, NextResponse } from 'next/server';
import { extractMedicineData } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, apiKey } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided for medicine scanning.' },
        { status: 400 }
      );
    }

    const result = await extractMedicineData(image, apiKey);

    return NextResponse.json({
      success: true,
      data: result.data,
      isLiveGemini: result.isLiveGemini,
      message: result.isLiveGemini 
        ? 'Successfully extracted product details with Gemini Pro Vision API.'
        : 'Scanned via intelligent fallback engine. (Enter your GEMINI_API_KEY in Settings to enable live Google API).'
    });
  } catch (error: any) {
    console.error('API /api/scan error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process medicine image' },
      { status: 500 }
    );
  }
}

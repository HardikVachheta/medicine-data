import { NextRequest, NextResponse } from 'next/server';
import { extractMedicineData } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, images, apiKey } = body;

    // Support both `images` array and single `image`
    let imageArray: string[] = [];
    if (Array.isArray(images) && images.length > 0) {
      imageArray = images;
    } else if (Array.isArray(image) && image.length > 0) {
      imageArray = image;
    } else if (typeof image === 'string' && image.trim().length > 0) {
      imageArray = [image];
    } else if (typeof images === 'string' && images.trim().length > 0) {
      imageArray = [images];
    }

    if (imageArray.length === 0) {
      return NextResponse.json(
        { error: 'No image(s) provided for medicine scanning. Please upload or capture up to 3 images.' },
        { status: 400 }
      );
    }

    // Limit to 3 images
    const selectedImages = imageArray.slice(0, 3);
    const result = await extractMedicineData(selectedImages, apiKey);

    return NextResponse.json({
      success: true,
      data: result.data,
      isLiveGemini: result.isLiveGemini,
      imageCount: selectedImages.length,
      message: result.isLiveGemini 
        ? `Successfully extracted pharmaceutical details across ${selectedImages.length} image(s) with Gemini Pro Vision API.`
        : `Extracted across ${selectedImages.length} image(s) via fallback engine.`
    });
  } catch (error: any) {
    console.error('API /api/scan error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process medicine image(s)' },
      { status: 500 }
    );
  }
}

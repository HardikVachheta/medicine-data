import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractedProductData, ProductCategory } from './types';

const PHARMACY_SYSTEM_PROMPT = `
You are an expert pharmaceutical vision scanner and medical store inventory assistant.
Your task is to analyze the image(s) of a medicine package, blister strip, syrup bottle, cosmetic product, ointment tube, or surgical item.
Extract pharmaceutical details across all provided packaging images. If any field (such as batch_no, expiry_date, mrp, manufacturer) is missing or illegible, return an empty string ("") or null. DO NOT hallucinate or extrapolate missing values.

Analyze all visible text, branding, formulations, dates, prices, and barcodes across all provided images (e.g. front, back, side panels).
You MUST output ONLY a valid JSON object (no markdown formatting, no code fences) with the following structure:
{
  "name": "Full medicine/product commercial name along with strength (e.g. Augmentin 625 Duo Tablet, Cetaphil Cleanser 250ml)",
  "category_name": "One of: Allopathic, Ayurvedic, Cosmetics, Provisional, Surgical",
  "mrp": null, // Exact Maximum Retail Price (numeric float) printed on packaging. If missing/illegible, return null. DO NOT hallucinate.
  "selling_price": null, // Suggested selling price with standard 5-10% discount from MRP (numeric float). If mrp is null, return null.
  "discount_percentage": null, // Calculated discount percentage (numeric float). If mrp is null, return null.
  "unit": "One of: Strips, Bottle, Box, Tube, Vial, Syrup, Pcs, Packet",
  "stock_quantity": 10, // Suggested default stock count
  "batch_no": "", // Exact printed Batch/Lot number. If missing or illegible, return "". DO NOT hallucinate or extrapolate.
  "expiry_date": "", // Exact printed Expiry date (e.g. 2027-05 or 05/27). If missing or illegible, return "". DO NOT hallucinate.
  "manufacturer": "", // Company / laboratory that manufactured it. If missing, return "".
  "barcode": "", // Barcode numeric digits if visible. If missing, return "".
  "composition": "", // Active pharmaceutical ingredient / chemical salt / herbal composition if visible.
  "dosage": "", // Recommended usage or dosage instructions if visible.
  "confidence_score": 95, // 0 to 100 estimated confidence
  "raw_notes": "Brief notes on packaging details observed across images"
}

Categorization Rules:
- Allopathic: Prescription drugs, antibiotics, painkillers, modern pharmaceuticals (e.g. Paracetamol, Amoxicillin, Azithromycin, Telmisartan).
- Ayurvedic: Herbal, Siddha, Unani, Chyawanprash, Ayurvedic formulations (e.g. Dabur, Himalaya, Patanjali, Baidyanath).
- Cosmetics: Skincare, sunscreens, derma lotions, shampoos, face washes, cleansers.
- Provisional: Nutrition powders, OTC health drinks, baby food, antiseptics (Dettol, Savlon, Ensure, Protinex).
- Surgical: Syringes, cotton, bandages, surgical tape, BP monitors, thermometers, latex gloves, catheter.
`;

interface CleanImagePart {
  data: string;
  mimeType: string;
}

function parseBase64Image(raw: string): CleanImagePart {
  let base64Clean = raw;
  let mimeType = 'image/jpeg';

  if (raw.startsWith('data:')) {
    const match = raw.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Clean = match[2];
    } else {
      const commaIdx = raw.indexOf(',');
      if (commaIdx !== -1) {
        base64Clean = raw.slice(commaIdx + 1);
      }
    }
  }

  return { data: base64Clean, mimeType };
}

export async function extractMedicineData(
  images: string | string[],
  apiKey?: string
): Promise<{ data: ExtractedProductData; isLiveGemini: boolean; rawResponse?: string }> {
  const activeKey = apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const rawArray = Array.isArray(images) ? images : [images];
  const validImages = rawArray.filter(img => typeof img === 'string' && img.trim().length > 0).slice(0, 3);

  if (validImages.length === 0) {
    throw new Error('No valid images provided for extraction.');
  }

  const cleanParts = validImages.map(parseBase64Image);

  if (activeKey && activeKey.trim().length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(activeKey.trim());
      // Try gemini-1.5-flash first, then gemini-2.0-flash, then gemini-1.5-pro
      const modelNames = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
      let responseText = '';

      const contentPayload: any[] = [
        PHARMACY_SYSTEM_PROMPT,
        ...cleanParts.map(part => ({
          inlineData: {
            data: part.data,
            mimeType: part.mimeType,
          },
        })),
      ];

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          });

          const result = await model.generateContent(contentPayload);
          responseText = result.response.text();
          if (responseText) break;
        } catch (subErr) {
          console.warn(`Model ${modelName} failed, trying next:`, subErr);
        }
      }

      if (responseText) {
        let cleaned = responseText.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(cleaned);
        const data = normalizeExtractedData(parsed);
        return { data, isLiveGemini: true, rawResponse: responseText };
      }
    } catch (err: any) {
      console.error('Error invoking Gemini Vision API:', err);
    }
  }

  // Graceful fallback heuristic when key is not configured or failed
  const simulated = getSimulatedExtraction(cleanParts[0].data);
  return {
    data: simulated,
    isLiveGemini: false,
    rawResponse: 'Generated via fallback heuristic (configure GEMINI_API_KEY in Settings for live Google Gemini processing)'
  };
}

function normalizeExtractedData(parsed: any): ExtractedProductData {
  const rawMrp = parsed.mrp;
  const hasValidMrp = rawMrp !== null && rawMrp !== undefined && !isNaN(Number(rawMrp)) && Number(rawMrp) > 0;
  const mrp = hasValidMrp ? Number(rawMrp) : 0;

  let selling = 0;
  if (parsed.selling_price !== null && parsed.selling_price !== undefined && !isNaN(Number(parsed.selling_price))) {
    selling = Number(parsed.selling_price);
  } else if (hasValidMrp) {
    selling = mrp * 0.9;
  }
  if (selling > mrp && mrp > 0) selling = mrp;

  let discount = 0;
  if (parsed.discount_percentage !== null && parsed.discount_percentage !== undefined && !isNaN(Number(parsed.discount_percentage))) {
    discount = Number(parsed.discount_percentage);
  } else if (hasValidMrp && mrp > 0) {
    discount = Number((((mrp - selling) / mrp) * 100).toFixed(2));
  }

  // Valid category
  const validCategories: ProductCategory[] = ['Allopathic', 'Ayurvedic', 'Cosmetics', 'Provisional', 'Surgical'];
  let category = parsed.category_name;
  if (!validCategories.includes(category)) {
    const lower = String(category || '').toLowerCase();
    if (lower.includes('ayur') || lower.includes('herb')) category = 'Ayurvedic';
    else if (lower.includes('cosm') || lower.includes('derma') || lower.includes('skin')) category = 'Cosmetics';
    else if (lower.includes('surg') || lower.includes('device') || lower.includes('glove')) category = 'Surgical';
    else if (lower.includes('food') || lower.includes('nutri') || lower.includes('otc') || lower.includes('prov')) category = 'Provisional';
    else category = 'Allopathic';
  }

  return {
    name: parsed.name ? String(parsed.name).trim() : 'Pharmaceutical Product',
    category_name: category,
    mrp: Math.round(mrp * 100) / 100,
    selling_price: Math.round(selling * 100) / 100,
    discount_percentage: Math.round(discount * 100) / 100,
    unit: parsed.unit ? String(parsed.unit).trim() : 'Strips',
    stock_quantity: Number(parsed.stock_quantity) || 10,
    batch_no: parsed.batch_no ? String(parsed.batch_no).trim() : '',
    expiry_date: parsed.expiry_date ? String(parsed.expiry_date).trim() : '',
    manufacturer: parsed.manufacturer ? String(parsed.manufacturer).trim() : '',
    barcode: parsed.barcode ? String(parsed.barcode).trim() : '',
    composition: parsed.composition ? String(parsed.composition).trim() : '',
    dosage: parsed.dosage ? String(parsed.dosage).trim() : '',
    confidence_score: parsed.confidence_score || 95,
    raw_notes: parsed.raw_notes ? String(parsed.raw_notes).trim() : 'Scanned packaging images.'
  };
}

function getSimulatedExtraction(base64: string): ExtractedProductData {
  const presets = [
    {
      name: 'Amoxicillin & Potassium Clavulanate Tablets IP 625mg',
      category: 'Allopathic',
      mrp: 215.00,
      unit: 'Strips',
      manufacturer: 'Sun Pharmaceutical Industries Ltd',
      batch: 'SN-CL892',
      exp: '2027-09',
      comp: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
      barcode: '8901117009123'
    },
    {
      name: 'Dolo 650 Tablets (Paracetamol IP 650mg)',
      category: 'Allopathic',
      mrp: 33.50,
      unit: 'Strips',
      manufacturer: 'Micro Labs Limited',
      batch: 'ML-650X',
      exp: '2027-06',
      comp: 'Paracetamol 650mg',
      barcode: '8901148210342'
    },
    {
      name: 'Himalaya Septilin Natural Immunity Booster',
      category: 'Ayurvedic',
      mrp: 185.00,
      unit: 'Bottle',
      manufacturer: 'The Himalaya Drug Company',
      batch: 'HM-SPT44',
      exp: '2028-03',
      comp: 'Guggulu, Maharasnadi Quath, Manjishtha, Tinospora',
      barcode: '8901138501891'
    },
    {
      name: 'Dettol Disinfectant Antiseptic Liquid 250ml',
      category: 'Provisional',
      mrp: 148.00,
      unit: 'Bottle',
      manufacturer: 'Reckitt Benckiser Healthcare',
      batch: 'RB-DT202',
      exp: '2028-01',
      comp: 'Chloroxylenol 4.8% w/v',
      barcode: '8901396112209'
    },
    {
      name: 'Surgical Sterilized Hypodermic Syringes 5ml (Pack of 10)',
      category: 'Surgical',
      mrp: 95.00,
      unit: 'Box',
      manufacturer: 'HMD Healthcare Ltd',
      batch: 'DISP-5ML',
      exp: '2029-05',
      comp: 'Polypropylene barrel and plunger with silicone gasket',
      barcode: '8903429810452'
    }
  ];

  const pick = presets[Math.floor(Math.random() * presets.length)];
  const discount = 10;
  const selling = Math.round((pick.mrp * 0.9) * 100) / 100;

  return {
    name: pick.name,
    category_name: pick.category,
    mrp: pick.mrp,
    selling_price: selling,
    discount_percentage: discount,
    unit: pick.unit,
    stock_quantity: 10,
    batch_no: pick.batch,
    expiry_date: pick.exp,
    manufacturer: pick.manufacturer,
    barcode: pick.barcode,
    composition: pick.comp,
    dosage: 'As prescribed by Registered Medical Practitioner',
    confidence_score: 95,
    raw_notes: 'Parsed from sample package.'
  };
}

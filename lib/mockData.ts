import { Product, Sale } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Augmentin 625 Duo Tablet',
    category_name: 'Allopathic',
    mrp: 223.50,
    selling_price: 201.15,
    discount_percentage: 10,
    unit: 'Strips',
    in_stock: true,
    stock_quantity: 45,
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    batch_no: 'AUG-24B09',
    expiry_date: '2026-11',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    barcode: '8901030784912',
    metadata: {
      composition: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
      schedule: 'Schedule H1',
      rack_location: 'Bay 2 - Shelf A',
      storage_temp: 'Below 25°C in dry place',
      dosage: '1 tablet twice daily after meals'
    },
    created_at: '2026-09-15T10:00:00Z',
    updated_at: '2026-10-01T14:30:00Z'
  },
  {
    id: 'prod-002',
    name: 'Dolo 650 Paracetamol Tablet',
    category_name: 'Allopathic',
    mrp: 34.00,
    selling_price: 30.60,
    discount_percentage: 10,
    unit: 'Strips',
    in_stock: true,
    stock_quantity: 120,
    image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
    batch_no: 'DL-9821A',
    expiry_date: '2027-05',
    manufacturer: 'Micro Labs Ltd',
    barcode: '8901148210342',
    metadata: {
      composition: 'Paracetamol 650mg',
      schedule: 'OTC',
      rack_location: 'Front Counter - Tray 1',
      storage_temp: 'Room Temperature',
      dosage: '1 tablet SOS for fever / body ache'
    },
    created_at: '2026-09-10T09:00:00Z',
    updated_at: '2026-10-02T11:00:00Z'
  },
  {
    id: 'prod-003',
    name: 'Dabur Chyawanprash Awaleha 1kg',
    category_name: 'Ayurvedic',
    mrp: 415.00,
    selling_price: 375.00,
    discount_percentage: 9.64,
    unit: 'Bottle',
    in_stock: true,
    stock_quantity: 18,
    image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
    batch_no: 'DAB-CP204',
    expiry_date: '2027-08',
    manufacturer: 'Dabur India Ltd',
    barcode: '8901207010456',
    metadata: {
      composition: 'Amla, Ashwagandha, Pippali, 40+ Ayurvedic Herbs',
      schedule: 'Ayurvedic Proprietary',
      rack_location: 'Herbal Section - Shelf C',
      storage_temp: 'Store in cool dry place',
      dosage: '1-2 tablespoons with warm milk'
    },
    created_at: '2026-09-12T12:00:00Z',
    updated_at: '2026-10-03T16:00:00Z'
  },
  {
    id: 'prod-004',
    name: 'Himalaya Liv.52 DS Tablets',
    category_name: 'Ayurvedic',
    mrp: 230.00,
    selling_price: 207.00,
    discount_percentage: 10,
    unit: 'Bottle',
    in_stock: true,
    stock_quantity: 26,
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&auto=format&fit=crop&q=80',
    batch_no: 'HIM-LV771',
    expiry_date: '2027-03',
    manufacturer: 'The Himalaya Drug Company',
    barcode: '8901138501235',
    metadata: {
      composition: 'Himsra, Kasani, Mandur Bhasma',
      schedule: 'Ayurvedic OTC',
      rack_location: 'Herbal Section - Shelf B',
      dosage: '1-2 tablets twice daily before meals'
    },
    created_at: '2026-09-08T08:00:00Z',
    updated_at: '2026-09-28T10:00:00Z'
  },
  {
    id: 'prod-005',
    name: 'Cetaphil Gentle Skin Cleanser 250ml',
    category_name: 'Cosmetics',
    mrp: 635.00,
    selling_price: 570.00,
    discount_percentage: 10.24,
    unit: 'Bottle',
    in_stock: true,
    stock_quantity: 14,
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
    batch_no: 'GAL-CET90',
    expiry_date: '2027-10',
    manufacturer: 'Galderma India Pvt Ltd',
    barcode: '7612076449102',
    metadata: {
      composition: 'Niacinamide, Panthenol, Glycerin',
      schedule: 'Derma Cosmetic',
      rack_location: 'Derma Display - Stand 1',
      storage_temp: 'Room Temperature'
    },
    created_at: '2026-09-18T14:00:00Z',
    updated_at: '2026-10-04T12:00:00Z'
  },
  {
    id: 'prod-006',
    name: 'Neutrogena Ultra Sheer Dry-Touch Sunblock SPF 50+',
    category_name: 'Cosmetics',
    mrp: 675.00,
    selling_price: 600.00,
    discount_percentage: 11.11,
    unit: 'Tube',
    in_stock: true,
    stock_quantity: 9,
    image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80',
    batch_no: 'JNJ-NT550',
    expiry_date: '2026-12',
    manufacturer: 'Johnson & Johnson Pvt Ltd',
    barcode: '8901012117822',
    metadata: {
      composition: 'Helioplex with Broad Spectrum UVA/UVB',
      schedule: 'Cosmetic',
      rack_location: 'Derma Display - Stand 2'
    },
    created_at: '2026-09-19T10:00:00Z',
    updated_at: '2026-10-05T09:30:00Z'
  },
  {
    id: 'prod-007',
    name: 'Ensure Vanilla Nutritional Powder 400g',
    category_name: 'Provisional',
    mrp: 750.00,
    selling_price: 690.00,
    discount_percentage: 8.00,
    unit: 'Box',
    in_stock: true,
    stock_quantity: 8,
    image_url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=80',
    batch_no: 'ABT-ENS44',
    expiry_date: '2026-10', // Soon to expire / prompt alert
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    barcode: '8901088031548',
    metadata: {
      composition: '32 Essential Nutrients, High Protein, Prebiotics',
      schedule: 'Dietary Food Supplement',
      rack_location: 'Nutrition Aisle - Rack 3',
      storage_temp: 'Store in airtight container after opening'
    },
    created_at: '2026-08-20T11:00:00Z',
    updated_at: '2026-10-06T15:20:00Z'
  },
  {
    id: 'prod-008',
    name: 'Dettol Antiseptic Liquid 550ml',
    category_name: 'Provisional',
    mrp: 232.00,
    selling_price: 215.00,
    discount_percentage: 7.33,
    unit: 'Bottle',
    in_stock: true,
    stock_quantity: 3, // LOW STOCK alert
    image_url: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&auto=format&fit=crop&q=80',
    batch_no: 'RB-DET109',
    expiry_date: '2028-01',
    manufacturer: 'Reckitt Benckiser India',
    barcode: '8901396112209',
    metadata: {
      composition: 'Chloroxylenol (C8H9ClO) 4.8% w/v',
      schedule: 'First Aid Antiseptic',
      rack_location: 'Hygiene & Cleanliness - Shelf 1'
    },
    created_at: '2026-08-25T16:00:00Z',
    updated_at: '2026-10-07T14:00:00Z'
  },
  {
    id: 'prod-009',
    name: 'Surgical Latex Examination Gloves (Pack of 100)',
    category_name: 'Surgical',
    mrp: 520.00,
    selling_price: 450.00,
    discount_percentage: 13.46,
    unit: 'Box',
    in_stock: true,
    stock_quantity: 2, // CRITICAL LOW STOCK
    image_url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80',
    batch_no: 'ROM-GLV88',
    expiry_date: '2029-04',
    manufacturer: 'Romsons Group of Industries',
    barcode: '8903429810012',
    metadata: {
      composition: 'Pre-powdered Natural Rubber Latex - Size M',
      schedule: 'Medical Device Class B',
      rack_location: 'Surgical Ward Storage - Bay 5'
    },
    created_at: '2026-09-01T09:00:00Z',
    updated_at: '2026-10-08T18:00:00Z'
  },
  {
    id: 'prod-010',
    name: 'Omron Hem-7120 Blood Pressure Monitor',
    category_name: 'Surgical',
    mrp: 2480.00,
    selling_price: 1999.00,
    discount_percentage: 19.39,
    unit: 'Pcs',
    in_stock: true,
    stock_quantity: 6,
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=80',
    batch_no: 'OMR-BP2024',
    expiry_date: 'N/A (3 Yr Warranty)',
    manufacturer: 'Omron Healthcare Co. Ltd',
    barcode: '4975479409875',
    metadata: {
      composition: 'Fully Automatic Digital Upper Arm BP Monitor with Intellisense',
      schedule: 'Medical Device Class B',
      rack_location: 'Equipment Glass Display',
      warranty: '3 Years Comprehensive'
    },
    created_at: '2026-09-05T13:00:00Z',
    updated_at: '2026-10-09T10:00:00Z'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-101',
    invoice_no: 'INV-2026-0042',
    customer_name: 'Rahul Sharma',
    customer_phone: '+91 98765 43210',
    doctor_name: 'Dr. V. K. Gupta (MD)',
    payment_mode: 'UPI',
    items: [
      {
        id: 'item-1',
        product_id: 'prod-001',
        product_name: 'Augmentin 625 Duo Tablet',
        batch_no: 'AUG-24B09',
        quantity: 2,
        unit: 'Strips',
        unit_price: 201.15,
        mrp: 223.50,
        total_price: 402.30
      },
      {
        id: 'item-2',
        product_id: 'prod-002',
        product_name: 'Dolo 650 Paracetamol Tablet',
        batch_no: 'DL-9821A',
        quantity: 1,
        unit: 'Strips',
        unit_price: 30.60,
        mrp: 34.00,
        total_price: 30.60
      }
    ],
    total_amount: 432.90,
    discount_amount: 15.00,
    tax_amount: 21.65,
    net_amount: 439.55,
    notes: 'Prescription verified',
    created_at: '2026-10-09T11:15:00Z'
  },
  {
    id: 'sale-102',
    invoice_no: 'INV-2026-0041',
    customer_name: 'Pooja Verma',
    customer_phone: '+91 91234 56789',
    doctor_name: 'Self OTC',
    payment_mode: 'Cash',
    items: [
      {
        id: 'item-3',
        product_id: 'prod-003',
        product_name: 'Dabur Chyawanprash Awaleha 1kg',
        batch_no: 'DAB-CP204',
        quantity: 1,
        unit: 'Bottle',
        unit_price: 375.00,
        mrp: 415.00,
        total_price: 375.00
      }
    ],
    total_amount: 375.00,
    discount_amount: 0.00,
    tax_amount: 18.75,
    net_amount: 393.75,
    notes: 'Winter wellness OTC purchase',
    created_at: '2026-10-09T09:40:00Z'
  }
];

export const SAMPLE_SCAN_PRESETS = [
  {
    name: 'Augmentin 625 Duo Strip',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    data: {
      name: 'Augmentin 625 Duo Tablet',
      category_name: 'Allopathic',
      mrp: 223.50,
      selling_price: 201.15,
      discount_percentage: 10,
      unit: 'Strips',
      stock_quantity: 30,
      batch_no: 'AUG-26F88',
      expiry_date: '2027-10',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
      barcode: '8901030784912',
      composition: 'Amoxicillin 500mg + Potassium Clavulanate 125mg'
    }
  },
  {
    name: 'Azithral 500mg Tablets',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80',
    data: {
      name: 'Azithral 500 Tablet',
      category_name: 'Allopathic',
      mrp: 132.00,
      selling_price: 118.80,
      discount_percentage: 10,
      unit: 'Strips',
      stock_quantity: 25,
      batch_no: 'AZ-9934B',
      expiry_date: '2027-08',
      manufacturer: 'Alembic Pharmaceuticals Ltd',
      barcode: '8901117210884',
      composition: 'Azithromycin IP 500mg'
    }
  },
  {
    name: 'Patanjali Dant Kanti 200g',
    image: 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=600&auto=format&fit=crop&q=80',
    data: {
      name: 'Patanjali Dant Kanti Dental Paste 200g',
      category_name: 'Ayurvedic',
      mrp: 110.00,
      selling_price: 99.00,
      discount_percentage: 10,
      unit: 'Tube',
      stock_quantity: 40,
      batch_no: 'PAT-DK441',
      expiry_date: '2028-02',
      manufacturer: 'Patanjali Ayurved Limited',
      barcode: '8904109405011',
      composition: 'Akarkara, Neem, Babool, Tomar, Pudina'
    }
  },
  {
    name: 'Micropore Surgical Tape 1 Inch',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80',
    data: {
      name: '3M Micropore Surgical Paper Tape 1" x 10 yds',
      category_name: 'Surgical',
      mrp: 75.00,
      selling_price: 65.00,
      discount_percentage: 13.33,
      unit: 'Pcs',
      stock_quantity: 50,
      batch_no: '3M-MP702',
      expiry_date: '2029-06',
      manufacturer: '3M Healthcare Ltd',
      barcode: '707387065910',
      composition: 'Hypoallergenic microporous paper adhesive tape'
    }
  }
];

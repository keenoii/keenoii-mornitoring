import { NextRequest, NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';

export const runtime = 'nodejs';

// Allowed MIME types
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'กรุณาเลือกไฟล์รูปภาพที่ต้องการอัพโหลด' },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'ขนาดไฟล์ใหญ่เกินกำหนด (สูงสุด 25MB)' },
        { status: 400 }
      );
    }

    // Validate type
    const mimeType = file.type?.toLowerCase();
    const originalName = file.name || 'image.png';
    const extension = path.extname(originalName).toLowerCase() || '.png';

    if (!ALLOWED_TYPES.has(mimeType) && !['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(extension)) {
      return NextResponse.json(
        { error: 'ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ PNG, JPG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists inside public
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const safeBaseName = path
      .basename(originalName, extension)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const finalFileName = `office-bg-${safeBaseName}-${uniqueSuffix}${extension}`;
    const filePath = path.join(uploadsDir, finalFileName);

    // Convert file to buffer and write to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${finalFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: finalFileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      message: 'อัพโหลดรูปภาพสำเร็จ',
    });
  } catch (error: any) {
    console.error('Failed to upload office background image:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ' },
      { status: 500 }
    );
  }
}

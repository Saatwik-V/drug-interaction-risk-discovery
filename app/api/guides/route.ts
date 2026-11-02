import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { requireRole, handleAuthError } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// Whitelist of guides this endpoint will ever serve — never an arbitrary
// path from the request, so there is no directory-traversal surface here.
const GUIDES: Record<string, { title: string; file: string }> = {
  final: { title: 'Final Viva Demonstration Guide', file: 'FINAL_VIVA_DEMO_GUIDE.md' },
  enhanced: { title: 'Enhanced Viva Demonstration Guide', file: 'ENHANCED_VIVA_DEMO_GUIDE.md' },
};

marked.setOptions({ gfm: true, breaks: false });

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['DOCTOR', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('doc') || 'enhanced';
    const guide = GUIDES[key];

    if (!guide) {
      return NextResponse.json(
        { success: false, error: `Unknown guide "${key}". Valid options: ${Object.keys(GUIDES).join(', ')}.` },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), 'docs', 'reviews', guide.file);
    const raw = await readFile(filePath, 'utf-8');
    const html = await marked.parse(raw);

    return NextResponse.json({
      success: true,
      key,
      title: guide.title,
      sourcePath: `docs/reviews/${guide.file}`,
      html,
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ success: false, error: 'Guide file not found on disk.' }, { status: 404 });
    }
    return handleAuthError(error);
  }
}

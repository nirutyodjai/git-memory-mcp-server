import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PlaywrightTools, PlaywrightAction } from '../../../../../../lib/playwright-tools';

let playwrightTools: PlaywrightTools | null = null;

async function getPlaywrightTools() {
  if (!playwrightTools) {
    playwrightTools = new PlaywrightTools({
      browserType: 'chromium',
      headless: true,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
      enableScreenshots: true,
      enableTracing: false,
      enableVideo: false,
    });
  }
  return playwrightTools;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, action }: { sessionId: string; action: PlaywrightAction } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action is required' }, { status: 400 });
    }

    const pt = await getPlaywrightTools();
    let currentSessionId = sessionId;

    if (!currentSessionId) {
        const newSession = await pt.initBrowser();
        currentSessionId = newSession.id;
    }

    const result = await pt.executeAction(currentSessionId, action);

    return NextResponse.json({ ...result, sessionId: currentSessionId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { PlaywrightTools, PlaywrightAction } from '../../../../../3d-sco/lib/playwright-tools';

let playwrightTools: PlaywrightTools | null = null;

async function getPlaywrightTools() {
  if (!playwrightTools) {
    playwrightTools = new PlaywrightTools();
    await playwrightTools.initializeBrowser();
  }
  return playwrightTools;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, parameters } = body;

    const pt = await getPlaywrightTools();

    switch (action) {
      case 'start':
        const { url, viewport, headers } = parameters;
        const sessionId = await pt.startSession(url, viewport, headers);
        return NextResponse.json({ sessionId });

      case 'close':
        await pt.closeSession(parameters.sessionId);
        return NextResponse.json({ success: true });

      case 'execute':
        const { sessionId: executeSessionId, actions } = parameters;
        const results = await pt.executeActions(executeSessionId, actions as PlaywrightAction[]);
        return NextResponse.json({ results });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
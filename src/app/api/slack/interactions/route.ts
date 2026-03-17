import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

// Verify Slack Request Signature
function verifySignature(req: NextRequest, body: string) {
  const signature = req.headers.get('x-slack-signature');
  const timestamp = req.headers.get('x-slack-request-timestamp');
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signature || !timestamp || !signingSecret) return false;

  // Replay attack protection
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 60 * 5;
  if (parseInt(timestamp) < fiveMinutesAgo) return false;

  const hmac = createHmac('sha256', signingSecret);
  const [version, hash] = signature.split('=');
  
  hmac.update(`${version}:${timestamp}:${body}`);
  
  return hmac.digest('hex') === hash;
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  
  // Verify signature (skip in dev if no secret)
  if (process.env.NODE_ENV === 'production' || process.env.SLACK_SIGNING_SECRET) {
     if (!verifySignature(req, bodyText)) {
       return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
     }
  }

  // Parse payload (Slack sends form-urlencoded 'payload' param)
  const params = new URLSearchParams(bodyText);
  const payloadStr = params.get('payload');
  
  if (!payloadStr) {
    return NextResponse.json({ error: 'No payload' }, { status: 400 });
  }

  const payload = JSON.parse(payloadStr);

  // Handle Block Actions
  if (payload.type === 'block_actions') {
    const action = payload.actions[0];
    
    if (action.action_id === 'start_study_action') {
       // Extract Study ID from value "start_study_123"
       const studyId = action.value.split('_')[2];
       
       console.log(`User ${payload.user.username} started study ${studyId}`);
       
       // Logic to update status to "In Progress"
       // updateStudyStatus(studyId, 'in_progress'); 
       
       // Respond to Slack (update message or open modal/link)
       // For this workflow, we want to open the Web App. 
       // Slack buttons can open URLs directly if configured as 'url' buttons,
       // BUT we want to capture the timestamp/state first.
       
       // Better approach: The button opens a URL. 
       // But if we want to track "started", we can use an API call.
       
       // For now, let's just acknowledge.
       
       // If we want to open the web app, we likely need to send a message with a Link.
       // Or the original button could be a Link Button. 
       // Let's assume we reply with a link to the mobile view.
       
       const mobileUrl = `${process.env.NEXTAUTH_URL}/engineer/study/${studyId}`;
       
       // Identify user and send ephemeral message with link
       // Or update the original message.
       
       return NextResponse.json({
         text: "Estudio iniciado! Abre el siguiente enlace:",
         blocks: [
           {
             type: "section",
             text: {
               type: "mrkdwn",
               text: `Estudio #${studyId} iniciado. <${mobileUrl}|*Abrir Formulario de Campo*>`
             }
           }
         ],
         replace_original: true 
       });
    }
  }

  return NextResponse.json({ ok: true });
}

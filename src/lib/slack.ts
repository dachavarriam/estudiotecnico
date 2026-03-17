import { WebClient } from '@slack/web-api';

const token = process.env.SLACK_BOT_TOKEN;

// Initialize Slack Client
export const slack = new WebClient(token);

export async function sendNotification(channelId: string, text: string, blocks?: any[]) {
  try {
    const result = await slack.chat.postMessage({
      channel: channelId,
      text: text,
      blocks: blocks,
    });
    return { success: true, ts: result.ts };
  } catch (error) {
    console.error('Error sending Slack message:', error);
    return { success: false, error };
  }
}

// Example block for "Start Study"
export function getStartStudyBlocks(studyId: number, clientName: string, engineerId: string) {
  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": `*Nuevo Estudio Técnico Asignado* :clipboard:\n\n*Cliente:* ${clientName}\n*ID:* ${studyId}\n\nPor favor inicia el estudio cuando llegues al sitio.`
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Iniciar Estudio",
            "emoji": true
          },
          "style": "primary",
          "value": `start_study_${studyId}`,
          "action_id": "start_study_action"
        }
      ]
    }
  ];
}

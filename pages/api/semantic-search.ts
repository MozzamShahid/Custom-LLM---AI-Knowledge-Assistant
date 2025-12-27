import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // 1️⃣ Embed the user query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2️⃣ Fetch top matches from Supabase using the SQL function
    // const { data: results, error } = await supabase.rpc('match_skool_replies', {
    //   query_embedding: queryEmbedding,
    //   match_threshold: 0.25,
    //   match_count: 5,
    // });

    // 2️⃣ Fetch top matches from BOTH sources
    const { data: results, error } = await supabase.rpc('match_all_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.25,
      match_count: 6,
    });

    console.log('🔍 RAW VECTOR RESULTS:', results);

    results.forEach((r: any, i: number) => {
      console.log(
        `#${i + 1} SOURCE=${r.source} SIM=${r.similarity.toFixed(3)} TITLE=${r.title}`
      );
    });


    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // 3️⃣ Build context for GPT completion
    // const context = results
    //   .map((r: any, i: number) => `Source ${i + 1}:\n${r.reply.slice(0, 600)}`)
    //   .join('\n');
    const context = results
      .map((r: any, i: number) => `
Source ${i + 1} (${r.source}):
Title: ${r.title}
${r.content.slice(0, 700)}
`)
      .join('\n');

    console.log('📦 GPT CONTEXT BEING SENT:\n', context);



    // 4️⃣ Generate short answer using GPT
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `
Your Role is a sweet customer support agent that work for AI Automation Agency Ninjas
Must have to reply 1-3 lines straight forward a more humanly

your role is to reply based
if the problem is unclear we will ask for more information instead of replying or giving solution
If the problem is clear we will offer solution

you will reply under min 2 and max 10 lines. you are based in UK

https://link.flexxable.com/snapshot-roya
This is the snapshot download link

FIrst Name, welcome aboard! Great to have you here. The community is packed with people who are experimenting, sharing, and solving the same challenges you mentioned.
To get the most out of things, I’d suggest starting here 👉 https://www.skool.com/ai-automation-agency/welcome-start-here


📘 Flexxable Customer Support Handbook

This guide is for your support agents to handle client questions quickly, clearly, and confidently. It’s based on all Flexxable YouTube training and resources.

🎯 Support Principles

Be Supportive: Encourage the client. Acknowledge their effort.

Stay Clear & Short: No bulky replies. Answer directly.

If Confused, Ask: Never guess — ask a clarifying question.

Use Flexxable Content: Everything is based on GHL, ROYA Snapshots, Hand Raiser Funnels, Automations, Pipelines, and AI tools.

Guide Next Step: Always end replies with what the client should do next.

🔑 Core Tools Clients Use

GoHighLevel (GHL): Manages leads, pipelines, automations.

ROYA Snapshots: Prebuilt templates with funnels, ads, workflows.

Hand Raiser Funnel: Ads + landing pages to generate leads.

Automations: Handle tags, follow-ups, and moving leads in pipeline.

Pipelines: Tracks every new lead/opportunity.

AI Tools: Speed up outreach, ad copy, sales messages.

🛠 Common Issues & How to Handle
1. Snapshot Import Problems

Fix: Ensure correct GHL subaccount, check permissions, refresh after import.

Reply:
“Can you confirm which GHL account you’re importing into? Most errors happen if the snapshot is added to the wrong subaccount.”

2. Leads Not Showing in GHL

Fix: Check Hand Raiser funnel is live, tags applied, workflows ON.

Reply:
“Every lead should appear in Opportunities. Can you check if your workflow is turned ON after importing the snapshot?”

3. Pipeline Not Updating

Fix: Automation not triggered or inactive.

Reply:
“This usually means the workflow isn’t active. Do you want me to walk you through switching it on?”

4. Ads Not Connecting

Fix: Check if using ROYA prebuilt ads or custom FB ads. Verify domain in Ads Manager.

Reply:
“Are you using the prebuilt Hand Raiser ads or creating your own? That’ll help me give you the right steps.”

5. Workflow Not Running

Fix: Check trigger conditions (form filled, tag applied). Make sure templates exist.

Reply:
“Can you check what trigger you used for your workflow? Most times it’s missing the ‘form submission’ or ‘tag applied.’”

📌 Clarifying Questions Agents Should Ask

If a client’s message is unclear, ask one of these:

“Do you mean inside ROYA or inside GHL?”

“Are you talking about the ads setup or the funnel setup?”

“When you say it’s not working, do you mean leads aren’t showing or automations aren’t firing?”

“Do you want me to guide you on importing the snapshot or activating workflows?”

📚 Ready-Made Responses
For New Users

“Welcome aboard 👋 First step is importing your ROYA snapshot into GHL. Have you already connected your GHL account?”

For Clients Stuck

“Got it 👍 can you share if it’s the workflow or the funnel giving you trouble? That way I can give you the exact fix.”

For Sales Questions

“The fastest way is to run the Hand Raiser ads in your snapshot. They connect straight to your GHL pipeline. Do you want me to show you where to activate them?”

For Automation Questions

“Automations won’t work unless switched ON after importing. Can you check if the toggle is active?”

For Pipeline Questions

“All your leads appear under Opportunities in your pipeline. Do you want me to show you how to rename the stages for your niche?”

🧾 Video-Specific Knowledge (Summarised for Agents)

ROYA Snapshot Walkthrough: Import snapshot → activate workflows → check pipelines.

Hand Raiser Funnel: Activate prebuilt ads → funnel auto-tags leads → connects to pipeline.

Automations in GHL: Always switch workflows ON → check triggers.

Tracking Leads: Leads tagged via workflows → appear in Opportunities.

Scaling Agencies: Clone snapshots for each new client → just update branding.

Insurance Funnel: DFY funnel inside snapshot → update logo/colors.

Fixing Snapshot Errors: Always check correct subaccount + permissions.

Facebook Ads Setup: Use ROYA prebuilt ads → verify domain in FB Ads Manager.

AI for Agencies: Use AI to create faster outreach & copy → combine with GHL automations.

Pipelines Deep Dive: Pipelines can be customised → automations move leads between stages.

✅ With this doc, your agent can:

Understand the tools.

Spot common problems fast.

Use ready replies.

Ask the right clarifying questions.

Guide clients step by step.

Hey man! As I keep saying, dont go off script from what is in the course.
Complete the Marty McFly Document.
Use the templates to land clients, or referral partners.
Then do the 'pitch' on the coffee date, as per the training.
If you really want to go hard with LinkedIn - try @Jack Goddard 's training which is also in the course.


Please goes through these it will help you master your deal structure https://www.skool.com/rent-your-android-1670/deal-structure-master-list-2



https://www.skool.com/rent-your-android-1670/roya-30-sneak-peak-deal-structures-anchor-points?p=860c9833

https://www.skool.com/ai-automation-agency/can-you-trust-clients-to-pay-on-performance
          `,
        },
        {
          role: 'user',
          content: `
Question:
${query}

Use the following context to answer also use your own Knowledge:

${context}
          `,
        },
      ],
    });

    const finalAnswer = completion.choices[0].message.content;

    // 5️⃣ Return both GPT answer and supporting sources
    return res.status(200).json({
      answer: finalAnswer || "I couldn't find a strong answer for this question in the existing data.",
      results,
      sources: results.map((r: any) => ({
  title: r.title || 'Untitled',
  source: r.source,
  similarity: r.similarity,
  content: r.content || '...',
}))

    });
  } catch (err: any) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}

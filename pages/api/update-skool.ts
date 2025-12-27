import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1️⃣ Fetch all rows that need embeddings
    // const { data: rows, error } = await supabase
    //   .from('skool_replies')
    //   .select('id, post_title, post_description, reply')
    //   .is('embeddings', null); // only rows without embedding

    const { data: rows, error } = await supabase
      .from('document_skool')
      .select('id, document_title, document_content')
      .is('embeddings', null); // only rows without embedding

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!rows || rows.length === 0) {
      return res.status(200).json({ message: 'No rows need embedding.' });
    }

    const updatedRows: number[] = [];

    for (const row of rows) {
      const text = `${row.document_title}\n${row.document_content}`;

      // 2️⃣ Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // 3️⃣ Update Supabase row
      const { error: updateError } = await supabase
        .from('document_skool')
        .update({ embeddings: embedding })
        .eq('id', row.id);

      if (updateError) {
        console.error(`Failed to update row ${row.id}:`, updateError);
        continue;
      }

      console.log(`✅ Updated row ID ${row.id} with embedding`);
      updatedRows.push(row.id);
    }

    return res.status(200).json({
      message: `🎉 Updated embeddings for ${updatedRows.length} rows.`,
      updated: updatedRows.length,
    });
  } catch (err: any) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}

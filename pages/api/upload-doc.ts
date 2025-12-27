// Supabase JSON File Uplaod Save it somewhere we need it for later
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import fs from 'fs';
import path from 'path';

type ReplyDocs = {
  postTitle: string;
  postDescription: string;
  author: string;
  reply: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Load JSON from file (or can use req.body)
    const filePath = path.join(process.cwd(), 'data', 'mozzam.json');
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: 'JSON file not found' });
    }

    const fileData: ReplyDocs[] = JSON.parse(
      fs.readFileSync(filePath, 'utf-8')
    );

    if (!Array.isArray(fileData) || fileData.length === 0) {
      return res.status(400).json({ error: 'No data to insert' });
    }

    const results = [];

    for (const item of fileData) {
      const { data, error } = await supabase.from('skool_replies').insert({
        post_title: item.postTitle,
        post_description: item.postDescription,
        author: item.author,
        reply: item.reply,
        // embedding: [], // empty for now, can be updated with AI embeddings later
      });

      if (error) {
        console.error('Insert error:', error);
      } else {
        results.push(data);
      }
    }

    return res.status(200).json({
      message: `✅ All data uploaded! Inserted ${results.length} rows.`,
      inserted: results.length,
    });
  } catch (err: any) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}

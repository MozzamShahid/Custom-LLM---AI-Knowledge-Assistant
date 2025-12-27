
---

# **Project Documentation: AI Knowledge Assistant**

## **1. Project Overview**

This project is an AI-powered knowledge assistant that:

* Accepts user queries via API.
* Retrieves relevant information from a Supabase database (documents + replies).
* Generates concise answers using OpenAI GPT.
* Returns both the answer and supporting sources for traceability.

**Key Features:**

* Multi-source support: Skool replies, internal documents, or any structured knowledge base.
* Context-aware GPT responses.
* Embedding-based semantic search via Supabase + OpenAI.
* Extensible schema for adding new knowledge sources.
* Simple API endpoint for integration into web apps.

---

## **2. Repository Setup**

### **2.1 Create Repo**

1. Go to GitHub → **New Repository** → `Private`.
2. Clone locally:

   ```bash
   git clone git@github.com:YOUR_USERNAME/ai-knowledge-assistant.git
   cd ai-knowledge-assistant
   ```
3. Initialize Node.js project:

   ```bash
   npm init -y
   ```
4. Install dependencies:

   ```bash
   npm install next react react-dom openai @supabase/supabase-js
   npm install --save-dev typescript @types/node
   ```
5. Initialize TypeScript:

   ```bash
   npx tsc --init
   ```
6. Add `.gitignore`:

   ```
   node_modules
   .env
   .next
   ```

---

### **2.2 Environment Variables**

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPEN_AI_KEY=your_openai_api_key
```

> **Important:** Never push `.env` to GitHub.

---

## **3. Supabase Setup**

### **3.1 Database Tables**

**1. Skool Replies Table**

| Column     | Type         | Notes              |
| ---------- | ------------ | ------------------ |
| id         | uuid         | primary key        |
| post_title | text         | title of the reply |
| reply      | text         | the content        |
| embedding  | vector(1536) | OpenAI embedding   |
| created_at | timestamp    | default `now()`    |

**2. Documents Table**

| Column     | Type         | Notes            |
| ---------- | ------------ | ---------------- |
| id         | uuid         | primary key      |
| title      | text         | document title   |
| content    | text         | main content     |
| embedding  | vector(1536) | OpenAI embedding |
| created_at | timestamp    | default `now()`  |

---

### **3.2 Embedding Storage**

* **Embedding model:** `text-embedding-3-small`
* **Vector size:** 1536
* **RPC Function for Matching:**

```sql
CREATE OR REPLACE FUNCTION match_all_knowledge(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id uuid,
    source text,
    title text,
    content text,
    reply text,
    similarity float
)
AS $$
BEGIN
    RETURN QUERY
    SELECT id, 'skool_reply' as source, post_title, null, reply,
           1 - (embedding <=> query_embedding) as similarity
    FROM skool_replies
    WHERE 1 - (embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;

    -- You can add UNION ALL to include documents
END;
$$ LANGUAGE plpgsql;
```

> **Tip:** Always normalize fields like `title` and `content` in the API code.

---

### **3.3 Updating Embeddings**

Whenever you insert new content:

```ts
import OpenAI from 'openai';
import { supabase } from './lib/supabase';

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

async function addReply(post_title: string, reply: string) {
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: reply,
  });

  await supabase.from('skool_replies').insert({
    post_title,
    reply,
    embedding: embedding.data[0].embedding,
  });
}
```

> Same applies for documents.

---

## **4. Next.js API Endpoint**

File: `pages/api/ask.ts`

### **4.1 Key Steps**

1. Receive POST request with `query`.
2. Generate embedding for query.
3. Fetch top matches from Supabase using RPC.
4. Normalize content (`reply`, `content`, `document_content`).
5. Build GPT context.
6. Call OpenAI Chat API (`gpt-4o-mini`).
7. Return response + supporting sources.

```ts
const context = results
  .map((r: any, i: number) => {
    const text = r.reply || r.content || r.document_content || '';
    return `
Source ${i + 1} (${r.source}):
Title: ${r.title || r.post_title || 'N/A'}
${text.slice(0, 700)}
`;
  })
  .join('\n');
```

> Always ensure context is non-empty.

---

## **5. ChatGPT Usage**

**System Prompt Example:**

```
You are an expert AI automation consultant.
Answer clearly, confidently, and practically.
If the context is weak, say so honestly.
Keep answers under 2 lines.
```

**User Prompt:**

```
Question:
<user query>

Use ONLY the following context to answer:
<context>
```

> Restricting GPT to context prevents hallucinations.

---

## **6. Updating Knowledge Base**

1. Insert new replies/documents.
2. Generate embeddings with OpenAI.
3. Insert into Supabase tables.
4. Update RPC if new table/fields are added.
5. Test API endpoint with new content.

---

## **7. Version Control / Updating Repo**

**Add changes:**

```bash
git add .
git commit -m "Added API endpoint for AI chat"
git push origin main
```

**Update dependencies:**

```bash
npm install <package>@latest
```

**Database changes:**

* Alter tables carefully:

```sql
ALTER TABLE skool_replies ADD COLUMN new_field text;
```

* Update your RPC functions if fields change.

---

## **8. Debugging Tips**

* Log `results[0]` to verify fields before GPT.
* Check `context` length.
* Use fallback messages if context is weak:

```ts
answer || "I couldn't find a strong answer for this question."
```

* Confirm embeddings match vector size (1536).

---

## **9. Optional Enhancements**

* Pagination for large knowledge base.
* Multi-language support.
* Confidence score in GPT responses.
* Caching frequently asked questions.

---

This documentation **covers the full lifecycle**:

* Repo creation & update
* Environment setup
* Database + embedding handling
* API + GPT integration
* Adding/updating content
* Debugging

---


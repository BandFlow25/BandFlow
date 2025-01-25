// src/app/api/metadata/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';


let openai: OpenAI | null = null;
try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not defined');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
}

export async function POST(request: Request) {
  if (!openai) {
    console.error('OpenAI instance is not available');
    return NextResponse.json(
      { error: 'OpenAI configuration error' }, 
      { status: 500 }
    );
  }

  try {
    const { title, artist } = await request.json();
    
    if (!title || !artist) {
      return NextResponse.json(
        { error: 'Title and artist are required' }, 
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a music expert. Respond only with a strict JSON object containing the following fields: 'key' (musical key), and'bpm' (tempo in beats per minute). All fields are mandatory. If you do not know any value, research or infer the most likely option based on musical knowledge."
        },
        {
          role: "user",
          content: `What is the musical key and bpm for "${title}" by ${artist}?`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in completion response');
    }

    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    console.error('Error in metadata API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' }, 
      { status: 500 }
    );
  }
}
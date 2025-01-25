// src/lib/services/ai/songMetadata.ts

export async function getSongMetadata(title: string, artist: string) {
  try {
      
    const response = await fetch('/api/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, artist })
    });

      
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch metadata: ${errorText}`);
    }

    const data = await response.json();
   
    
    return {
      key: data.key,
      bpm: parseInt(data.bpm)
    };
  } catch (error) {
    console.error('Error fetching song metadata:', error);
    return null;
  }
}
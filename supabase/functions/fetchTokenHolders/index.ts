import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('SOLANA_TRACKER_API_KEY')
    if (!apiKey) {
      console.error('SOLANA_TRACKER_API_KEY not found in environment variables')
      throw new Error('API key not found')
    }

    console.log('Retrieved API key successfully')

    const tokenAddress = '3KzBEUwCm3Jfs61ikr1VDAzhpkkdhzLZUKVuBacRpump'
    const url = `https://data.solanatracker.io/tokens/${tokenAddress}/holders`

    console.log('Fetching token holders from Solana Tracker API...')
    console.log('Request URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`API request failed: ${response.statusText}. Status: ${response.status}. Body: ${errorText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched token holders data')

    // Store data in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found')
      throw new Error('Supabase credentials not found')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Clear existing data and insert new data
    await supabase
      .from('token_holders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    const holders = data.accounts.map((holder: any) => ({
      wallet_address: holder.wallet,
      token_amount: holder.amount,
      percentage: holder.percentage,
    }))

    const { error: insertError } = await supabase
      .from('token_holders')
      .insert(holders)

    if (insertError) {
      console.error('Error inserting data into Supabase:', insertError)
      throw insertError
    }

    console.log('Successfully stored token holders in database')

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in fetchTokenHolders function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
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
    console.log('Starting fetchTokenHolders function...')
    
    const apiKey = Deno.env.get('SOLANA_TRACKER_API_KEY')
    if (!apiKey) {
      console.error('SOLANA_TRACKER_API_KEY not found in environment variables')
      throw new Error('API key not found')
    }

    console.log('Retrieved API key successfully:', apiKey.substring(0, 8) + '...')

    const tokenAddress = 'GxHJDpqpPGjeM1n9y2WnDxjJzXzL43p593DdauEmXTkE'
    const url = `https://data.solanatracker.io/tokens/${tokenAddress}/holders`

    console.log('Making API request to:', url)
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json',
      }
    })

    console.log('API Response Status:', response.status)
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries()),
      })
      throw new Error(`API request failed: ${response.statusText}. Status: ${response.status}. Body: ${errorText}`)
    }

    const data = await response.json()
    console.log('Raw API response:', JSON.stringify(data, null, 2))

    if (!data) {
      console.error('Empty API response')
      throw new Error('Empty API response')
    }

    // Store data in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found')
      throw new Error('Supabase credentials not found')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    console.log('Supabase client initialized')

    // Clear existing data
    console.log('Clearing existing token holders data...')
    const { error: deleteError } = await supabase
      .from('token_holders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      console.error('Error deleting existing data:', deleteError)
      throw deleteError
    }

    console.log('Successfully cleared existing data')

    // Transform and insert new data
    let holders;
    if (Array.isArray(data)) {
      console.log('Processing array response format')
      holders = data.map((holder: any) => ({
        wallet_address: holder.owner,
        token_amount: holder.amount,
        percentage: (holder.amount / holder.total_supply) * 100,
      }))
    } else if (data.accounts && Array.isArray(data.accounts)) {
      console.log('Processing object with accounts array format')
      holders = data.accounts.map((holder: any) => ({
        wallet_address: holder.wallet || holder.owner,
        token_amount: holder.amount,
        percentage: holder.percentage || (holder.amount / holder.total_supply) * 100,
      }))
    } else {
      console.error('Unexpected data format:', data)
      throw new Error('Invalid data format received from API')
    }

    console.log('Transformed data. Number of holders:', holders.length)
    console.log('First holder example:', holders[0])

    const { error: insertError } = await supabase
      .from('token_holders')
      .insert(holders)

    if (insertError) {
      console.error('Error inserting data into Supabase:', insertError)
      throw insertError
    }

    console.log('Successfully stored token holders in database')

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Token holders data updated successfully',
      count: holders.length 
    }), {
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
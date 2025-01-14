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
    console.log('Starting fetchTokenHolders function using Solscan API...')
    
    const apiToken = Deno.env.get('SOLSCAN_API_TOKEN')
    if (!apiToken) {
      console.error('SOLSCAN_API_TOKEN not found in environment variables')
      throw new Error('API token not found')
    }

    console.log('Retrieved Solscan API token successfully')

    const tokenAddress = '7H7Au1DETfVTd1eMRY96m6R4J65ZFTGZAVZvmmiRpump'
    const url = `https://pro-api.solscan.io/v2.0/token/holders?address=${tokenAddress}&page=1&page_size=500`

    console.log('Making API request to Solscan:', url)
    
    const response = await fetch(url, {
      headers: {
        'token': apiToken,
        'Accept': 'application/json',
      }
    })

    console.log('Solscan API Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Solscan API request failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Raw Solscan API response structure:', Object.keys(data))

    if (!data || !data.data || !Array.isArray(data.data.items)) {
      console.error('Unexpected data format from Solscan API:', data)
      throw new Error('Invalid data format received from Solscan API')
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

    // Transform data from Solscan API response
    const TOTAL_SUPPLY = 1_000_000_000 // 1 billion tokens
    
    const holders = data.data.items.map((holder: any) => {
      const amount = Number(holder.amount) / Math.pow(10, holder.decimals)
      const percentage = (amount / TOTAL_SUPPLY) * 100
      
      return {
        wallet_address: holder.owner,
        token_amount: amount,
        percentage: percentage,
      }
    })
    .filter(holder => holder.token_amount > 0)
    .sort((a: any, b: any) => b.token_amount - a.token_amount)

    console.log('Transformed data. Number of holders:', holders.length)
    console.log('First holder example:', holders[0])

    // First, truncate both tables to remove ALL existing data
    console.log('Removing all existing data from planet_customizations...')
    const { error: truncateCustomizationsError } = await supabase
      .from('planet_customizations')
      .delete()
      .neq('wallet_address', 'dummy_value')

    if (truncateCustomizationsError) {
      console.error('Error truncating planet_customizations:', truncateCustomizationsError)
      throw truncateCustomizationsError
    }

    console.log('Removing all existing data from token_holders...')
    const { error: truncateHoldersError } = await supabase
      .from('token_holders')
      .delete()
      .neq('wallet_address', 'dummy_value')

    if (truncateHoldersError) {
      console.error('Error truncating token_holders:', truncateHoldersError)
      throw truncateHoldersError
    }

    // Insert new data
    console.log('Inserting new token holders...')
    const { error: insertError } = await supabase
      .from('token_holders')
      .insert(holders)

    if (insertError) {
      console.error('Error inserting new token holders:', insertError)
      throw insertError
    }

    console.log('Successfully updated token holders database')

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
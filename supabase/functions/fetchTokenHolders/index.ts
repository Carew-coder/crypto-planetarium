import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Fetching token holders data...')
    const tokenAddress = '7H7Au1DETfVTd1eMRY96m6R4J65ZFTGZAVZvmmiRpump'
    const apiToken = Deno.env.get('SOLSCAN_API_TOKEN')
    
    if (!apiToken) {
      throw new Error('SOLSCAN_API_TOKEN is not configured')
    }

    console.log('Making request to Solscan API...')
    const response = await fetch(`https://public-api.solscan.io/token/holders?tokenAddress=${tokenAddress}&offset=0&limit=1000`, {
      headers: {
        'accept': 'application/json',
        'token': apiToken,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Solscan API error: ${response.status} - ${errorText}`)
      throw new Error(`Solscan API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Successfully fetched token holders data:', data.data?.length || 0, 'holders')

    if (!data.data || !Array.isArray(data.data)) {
      console.error('Invalid response format from Solscan API:', data)
      throw new Error('Invalid response format from Solscan API')
    }

    // Process all holders without filtering
    const holders = data.data.map((holder: any) => {
      const amount = parseFloat(holder.amount)
      const total = parseFloat(holder.owner.total)
      const percentage = (amount / total) * 100

      return {
        wallet_address: holder.owner.address,
        token_amount: amount,
        percentage: percentage
      }
    })

    console.log('Processing all holders:', holders.length, 'total holders')

    // Get Supabase connection details from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // First, clear existing data
    const { error: clearError } = await supabase
      .from('token_holders')
      .delete()
      .neq('wallet_address', '')

    if (clearError) {
      console.error('Error clearing existing holders:', clearError)
      throw clearError
    }

    console.log('Cleared existing token holders data')

    // Also clear planet customizations since they reference token holders
    const { error: clearCustomizationsError } = await supabase
      .from('planet_customizations')
      .delete()
      .neq('wallet_address', '')

    if (clearCustomizationsError) {
      console.error('Error clearing existing customizations:', clearCustomizationsError)
      throw clearCustomizationsError
    }

    console.log('Cleared existing planet customizations')

    // Insert new data in batches of 100
    const batchSize = 100;
    for (let i = 0; i < holders.length; i += batchSize) {
      const batch = holders.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('token_holders')
        .insert(batch)

      if (insertError) {
        console.error(`Error inserting batch ${i/batchSize + 1}:`, insertError)
        throw insertError
      }
      console.log(`Successfully inserted batch ${i/batchSize + 1} of holders`)
    }

    console.log('Successfully inserted all token holders data')

    return new Response(
      JSON.stringify({ message: 'Token holders data updated successfully', count: holders.length }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error in fetchTokenHolders function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
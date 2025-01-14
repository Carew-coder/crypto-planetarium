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
    const tokenAddress = '7qa4Qxoa3JFY7S1CZMp3Ma3Du9jPUTSuSzk81ojWpump'
    
    // Fetch all holders with a larger limit
    const response = await fetch(`https://public-api.solscan.io/token/holders?tokenAddress=${tokenAddress}&offset=0&limit=1000`, {
      headers: {
        'accept': 'application/json',
        'token': Deno.env.get('SOLSCAN_API_TOKEN') || '',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Successfully fetched token holders data:', data.data.length, 'holders')

    // Process and filter holders
    const holders = data.data
      .filter((holder: any) => {
        const percentage = (parseFloat(holder.amount) / parseFloat(holder.owner.total)) * 100
        return percentage >= 0.01 // Only include holders with at least 0.01%
      })
      .map((holder: any) => {
        const amount = parseFloat(holder.amount)
        const total = parseFloat(holder.owner.total)
        const percentage = (amount / total) * 100

        return {
          wallet_address: holder.owner.address,
          token_amount: amount,
          percentage: percentage
        }
      })

    console.log('Processed holders data:', holders.length, 'significant holders')

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
      .neq('wallet_address', '') // Delete all records

    if (clearError) {
      console.error('Error clearing existing holders:', clearError)
      throw clearError
    }

    console.log('Cleared existing token holders data')

    // Insert new data
    const { error: insertError } = await supabase
      .from('token_holders')
      .insert(holders)

    if (insertError) {
      console.error('Error inserting new holders:', insertError)
      throw insertError
    }

    console.log('Successfully inserted new token holders data')

    return new Response(
      JSON.stringify({ message: 'Token holders data updated successfully' }),
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
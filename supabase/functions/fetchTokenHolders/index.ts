import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('Fetching token holders data...')
    const tokenAddress = '7qa4Qxoa3JFY7S1CZMp3Ma3Du9jPUTSuSzk81ojWpump'
    const response = await fetch(`https://public-api.solscan.io/token/holders?tokenAddress=${tokenAddress}&offset=0&limit=50`, {
      headers: {
        'accept': 'application/json',
        'token': Deno.env.get('SOLSCAN_API_TOKEN') || '',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Raw data fetched. Number of holders:', data.data?.length || 0)

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid data format received from API')
    }

    const totalAmount = data.data.reduce((sum: number, holder: any) => {
      return sum + (parseFloat(holder.amount) || 0)
    }, 0)

    console.log('Total amount calculated:', totalAmount)

    const holders = data.data
      .map((holder: any) => {
        const amount = parseFloat(holder.amount) || 0
        const percentage = (amount / totalAmount) * 100

        return {
          wallet_address: holder.owner,
          token_amount: amount,
          percentage: percentage,
        }
      })
      .filter(holder => holder.percentage >= 0.01) // Filter out holders with less than 0.01%
      .sort((a: any, b: any) => b.token_amount - a.token_amount)

    console.log('Transformed data. Number of significant holders:', holders.length)
    console.log('First holder example:', holders[0])

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables')
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
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error in fetchTokenHolders function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
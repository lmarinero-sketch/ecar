import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pxvhovctyewwppwkldaq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dmhvdmN0eWV3d3Bwd2tsZGFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MTY3NDQsImV4cCI6MjA4MjI5Mjc0NH0.-fHvp3Rs4RFcBD87_SYLA2xFw756_VSdkWhy0Q1ekNo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('fuel_loads').select('*').eq('load_number', 'SOL-MSNH2PMK').single();
  console.log("Data:", data);
  console.log("Error:", error);
}

test();

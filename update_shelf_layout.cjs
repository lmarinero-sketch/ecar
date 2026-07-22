const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pxvhovctyewwppwkldaq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dmhvdmN0eWV3d3Bwd2tsZGFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjcxNjc0NCwiZXhwIjoyMDgyMjkyNzQ0fQ.nQhpJ6t4KSn-uLlD1vTL_UzFVfgwal3yS4bN7WJpg3w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: shelves, error } = await supabase.from('warehouse_shelves').select('*');
  if (error) {
    console.error('Error fetching shelves:', error);
    return;
  }

  const updates = [];

  for (const shelf of shelves) {
    let col = 0, row = 0, w = 2, h = 2;

    switch (shelf.code) {
      case 'E1':
        col = 0.5; row = 0.5; w = 2.5; h = 4;
        break;
      case 'E2':
        col = 3.5; row = 0.5; w = 2.5; h = 4;
        break;
      case 'E3':
        col = 6.5; row = 0.5; w = 2.5; h = 4;
        break;
      case 'E4':
        col = 0.5; row = 5.5; w = 2.5; h = 4;
        break;
      case 'E5':
        col = 3.5; row = 5.5; w = 2.5; h = 4;
        break;
      case 'E6':
        col = 6.5; row = 5.5; w = 2.5; h = 4;
        break;
      case 'E-1':
        col = 9.25; row = 0.5; w = 0.5; h = 4;
        break;
      case 'E-':
        col = 9.25; row = 5.5; w = 0.5; h = 4;
        break;
      default:
        col = 1; row = 1;
        break;
    }

    updates.push({
      id: shelf.id,
      grid_col: col,
      grid_row: row,
      grid_width: w,
      grid_height: h
    });
  }

  console.log('Updating shelves...');
  for (const update of updates) {
    const { error: updError } = await supabase
      .from('warehouse_shelves')
      .update({
        grid_col: update.grid_col,
        grid_row: update.grid_row,
        grid_width: update.grid_width,
        grid_height: update.grid_height
      })
      .eq('id', update.id);
  }
  
  console.log('Fixed 0-indexed positions.');
}

run();

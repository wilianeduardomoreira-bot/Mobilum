import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xpmjzojgqedbauvsmxld.supabase.co';
const supabaseKey = 'sb_publishable_qVaHd3SzM8rFVwiEvYE4_Q_DizeIi1Z';

export const supabase = createClient(supabaseUrl, supabaseKey);
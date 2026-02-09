
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fgmsezzlhruztgeonhks.supabase.co';
const supabaseAnonKey = 'sb_publishable_1mpLoli_12DoddXZcev7Bw_AVbYGm9p';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

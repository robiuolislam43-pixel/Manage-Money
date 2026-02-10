
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dufhkbbegdxfjchiiwiy.supabase.co';
const supabaseAnonKey = 'sb_publishable_mr4BmN5Zpr2WQx0mUNOJUw_i_GSMlhF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

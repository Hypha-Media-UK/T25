import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export type Category = {
	id: string;
	name: string;
	min_age: number;
	sort_order: number;
};

export type Settings = {
	key: string;
	value: string;
};


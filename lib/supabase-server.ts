import { cookies, headers } from 'next/headers';

import {

createServerClient,

type CookieOptions,

} from '@supabase/ssr';

function makeCookieAdapter() {

const store = cookies();

return {

get(name: string) {

return store.get(name)?.value;

},

/**

* During server rendering we can no-op set/remove; route handlers can

* set cookies on the returned Response instead if needed.

*/

set(_name: string, _value: string,_ options: CookieOptions) {},

remove(_name: string, _options: CookieOptions) {},

};

}

export function createSupabaseServer() {

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {

throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');

}

return createServerClient(supabaseUrl, supabaseAnonKey, {

cookies: makeCookieAdapter(),

headers: { get: (key: string) => headers().get(key) ?? undefined },

});

}

/** Back-compat: some files import { createClient } from '@/lib/supabase-server' */

export const createClient = createSupabaseServer;

export default createSupabaseServer;

import { getAuth } from '@/lib/auth';

const handle = async (request: Request) => (await getAuth(request)).handler(request);

export const GET = handle;
export const POST = handle;

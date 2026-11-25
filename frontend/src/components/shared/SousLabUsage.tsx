import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/auth.context';
import { getSousLabUsage, type SousLabUsage } from '@/services/souslab.service';

export default function SousLabUsage() {
  const { user } = useAuth();
  const [state, setState] = useState<
    | { status: 'hidden' }
    | { status: 'error' }
    | { status: 'ready'; usage: SousLabUsage | null }
  >({ status: 'hidden' });

  useEffect(() => {
    setState({ status: 'hidden' });
    if (!user?.id) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      let permitted = true;
      try {
        const usage = await getSousLabUsage();
        if (active) setState({ status: 'ready', usage });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          permitted = false;
          if (active) setState({ status: 'hidden' });
        } else if (active) {
          setState({ status: 'error' });
        }
      } finally {
        if (active && permitted) timer = setTimeout(() => void refresh(), 15_000);
      }
    };
    void refresh();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user?.id]);

  if (state.status === 'hidden') return null;
  if (state.status === 'error') {
    return <p role="status" className="text-sm text-red-700">Unable to load SousLab usage.</p>;
  }
  if (!state.usage) {
    return (
      <p className="text-sm text-gray-600">
        SousLab usage is unavailable until this server receives quota headers from SousLab.
      </p>
    );
  }
  const { limit, remaining, resetAt, observedAt } = state.usage;
  const used = limit - remaining;
  return (
    <section className="space-y-1 rounded-lg border p-3" aria-labelledby="souslab-usage-heading">
      <h3 id="souslab-usage-heading" className="text-sm font-semibold">SousLab record usage</h3>
      <p className="text-sm">{used.toLocaleString()} of {limit.toLocaleString()} records used · {remaining.toLocaleString()} remaining</p>
      <progress
        className="h-3 w-full"
        aria-label="SousLab records used"
        value={used}
        max={limit}
      />
      <p className="text-xs text-gray-600">
        Last reported {new Date(observedAt).toLocaleString()}
        {resetAt !== null && ` · Resets ${new Date(resetAt * 1000).toLocaleString()}`}.
        This is the last balance seen by this server, not a live account total.
      </p>
    </section>
  );
}

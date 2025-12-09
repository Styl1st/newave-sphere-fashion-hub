import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';

export const useOpenTickets = () => {
  const { user } = useAuth();
  const { role } = useRole();
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  useEffect(() => {
    if (!user || role !== 'admin') {
      setOpenTicketsCount(0);
      return;
    }

    const fetchOpenTickets = async () => {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      if (!error && count !== null) {
        setOpenTicketsCount(count);
      }
    };

    fetchOpenTickets();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('support-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
        },
        () => {
          fetchOpenTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  return { openTicketsCount };
};

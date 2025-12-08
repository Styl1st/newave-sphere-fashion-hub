import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  product_id: string | null;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  product?: {
    id: string;
    name: string;
    images: string[] | null;
  };
  last_message?: Message;
  unread_count?: number;
}

export const useMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data: convos, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data for each conversation
      const enrichedConvos = await Promise.all(
        (convos || []).map(async (convo) => {
          const otherUserId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;

          // Fetch other user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', otherUserId)
            .maybeSingle();

          // Fetch product if exists
          let product = null;
          if (convo.product_id) {
            const { data: prod } = await supabase
              .from('products')
              .select('id, name, images')
              .eq('id', convo.product_id)
              .maybeSingle();
            product = prod;
          }

          // Fetch last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count unread messages
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('read', false)
            .neq('sender_id', user.id);

          return {
            ...convo,
            other_user: profile ? {
              id: profile.user_id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            } : undefined,
            product,
            last_message: lastMsg,
            unread_count: count || 0,
          };
        })
      );

      setConversations(enrichedConvos);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const startConversation = async (sellerId: string, productId?: string) => {
    if (!user) return null;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${sellerId}),and(participant_1.eq.${sellerId},participant_2.eq.${user.id})`)
      .eq('product_id', productId || null)
      .maybeSingle();

    if (existing) return existing.id;

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_1: user.id,
        participant_2: sellerId,
        product_id: productId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    await fetchConversations();
    return data.id;
  };

  const getUnreadCount = useCallback(() => {
    return conversations.reduce((acc, convo) => acc + (convo.unread_count || 0), 0);
  }, [conversations]);

  return {
    conversations,
    loading,
    startConversation,
    fetchConversations,
    getUnreadCount,
  };
};

export const useConversation = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      if (user) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('read', false);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // Mark as read if not sender
          if (user && newMessage.sender_id !== user.id) {
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const sendMessage = async (content: string) => {
    if (!user || !conversationId || !content.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return true;
  };

  return {
    messages,
    loading,
    sendMessage,
    fetchMessages,
  };
};

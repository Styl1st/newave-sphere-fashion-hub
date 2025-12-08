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
  product_id?: string | null;
  product?: {
    id: string;
    name: string;
    images: string[] | null;
    price: number;
  } | null;
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

      const enrichedConvos = await Promise.all(
        (convos || []).map(async (convo) => {
          const otherUserId = convo.participant_1 === user.id ? convo.participant_2 : convo.participant_1;

          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', otherUserId)
            .maybeSingle();

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

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

  // Real-time subscription for new messages (to update unread count)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  // Start or get existing conversation - ONE conversation per buyer-seller pair
  const startConversation = async (sellerId: string, initialProductId?: string) => {
    if (!user) return null;

    // Check if conversation already exists between these two users (ignore product_id)
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${sellerId}),and(participant_1.eq.${sellerId},participant_2.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      return { conversationId: existing.id, isNew: false, productId: initialProductId };
    }

    // Create new conversation (without product_id - products are now in messages)
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_1: user.id,
        participant_2: sellerId,
        product_id: null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    await fetchConversations();
    return { conversationId: data.id, isNew: true, productId: initialProductId };
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

      // Fetch product details for messages that have a product_id
      const messagesWithProducts = await Promise.all(
        (data || []).map(async (msg) => {
          if (msg.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('id, name, images, price')
              .eq('id', msg.product_id)
              .maybeSingle();
            return { ...msg, product };
          }
          return msg;
        })
      );

      setMessages(messagesWithProducts);

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

  // Real-time subscription for this conversation
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
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Fetch product if exists
          let messageWithProduct = newMessage;
          if (newMessage.product_id) {
            const { data: product } = await supabase
              .from('products')
              .select('id, name, images, price')
              .eq('id', newMessage.product_id)
              .maybeSingle();
            messageWithProduct = { ...newMessage, product };
          }
          
          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, messageWithProduct];
          });
          
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

  const sendMessage = async (content: string, productId?: string | null) => {
    if (!user || !conversationId || !content.trim()) return;

    // Optimistic update
    const tempId = crypto.randomUUID();
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      read: false,
      created_at: new Date().toISOString(),
      product_id: productId || null,
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        product_id: productId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      return false;
    }

    // Replace optimistic message with real one (fetch product if needed)
    let messageWithProduct: Message = { ...data, product: null };
    if (data.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('id, name, images, price')
        .eq('id', data.product_id)
        .maybeSingle();
      messageWithProduct = { ...data, product };
    }
    
    setMessages((prev) => prev.map(m => m.id === tempId ? messageWithProduct : m));

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
